import cron from 'node-cron';
import { Appointment } from '../models/appointment.model.js';
import axios from 'axios';
import FormData from 'form-data';

/**
 * Sends a WhatsApp reminder for a specific appointment
 */
const sendReminder = async (appt) => {
    let recipientPhone = (appt.details?.phone || '').replace(/\D/g, '');
    if (recipientPhone && !recipientPhone.startsWith('91')) {
        recipientPhone = `91${recipientPhone}`;
    }

    if (!recipientPhone) {
        console.log(`Skipping reminder for ${appt.patientName}: No phone number found.`);
        return;
    }

    const messageText = `Reminder: Hello ${appt.patientName},\n\nYou have an appointment today with ${appt.therapistName} at ${appt.branch} at ${appt.time}.\n\nSee you soon!\nH2F Rehab 🚀`;

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
        console.log(`Reminder sent successfully to ${appt.patientName} (${recipientPhone})`);
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            console.error(`WhatsApp API Error for ${appt.patientName}:`, error.response.status, error.response.data);
        } else {
            console.error(`Failed to send reminder to ${appt.patientName}:`, error.message);
        }
    }
};

/**
 * Checks for today's appointments and sends reminders
 */
export const checkAndSendDailyReminders = async () => {
    console.log('--- Checking for Daily Appointment Reminders ---');

    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // Find all confirmed or pending appointments for today
        const appointments = await Appointment.find({
            appointmentDate: {
                $gte: todayStart,
                $lte: todayEnd
            },
            status: { $in: ['CONFIRMED', 'PENDING'] }
        });

        console.log(`Found ${appointments.length} appointments for today (${new Date().toDateString()}).`);

        for (const appt of appointments) {
            await sendReminder(appt);
        }

        console.log('--- Daily Reminder Check Completed ---');
    } catch (error) {
        console.error('Error in checkAndSendDailyReminders:', error);
    }
};

/**
 * Initializes the 9:00 AM daily cron job
 */
export const initReminderCron = () => {
    console.log('Reminder Service: Initializing 9:00 AM daily cron job...');

    // Schedule task to run at 9:00 AM every day
    // Cron pattern: minute hour day-of-month month day-of-week
    cron.schedule('0 9 * * *', () => {
        checkAndSendDailyReminders();
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata" // Setting timezone to India as per user's location
    });

    console.log('Reminder Service: Cron job scheduled successfully.');
};
