import { Appointment } from '../models/appointment.model.js';
import { Patient } from '../models/patient.model.js';
import mongoose from 'mongoose';
import axios from 'axios';
import FormData from 'form-data';
import { appointmentReminderQueue } from '../services/queue.service.js';

// Create a new appointment with conflict checking
export const createAppointment = async (req, res) => {
    try {
        const {
            patientId,
            patientName,
            therapistId,
            therapistName,
            doctorId,
            doctorName,
            therapists,
            appointmentDate, // Full ISO date-time string
            duration, // in minutes
            branch,
            sessionType,
            status,
            details
        } = req.body;

        const startA = new Date(appointmentDate);
        const endA = new Date(startA.getTime() + duration * 60000);

        let conflictUserQueries = [];
        if (doctorId) conflictUserQueries.push({ doctorId });
        if (therapists && therapists.length > 0) {
            const tIds = therapists.map(t => t.id);
            conflictUserQueries.push({ 'therapists.id': { $in: tIds } });
            conflictUserQueries.push({ therapistId: { $in: tIds } });
        } else if (therapistId) {
            conflictUserQueries.push({ therapistId });
        }

        let overlappingAppointment = null;
        if (conflictUserQueries.length > 0) {
            overlappingAppointment = await Appointment.findOne({
                branch,
                status: { $ne: 'CANCELLED' },
                $and: [
                    { $or: conflictUserQueries },
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
        }

        if (overlappingAppointment) {
            return res.status(409).json({
                success: false,
                message: "Appointment conflict: The doctor or therapist already has an appointment during this time.",
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

        const primaryTherapistId = therapists && therapists.length > 0 ? therapists[0].id : therapistId;
        const primaryTherapistName = therapists && therapists.length > 0 ? therapists[0].name : therapistName;

        const appointment = new Appointment({
            patientId,
            patientName,
            therapistId: primaryTherapistId || null,
            therapistName: primaryTherapistName || null,
            doctorId: doctorId || null,
            doctorName: doctorName || null,
            therapists,
            appointmentDate: startA,
            time: req.body.time || startA.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
            duration,
            branch,
            sessionType,
            status: status || 'PENDING',
            details,
            initials
        });

        await appointment.save();

        const displayName = doctorName || primaryTherapistName || 'H2F Staff';

        // --- Schedule 30-min Delayed Reminder ---
        try {
            const reminderTime = startA.getTime() - (30 * 60 * 1000);
            const delay = Math.max(0, reminderTime - Date.now()); // If < 30 mins, send immediately (delay 0)
            
            const job = await appointmentReminderQueue.add("appointment-reminder", {
                appointmentId: appointment._id,
                patientName,
                therapistName: displayName,
                branch,
                time: appointment.time,
                phone: details?.phone
            }, {
                delay,
                attempts: 3,
                backoff: { type: "exponential", delay: 60000 }
            });
            
            appointment.reminderJobId = job.id;
            await appointment.save();
        } catch (jobError) {
            console.error("Failed to schedule reminder job:", jobError);
        }

        // --- WhatsApp Notification ---
        if (status === 'CONFIRMED') {
            try {
                const patientRecord = await Patient.findOne({
                    $or: [
                        { pid: patientId },
                        { _id: mongoose.Types.ObjectId.isValid(patientId) ? patientId : null }
                    ]
                });

                if (patientRecord && patientRecord.whatsappConsent === false) {
                    console.log(`Skipping WhatsApp confirmation for ${patientName}: Consent not given.`);
                } else {
                    let recipientPhone = (details?.phone || '').replace(/\D/g, '');
                    if (recipientPhone && !recipientPhone.startsWith('91')) {
                        recipientPhone = `91${recipientPhone}`;
                    }
                    if (!recipientPhone) recipientPhone = '919385500546'; // Using the test number as default if empty
                    const formattedDate = startA.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                    const messageText = `Hello ${patientName},\n\nYour appointment with ${displayName} at ${branch} has been successfully scheduled for ${formattedDate} at ${appointment.time}.\n\nThank you,\nH2F Rehab 🚀`;

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
                }
            } catch (consentError) {
                console.error("Error checking patient WhatsApp consent:", consentError.message);
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

        if (therapistId) {
            query.$or = [
                { therapistId },
                { 'therapists.id': therapistId },
                { doctorId: therapistId }
            ];
        }
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
            doctorId,
            therapists,
            appointmentDate,
            duration,
            branch,
            status
        } = req.body;

        // If time/therapist/branch is changing, check for conflicts
        const appointment = await Appointment.findById(id);
        if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found" });

        if (appointmentDate || therapistId || doctorId || therapists || branch) {
            const checkBranch = branch || appointment.branch;
            const checkDate = appointmentDate ? new Date(appointmentDate) : appointment.appointmentDate;
            const checkDuration = duration || appointment.duration;

            const startA = new Date(checkDate);
            const endA = new Date(startA.getTime() + checkDuration * 60000);

            let conflictUserQueries = [];
            const dId = doctorId !== undefined ? doctorId : appointment.doctorId;
            if (dId) conflictUserQueries.push({ doctorId: dId });
            
            const tList = therapists !== undefined ? therapists : appointment.therapists;
            if (tList && tList.length > 0) {
                const tIds = tList.map(t => t.id);
                conflictUserQueries.push({ 'therapists.id': { $in: tIds } });
                conflictUserQueries.push({ therapistId: { $in: tIds } });
            } else {
                const tId = therapistId !== undefined ? therapistId : appointment.therapistId;
                if (tId) conflictUserQueries.push({ therapistId: tId });
            }

            let overlappingAppointment = null;
            if (conflictUserQueries.length > 0) {
                overlappingAppointment = await Appointment.findOne({
                    _id: { $ne: id },
                    branch: checkBranch,
                    status: { $ne: 'CANCELLED' },
                    $and: [
                        { $or: conflictUserQueries },
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
            }

            if (overlappingAppointment) {
                return res.status(409).json({
                    success: false,
                    message: "Conflict: The doctor or therapist already has an appointment in this branch during this time.",
                    conflict: {
                        time: overlappingAppointment.time,
                        patient: overlappingAppointment.patientName
                    }
                });
            }
        }

        const updateData = { ...req.body };
        if (updateData.doctorId === '') updateData.doctorId = null;
        if (updateData.doctorName === '') updateData.doctorName = null;
        if (updateData.therapistId === '') updateData.therapistId = null;
        if (updateData.therapistName === '') updateData.therapistName = null;

        if (updateData.therapists && updateData.therapists.length > 0) {
            updateData.therapistId = updateData.therapists[0].id;
            updateData.therapistName = updateData.therapists[0].name;
        }
        if (req.body.appointmentDate) {
            const startA = new Date(req.body.appointmentDate);
            updateData.appointmentDate = startA;
            updateData.time = req.body.time || startA.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

            // --- Reschedule Reminder ---
            try {
                if (appointment.reminderJobId) {
                    const oldJob = await appointmentReminderQueue.getJob(appointment.reminderJobId);
                    if (oldJob) await oldJob.remove();
                }
                
                const reminderTime = startA.getTime() - (30 * 60 * 1000);
                const delay = Math.max(0, reminderTime - Date.now());
                
                const dName = updateData.doctorName !== undefined ? updateData.doctorName : appointment.doctorName;
                const tName = updateData.therapistName !== undefined ? updateData.therapistName : appointment.therapistName;
                const updatedDisplayName = dName || tName || 'H2F Staff';

                const job = await appointmentReminderQueue.add("appointment-reminder", {
                    appointmentId: appointment._id,
                    patientName: updateData.patientName || appointment.patientName,
                    therapistName: updatedDisplayName,
                    branch: updateData.branch || appointment.branch,
                    time: updateData.time,
                    phone: updateData.details?.phone || appointment.details?.phone
                }, {
                    delay,
                    attempts: 3,
                    backoff: { type: "exponential", delay: 60000 }
                });
                
                updateData.reminderJobId = job.id;
                updateData.reminderSent = false;
            } catch (jobError) {
                console.error("Failed to reschedule reminder job:", jobError);
            }
        }

        const updatedAppointment = await Appointment.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        // --- WhatsApp Notification for Updates ---
        if (updatedAppointment.status === 'CONFIRMED') {
            const timeChanged = appointment.time !== updatedAppointment.time || 
                                (appointment.appointmentDate && updatedAppointment.appointmentDate && appointment.appointmentDate.getTime() !== updatedAppointment.appointmentDate.getTime());
            const statusChanged = appointment.status !== 'CONFIRMED';
            
            if (timeChanged || statusChanged) {
                try {
                    const patientRecord = await Patient.findOne({
                        $or: [
                            { pid: updatedAppointment.patientId },
                            { _id: mongoose.Types.ObjectId.isValid(updatedAppointment.patientId) ? updatedAppointment.patientId : null }
                        ]
                    });

                    if (patientRecord && patientRecord.whatsappConsent !== false) {
                        let recipientPhone = (updatedAppointment.details?.phone || '').replace(/\D/g, '');
                        if (recipientPhone && !recipientPhone.startsWith('91')) recipientPhone = `91${recipientPhone}`;
                        if (!recipientPhone) recipientPhone = '919385500546'; // Using the test number as default if empty
                        
                        const formattedDate = new Date(updatedAppointment.appointmentDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                        const updatedDisplayName = updatedAppointment.doctorName || updatedAppointment.therapistName || 'H2F Staff';
                        
                        let messageText = '';
                        if (timeChanged) {
                            messageText = `Hello ${updatedAppointment.patientName},\n\nYour appointment with ${updatedDisplayName} at ${updatedAppointment.branch} has been RESCHEDULED to ${formattedDate} at ${updatedAppointment.time}.\n\nThank you,\nH2F Rehab 🚀`;
                        } else {
                            messageText = `Hello ${updatedAppointment.patientName},\n\nYour appointment with ${updatedDisplayName} at ${updatedAppointment.branch} has been successfully CONFIRMED for ${formattedDate} at ${updatedAppointment.time}.\n\nThank you,\nH2F Rehab 🚀`;
                        }

                        const form = new FormData();
                        form.append('secret', process.env.WHATSAPP_API_SECRET);
                        form.append('account', process.env.WHATSAPP_API_ACCOUNT);
                        form.append('recipient', recipientPhone);
                        form.append('type', 'text');
                        form.append('message', messageText);

                        await axios.post("https://wtservices.ackrock.com/api/send/whatsapp", form, {
                            headers: form.getHeaders(),
                        });
                        console.log(`WhatsApp ${timeChanged ? 'reschedule' : 'confirmation'} message sent successfully to`, recipientPhone);
                    }
                } catch (waError) {
                    console.error("Failed to send WhatsApp update message:", waError.message);
                }
            }
        }
        // ----------------------------------------

        return res.status(200).json({
            success: true,
            message: "Appointment updated successfully",
            appointment: updatedAppointment
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

        // Remove scheduled job if it exists
        try {
            if (appointment.reminderJobId) {
                const oldJob = await appointmentReminderQueue.getJob(appointment.reminderJobId);
                if (oldJob) await oldJob.remove();
            }
        } catch (jobError) {
            console.error("Failed to remove reminder job during deletion:", jobError);
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
