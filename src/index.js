import dotenv from 'dotenv'
import app from './app.js';
import connectDB from './config/database.js';
import { initReminderCron } from './services/reminder.service.js';
import { initNotificationCron } from './services/notification.service.js';


dotenv.config({
    path: "./.env"
})

const startServer = async () => {
    try {
        await connectDB();

        const PORT = process.env.PORT || 8000;

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Visit: http://localhost:${PORT}`);
            
            // Initialize daily WhatsApp reminders
            initReminderCron();

            // Initialize consultation end notifications cron
            initNotificationCron();
        });

    } catch (error) {
        console.log("Error starting server:", error);
    }
}

startServer();