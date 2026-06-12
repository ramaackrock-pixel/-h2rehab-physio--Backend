import { campaignQueue } from '../services/queue.service.js';

export const sendCampaign = async (req, res) => {
    try {
        if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
            return res.status(403).json({ success: false, message: "Only admins and superadmins can send campaigns" });
        }

        const { text, patientIds } = req.body;
        const file = req.file;

        let parsedPatientIds = [];
        try {
            if (patientIds) {
                parsedPatientIds = JSON.parse(patientIds);
            }
        } catch (e) {
            console.error("Error parsing patientIds:", e);
        }

        if (parsedPatientIds.length === 0) {
            return res.status(400).json({ success: false, message: "No patients selected" });
        }

        // Enqueue the job for background processing
        await campaignQueue.add('send-campaign', {
            text: text,
            patientIds: parsedPatientIds,
            filePath: file ? file.path : null
        });

        return res.status(200).json({
            success: true,
            message: "Campaign queued successfully. Messages will be sent in the background at a safe rate."
        });
    } catch (error) {
        console.error("Error queueing campaign:", error);
        return res.status(500).json({
            success: false,
            message: "Error queueing campaign",
            error: error.message
        });
    }
};

export const getCampaignStatus = async (req, res) => {
    try {
        const activeJobs = await campaignQueue.getJobs(['active']);
        const waitingJobs = await campaignQueue.getJobs(['waiting', 'delayed']);
        
        if (activeJobs.length > 0) {
            const job = activeJobs[0];
            const progress = job.progress || { current: 0, total: 0 };
            return res.status(200).json({
                success: true,
                isActive: true,
                current: progress.current || 0,
                total: progress.total || 0,
                message: "Campaign is currently sending..."
            });
        } else if (waitingJobs.length > 0) {
            return res.status(200).json({
                success: true,
                isActive: true,
                current: 0,
                total: 0,
                message: "Campaign is queued and waiting to start..."
            });
        }

        return res.status(200).json({
            success: true,
            isActive: false,
            message: "No active campaigns."
        });
    } catch (error) {
        console.error("Error getting campaign status:", error);
        return res.status(500).json({
            success: false,
            message: "Error getting campaign status",
            error: error.message
        });
    }
};

import { Patient } from '../models/patient.model.js';

export const resetCampaignBadges = async (req, res) => {
    try {
        if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
            return res.status(403).json({ success: false, message: "Only admins and superadmins can reset campaign badges" });
        }

        await Patient.updateMany({}, { $set: { campaignSentOn: null } });

        return res.status(200).json({
            success: true,
            message: "All campaign badges have been successfully reset."
        });
    } catch (error) {
        console.error("Error resetting campaign badges:", error);
        return res.status(500).json({
            success: false,
            message: "Error resetting campaign badges",
            error: error.message
        });
    }
};
