// Main Application Entry Point - ESM Mode Enabled
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import adminRouter from './routes/admin.route.js'
import patientRouter from './routes/patient.routes.js'
import appointmentRouter from './routes/appointment.routes.js'
import staffRouter from './routes/staff.routes.js'
import billingRouter from './routes/billing.routes.js'
import dashboardRouter from './routes/dashboard.routes.js'
import medicalRecordRouter from './routes/medicalRecord.routes.js'
import branchRouter from './routes/branch.routes.js'
import admissionRouter from './routes/admission.routes.js'
import doctorRouter from './routes/doctor.routes.js'
import reportRouter from './routes/report.routes.js'
import serviceRouter from './routes/service.routes.js'
import packageRouter from './routes/package.routes.js'
import notificationRouter from './routes/notification.routes.js'

const app = express();

app.use(cors({
    origin: [
        'https://health2fit.ackrock.com',
        'http://health2fit.ackrock.com',
        'http://localhost:5173',
        'http://127.0.0.1:5173'
    ],
    credentials: true
}))

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))
app.use(cookieParser())

// Serve static files from public/uploads
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

app.use("/api/v1/admin", adminRouter)
app.use("/api/v1/patients", patientRouter)
app.use("/api/v1/appointments", appointmentRouter)
app.use("/api/v1/staff", staffRouter)
app.use("/api/v1/billing", billingRouter)
app.use("/api/v1/dashboard", dashboardRouter)
app.use("/api/v1/records", medicalRecordRouter)
app.use("/api/v1/branches", branchRouter)
app.use("/api/v1/admissions", admissionRouter)
app.use("/api/v1/doctors", doctorRouter)
app.use("/api/v1/reports", reportRouter)
app.use("/api/v1/services", serviceRouter)
app.use("/api/v1/packages", packageRouter)
app.use("/api/v1/notifications", notificationRouter)

export default app;
