import { Doctor } from '../models/doctor.model.js';

export const getAllDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            doctors
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching doctors",
            error: error.message
        });
    }
};

export const createDoctor = async (req, res) => {
    try {
        const doctor = new Doctor(req.body);
        await doctor.save();
        res.status(201).json({
            success: true,
            doctor
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Error creating doctor",
            error: error.message
        });
    }
};

export const updateDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });
        res.status(200).json({
            success: true,
            doctor
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Error updating doctor",
            error: error.message
        });
    }
};

export const deleteDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findByIdAndDelete(req.params.id);
        if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });
        res.status(200).json({
            success: true,
            message: "Doctor deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting doctor",
            error: error.message
        });
    }
};
