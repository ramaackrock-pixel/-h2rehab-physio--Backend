import { Patient } from '../models/patient.model.js';
import { Appointment } from '../models/appointment.model.js';
import { Billing } from '../models/billing.model.js';
import { Admin } from '../models/admin.model.js';
import { Staff } from '../models/staff.model.js';
export const getDashboardStats = async (req, res) => {
    try {
        const { branch } = req.query;
        let query = {};
        if (branch && branch !== 'All Branches') {
            query.branch = branch;
        }

        // 1. Total Patients
        const totalPatients = await Patient.countDocuments(query);

        // 2. Total Appointments (Today and Future)
        const totalAppointments = await Appointment.countDocuments(query);

        // 3. Active Invoices (Not Paid)
        // Note: Billing model might not have branch directly, usually linked via Patient
        // For now, we'll just count all or filter by patient names if needed, 
        // but simplified for this phase.
        const activeInvoices = await Billing.countDocuments({ status: { $ne: 'PAID' } });

        // 4. Clinic Staff
        const staffCount = await Staff.countDocuments(branch && branch !== 'All Branches' ? { branch } : {});

        // 5. Recent Patients (Last 5)
        const recentPatients = await Patient.find(query).sort({ createdAt: -1 }).limit(5);

        // 6. Upcoming Appointments (Next 5)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcomingAppointments = await Appointment.find({
            ...query,
            appointmentDate: { $gte: today },
            status: { $in: ['CONFIRMED', 'PENDING'] }
        }).sort({ appointmentDate: 1 }).limit(5);

        return res.status(200).json({
            success: true,
            stats: {
                totalPatients,
                totalAppointments,
                activeInvoices,
                staffCount
            },
            recentPatients,
            upcomingAppointments
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching dashboard stats",
            error: error.message
        });
    }
};
