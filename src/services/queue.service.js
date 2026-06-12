import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { Appointment } from '../models/appointment.model.js';
import { Patient } from '../models/patient.model.js';
import mongoose from 'mongoose';
import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

// Assuming local Redis default configuration
const connection = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null
});

// Create the Queue
export const appointmentReminderQueue = new Queue('appointment-reminders', { connection });

// Send WhatsApp Message function
const sendWhatsappReminder = async (jobData) => {
    const { patientName, therapistName, branch, time, phone } = jobData;

    let recipientPhone = (phone || '').replace(/\D/g, '');
    if (recipientPhone && !recipientPhone.startsWith('91')) {
        recipientPhone = `91${recipientPhone}`;
    }

    if (!recipientPhone) {
        console.log(`Skipping 30-min reminder for ${patientName}: No phone number found.`);
        return;
    }

    const messageText = `Reminder: Hello ${patientName},\n\nYour appointment with ${therapistName} at ${branch} is coming up at ${time}. We will see you soon!\n\nH2F Rehab 🚀`;

    try {
        const form = new FormData();
        form.append('secret', process.env.WHATSAPP_API_SECRET);
        form.append('account', process.env.WHATSAPP_API_ACCOUNT);
        form.append('recipient', recipientPhone);
        form.append('type', 'text');
        form.append('message', messageText);

        await axios.post("https://wtservices.ackrock.com/api/send/whatsapp", form, {
            headers: form.getHeaders(),
        });
        console.log(`30-min Reminder sent successfully to ${patientName} (${recipientPhone})`);
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            console.error(`WhatsApp API Error for 30-min reminder (${patientName}):`, error.response.status, error.response.data);
        } else {
            console.error(`Failed to send 30-min reminder to ${patientName}:`, error.message);
        }
        throw error; // Let BullMQ handle retries
    }
};

// Create the Worker
export const appointmentReminderWorker = new Worker('appointment-reminders', async job => {
    const { appointmentId } = job.data;
    
    console.log(`Processing delayed 30-min reminder for appointment ${appointmentId}`);

    // Verify appointment still exists and is not cancelled
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment || appointment.status === 'CANCELLED') {
        console.log(`Job ${job.id}: Appointment ${appointmentId} not found or cancelled. Skipping.`);
        return;
    }

    // Check patient consent
    try {
        const patientRecord = await Patient.findOne({
            $or: [
                { pid: appointment.patientId },
                { _id: mongoose.Types.ObjectId.isValid(appointment.patientId) ? appointment.patientId : null }
            ]
        });
        if (patientRecord && patientRecord.whatsappConsent === false) {
            console.log(`Job ${job.id}: Skipping reminder for ${appointment.patientName}: Consent not given.`);
            return;
        }
    } catch (consentError) {
        console.error(`Job ${job.id}: Error checking patient WhatsApp consent:`, consentError.message);
    }

    await sendWhatsappReminder(job.data);

    // Mark reminder as sent
    await Appointment.findByIdAndUpdate(appointmentId, { reminderSent: true });

}, { connection });

appointmentReminderWorker.on('completed', job => {
    console.log(`Reminder Job ${job.id} has completed successfully!`);
});

appointmentReminderWorker.on('failed', (job, err) => {
    console.error(`Reminder Job ${job.id} has failed: ${err.message}`);
});

// Create Campaign Queue
export const campaignQueue = new Queue('campaign-messages', { connection });

// Create Campaign Worker
export const campaignWorker = new Worker('campaign-messages', async job => {
    const { text, patientIds, filePath } = job.data;
    console.log(`Processing campaign job ${job.id}`);

    const patients = await Patient.find({ _id: { $in: patientIds } });
    const totalPatients = patients.length;
    let successCount = 0;
    let failCount = 0;
    let currentIndex = 0;

    for (const patient of patients) {
        currentIndex++;
        // Report progress
        await job.updateProgress({ current: currentIndex, total: totalPatients });

        if (patient.whatsappConsent === false) {
            console.log(`Skipping campaign for ${patient.name}: Consent not given.`);
            continue;
        }

        let recipientPhone = (patient.contact || '').replace(/\D/g, '');
        if (recipientPhone && !recipientPhone.startsWith('91')) {
            recipientPhone = `91${recipientPhone}`;
        }

        if (!recipientPhone || recipientPhone.length < 10) {
            failCount++;
            continue;
        }

        const messageText = `Hi ${patient.name},\n\n${text || ''}`;
        
        try {
            const form = new FormData();
            form.append('secret', process.env.WHATSAPP_API_SECRET);
            form.append('account', process.env.WHATSAPP_API_ACCOUNT);
            form.append('recipient', recipientPhone);
            
            if (filePath) {
                form.append('type', 'media');
                form.append('message', messageText);
                form.append('media_file', fs.createReadStream(filePath));
            } else {
                form.append('type', 'text');
                form.append('message', messageText);
            }

            await axios.post("https://wtservices.ackrock.com/api/send/whatsapp", form, {
                headers: form.getHeaders(),
            });
            successCount++;

            // Record that this patient received the campaign
            await Patient.findByIdAndUpdate(patient._id, { campaignSentOn: new Date() });
        } catch (error) {
            console.error(`Failed to send campaign to ${patient.name} (${recipientPhone}):`, error.message);
            failCount++;
        }

        // Delay to respect rate limit (100 msgs per minute -> 1 msg every ~600ms)
        await new Promise(resolve => setTimeout(resolve, 650));
    }

    if (filePath) {
        try {
            fs.unlinkSync(filePath);
        } catch (err) {
            console.error("Failed to delete temp campaign file:", err);
        }
    }

    console.log(`Campaign ${job.id} completed. Success: ${successCount}, Failed: ${failCount}`);
}, { connection, concurrency: 1 });

campaignWorker.on('completed', job => {
    console.log(`Campaign Job ${job.id} has completed successfully!`);
});

campaignWorker.on('failed', (job, err) => {
    console.error(`Campaign Job ${job.id} has failed: ${err.message}`);
});
