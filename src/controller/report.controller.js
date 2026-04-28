import { Patient } from '../models/patient.model.js';
import { Billing } from '../models/billing.model.js';

export const getReportsData = async (req, res) => {
    try {
        let { timeRange } = req.query; // 1Y, 6M, 3M, TODAY
        const userRole = req.admin?.role || req.user?.role;
        const branch = req.admin?.branch || req.user?.branch;

        // Force timeRange to TODAY for staff
        if (userRole === "staff") {
            timeRange = "TODAY";
        }

        const now = new Date();
        let startDate = new Date();

        if (timeRange === "1Y") {
            startDate.setFullYear(now.getFullYear() - 1);
        } else if (timeRange === "6M") {
            startDate.setMonth(now.getMonth() - 6);
        } else if (timeRange === "3M") {
            startDate.setMonth(now.getMonth() - 3);
        } else if (timeRange === "TODAY") {
            startDate.setHours(0, 0, 0, 0);
        } else {
            startDate.setFullYear(now.getFullYear() - 1);
        }

        let patientQuery = { createdAt: { $gte: startDate } };
        let invoiceQuery = { date: { $gte: startDate } };

        // Ensure staff only sees their branch
        if (userRole === "staff" && branch) {
            patientQuery.branch = branch;
            invoiceQuery.branch = branch; // Depending on how invoice is structured
        }

        const patients = await Patient.find(patientQuery);
        const invoices = await Billing.find(invoiceQuery);

        res.status(200).json({ patients, invoices });
    } catch (error) {
        console.error("Failed to generate report data", error);
        res.status(500).json({ message: "Failed to generate report data", error: error.message });
    }
};
