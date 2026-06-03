import { Patient } from '../models/patient.model.js';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

export const sendCampaign = async (req, res) => {
    try {
        if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
            return res.status(403).json({ success: false, message: "Only admins and superadmins can send campaigns" });
        }

        const { text } = req.body;
        const file = req.file;

        const patients = await Patient.find({});
        
        let successCount = 0;
        let failCount = 0;

        for (const patient of patients) {
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
                
                if (file) {
                    form.append('type', 'media');
                    form.append('message', messageText);
                    form.append('media_file', fs.createReadStream(file.path));
                } else {
                    form.append('type', 'text');
                    form.append('message', messageText);
                }

                await axios.post("https://wtservices.ackrock.com/api/send/whatsapp", form, {
                    headers: form.getHeaders(),
                });
                successCount++;
            } catch (error) {
                console.error(`Failed to send campaign to ${patient.name} (${recipientPhone}):`, error.message);
                failCount++;
            }
        }

        if (file) {
            try {
                fs.unlinkSync(file.path);
            } catch (err) {
                console.error("Failed to delete temp campaign file:", err);
            }
        }

        return res.status(200).json({
            success: true,
            message: `Campaign sent successfully. Success: ${successCount}, Failed: ${failCount}`,
            stats: { successCount, failCount }
        });
    } catch (error) {
        console.error("Error sending campaign:", error);
        return res.status(500).json({
            success: false,
            message: "Error sending campaign",
            error: error.message
        });
    }
};
