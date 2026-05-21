import cron from 'node-cron';
import { Appointment } from '../models/appointment.model.js';
import { Patient } from '../models/patient.model.js';
import { Notification } from '../models/notification.model.js';

/**
 * Scans active consultations and raises warnings if their session is about to end
 */
export const checkConsultationDurations = async () => {
    console.log('--- Checking Consultation Durations for Ending Sessions ---');
    try {
        const activeCheckins = await Appointment.find({ liveStatus: 'CHECKED_IN' });
        console.log(`Found ${activeCheckins.length} active consultations.`);

        const now = new Date();

        for (const appt of activeCheckins) {
            if (!appt.checkedInAt) continue;

            const elapsedMinutes = (now.getTime() - appt.checkedInAt.getTime()) / (60 * 1000);
            const warningThreshold = appt.duration - 5;

            console.log(`Appointment ${appt._id} (${appt.patientName}): Checked in at ${appt.checkedInAt.toLocaleTimeString()}, Duration: ${appt.duration}m, Elapsed: ${elapsedMinutes.toFixed(1)}m. Warning threshold: ${warningThreshold}m.`);

            if (elapsedMinutes >= warningThreshold) {
                // Check if a warning was already generated for this appointment
                const existingNotification = await Notification.findOne({
                    appointmentId: appt._id,
                    type: 'CONSULTATION_ENDING'
                });

                if (!existingNotification) {
                    // Fetch Patient for their PID
                    const patient = await Patient.findById(appt.patientId);
                    const patientPid = patient ? patient.pid : 'Unknown';

                    const messageText = `THE PATIENT ${appt.patientName} (${patientPid}) WITH CONSULTED DOCTOR ${appt.therapistName} APPOINTMENT IS GOING TO END WITHIN 5 MINUTES`;

                    const notification = new Notification({
                        appointmentId: appt._id,
                        patientId: appt.patientId,
                        patientName: appt.patientName,
                        patientPid: patientPid,
                        doctorName: appt.therapistName,
                        message: messageText,
                        type: 'CONSULTATION_ENDING'
                    });

                    await notification.save();
                    console.log(`[ALERT] Created warning notification for patient ${patientPid} with Dr. ${appt.therapistName}.`);
                }
            }
        }
    } catch (error) {
        console.error("Error checking consultation durations:", error);
    }
};

/**
 * Initializes the minute-by-minute consultation watcher cron job
 */
export const initNotificationCron = () => {
    console.log('Notification Service: Initializing consultation watcher cron (every minute)...');

    // Cron pattern: runs every minute
    cron.schedule('* * * * *', () => {
        checkConsultationDurations();
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata" // Setting timezone to India as per user's location
    });

    console.log('Notification Service: Watcher cron job scheduled successfully.');
};
