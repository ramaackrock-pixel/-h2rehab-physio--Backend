import { Appointment } from '../models/appointment.model.js';
import mongoose from 'mongoose';
import axios from 'axios';
import FormData from 'form-data';

// Create a new appointment with conflict checking
export const createAppointment = async (req, res) => {
    try {
        const {
            patientId,
            patientName,
            therapistId,
            therapistName,
            appointmentDate, // Full ISO date-time string
            duration, // in minutes
            branch,
            sessionType,
            status,
            details
        } = req.body;

        const startA = new Date(appointmentDate);
        const endA = new Date(startA.getTime() + duration * 60000);

        // Conflict check: Does this therapist have any overlapping appointments?
        // Logic: (startA < existingEnd) AND (endA > existingStart)

        // We need to find all appointments for this therapist on the same day
        // or just any overlapping ones.
        const overlappingAppointment = await Appointment.findOne({
            therapistId,
            branch,
            status: { $ne: 'CANCELLED' },
            $or: [
                {
                    // Existing appointment starts before new one ends and ends after new one starts
                    $and: [
                        { appointmentDate: { $lt: endA } },
                        {
                            $expr: {
                                $gt: [
                                    { $add: ["$appointmentDate", { $multiply: ["$duration", 60000] }] },
                                    startA
                                ]
                            }
                        }
                    ]
                }
            ]
        });

        if (overlappingAppointment) {
            return res.status(409).json({
                success: false,
                message: "Appointment conflict: The therapist already has an appointment during this time.",
                conflict: {
                    time: overlappingAppointment.time,
                    patient: overlappingAppointment.patientName
                }
            });
        }

        // Generate initials for patient
        const initials = patientName
            .split(' ')
            .map(n => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();

        const appointment = new Appointment({
            patientId,
            patientName,
            therapistId,
            therapistName,
            appointmentDate: startA,
            time: startA.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
            duration,
            branch,
            sessionType,
            status: status || 'PENDING',
            details,
            initials
        });

        await appointment.save();

        // --- WhatsApp Notification ---
        let recipientPhone = (details?.phone || '').replace(/\D/g, '');
        if (recipientPhone && !recipientPhone.startsWith('91')) {
            recipientPhone = `91${recipientPhone}`;
        }
        if (!recipientPhone) recipientPhone = '919385500546'; // Using the test number as default if empty
        const formattedDate = startA.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const messageText = `Hello ${patientName},\n\nYour appointment with ${therapistName} at ${branch} has been successfully scheduled for ${formattedDate} at ${appointment.time}.\n\nThank you,\nH2F Rehab 🚀`;

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
            console.log("WhatsApp message sent successfully to", recipientPhone);
        } catch (waError) {
            if (axios.isAxiosError(waError)) {
                if (waError.response) {
                    console.error("WhatsApp API Error:", waError.response.status, waError.response.data);
                } else if (waError.request) {
                    console.error("WhatsApp Network Error - No Response:", waError.request);
                } else {
                    console.error("WhatsApp Request Setup Error:", waError.message);
                }
            } else {
                console.error("Failed to send WhatsApp message:", waError.message);
            }
        }
        // ----------------------------

        return res.status(201).json({
            success: true,
            message: "Appointment scheduled successfully",
            appointment
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Error scheduling appointment",
            error: error.message
        });
    }
};

// Get all appointments with filters
export const getAllAppointments = async (req, res) => {
    try {
        const { date, therapistId, status, branch } = req.query;
        let query = {};

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            query.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
        }

        if (therapistId) query.therapistId = therapistId;
        if (status) query.status = status;
        
        // Enforce branch filter for staff users; allow admins/superadmins to see all or query by branch
        if (req.user && req.user.constructor.modelName === 'Staff') {
            if (req.user.branch) {
                query.branch = req.user.branch;
            }
        } else if (branch) {
            query.branch = branch;
        }

        const appointments = await Appointment.find(query).sort({ appointmentDate: 1 });

        return res.status(200).json({
            success: true,
            count: appointments.length,
            appointments
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching appointments",
            error: error.message
        });
    }
};

// Update appointment status
export const updateAppointmentStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: `Appointment status updated to ${status}`,
            appointment
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Error updating appointment status",
            error: error.message
        });
    }
};

// Full update of appointment
export const updateAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            therapistId,
            appointmentDate,
            duration,
            branch,
            status
        } = req.body;

        // If time/therapist/branch is changing, check for conflicts
        if (appointmentDate || therapistId || branch) {
            const appointment = await Appointment.findById(id);
            if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found" });

            const checkTherapistId = therapistId || appointment.therapistId;
            const checkBranch = branch || appointment.branch;
            const checkDate = appointmentDate ? new Date(appointmentDate) : appointment.appointmentDate;
            const checkDuration = duration || appointment.duration;

            const startA = new Date(checkDate);
            const endA = new Date(startA.getTime() + checkDuration * 60000);

            const overlappingAppointment = await Appointment.findOne({
                _id: { $ne: id },
                therapistId: checkTherapistId,
                branch: checkBranch,
                status: { $ne: 'CANCELLED' },
                $and: [
                    { appointmentDate: { $lt: endA } },
                    {
                        $expr: {
                            $gt: [
                                { $add: ["$appointmentDate", { $multiply: ["$duration", 60000] }] },
                                startA
                            ]
                        }
                    }
                ]
            });

            if (overlappingAppointment) {
                return res.status(409).json({
                    success: false,
                    message: "Conflict: The therapist already has an appointment in this branch during this time.",
                    conflict: {
                        time: overlappingAppointment.time,
                        patient: overlappingAppointment.patientName
                    }
                });
            }
        }

        const updateData = { ...req.body };
        if (req.body.appointmentDate) {
            const startA = new Date(req.body.appointmentDate);
            updateData.appointmentDate = startA;
            updateData.time = startA.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        }

        const appointment = await Appointment.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            success: true,
            message: "Appointment updated successfully",
            appointment
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Error updating appointment",
            error: error.message
        });
    }
};

// Delete/Cancel appointment
export const deleteAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findByIdAndDelete(req.params.id);
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }
        return res.status(200).json({
            success: true,
            message: "Appointment deleted successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error deleting appointment",
            error: error.message
        });
    }
};

// Check in patient to consultation
export const checkinAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            {
                liveStatus: 'CHECKED_IN',
                checkedInAt: new Date()
            },
            { new: true, runValidators: true }
        );

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Patient checked in successfully for consultation",
            appointment
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Error checking in patient",
            error: error.message
        });
    }
};

// Check out patient from consultation
export const checkoutAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            {
                liveStatus: 'CHECKED_OUT',
                checkedOutAt: new Date(),
                status: 'COMPLETED'
            },
            { new: true, runValidators: true }
        );

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Patient checked out successfully from consultation",
            appointment
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Error checking out patient",
            error: error.message
        });
    }
};
