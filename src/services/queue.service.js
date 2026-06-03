import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { Appointment } from '../models/appointment.model.js';
import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';
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
