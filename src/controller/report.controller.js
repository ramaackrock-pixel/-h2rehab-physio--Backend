import { Patient } from '../models/patient.model.js';
import { Billing } from '../models/billing.model.js';

export const getReportsData = async (req, res) => {
    try {
        let { timeRange, branch } = req.query; // 1Y, 6M, 3M, TODAY, branch
        const userRole = req.admin?.role || req.user?.role;
        const userBranch = req.admin?.branch || req.user?.branch;

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

        // Determine branch filter: staff is forced to userBranch; others can pass branch in query
        const selectedBranch = userRole === "staff" ? userBranch : branch;

        if (selectedBranch && selectedBranch !== "All Branches") {
            patientQuery.branch = selectedBranch;
            
            // Query patients of this branch to filter invoices correctly (since Billing has no branch field)
            const branchPatients = await Patient.find({ branch: selectedBranch }).select('_id');
            const patientIds = branchPatients.map(p => p._id);
            invoiceQuery.patientId = { $in: patientIds };
        }

        const patients = await Patient.find(patientQuery);
        const invoices = await Billing.find(invoiceQuery);

        res.status(200).json({ patients, invoices });
    } catch (error) {
        console.error("Failed to generate report data", error);
        res.status(500).json({ message: "Failed to generate report data", error: error.message });
    }
};
