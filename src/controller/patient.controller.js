import { Patient } from '../models/patient.model.js';

// Get all patients with search and filtering
export const getAllPatients = async (req, res) => {
    try {
        const { search, status, branch } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { pid: { $regex: search, $options: 'i' } },
                { contact: { $regex: search, $options: 'i' } }
            ];
        }

        if (status) query.status = status;
        if (branch) query.branch = branch;

        const patients = await Patient.find(query).sort({ updatedAt: -1 });
        
        return res.status(200).json({
            success: true,
            count: patients.length,
            patients
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching patients",
            error: error.message
        });
    }
};

// Get a single patient by ID
export const getPatientById = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            });
        }
        return res.status(200).json({
            success: true,
            patient
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching patient details",
            error: error.message
        });
    }
};

// Create a new patient
export const createPatient = async (req, res) => {
    try {
        const patientData = req.body;
        
        // Basic initials generation if not provided
        if (!patientData.initials && patientData.name) {
            patientData.initials = patientData.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase();
        }

        const patient = new Patient(patientData);
        await patient.save();

        return res.status(201).json({
            success: true,
            message: "Patient registered successfully",
            patient
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Error creating patient",
            error: error.message
        });
    }
};

// Update an existing patient
export const updatePatient = async (req, res) => {
    try {
        const patient = await Patient.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Patient updated successfully",
            patient
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Error updating patient",
            error: error.message
        });
    }
};

// Delete a patient
export const deletePatient = async (req, res) => {
    try {
        const patient = await Patient.findByIdAndDelete(req.params.id);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            });
        }
        return res.status(200).json({
            success: true,
            message: "Patient deleted successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error deleting patient",
            error: error.message
        });
    }
};
