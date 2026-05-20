import { Patient } from '../models/patient.model.js';
import { Branch } from '../models/branch.model.js';

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
        
        // Generate consecutive PID if branch is provided
        if (patientData.branch) {
            const branchDoc = await Branch.findOne({ name: patientData.branch });
            if (branchDoc) {
                const branchCode = branchDoc.branchCode;
                
                // Find the patient with the highest sequence for this branch
                // Format: H2F-{branchCode}-NNNN
                const lastPatient = await Patient.findOne({
                    branch: patientData.branch,
                    pid: new RegExp(`^H2F-${branchCode}-\\d{4}$`, 'i')
                }).sort({ pid: -1 });

                let nextSeq = 1;
                if (lastPatient) {
                    const lastPid = lastPatient.pid;
                    const parts = lastPid.split('-');
                    const lastSeq = parseInt(parts[2], 10);
                    if (!isNaN(lastSeq)) {
                        nextSeq = lastSeq + 1;
                    }
                }

                const formattedSeq = String(nextSeq).padStart(4, '0');
                patientData.pid = `H2F-${branchCode}-${formattedSeq}`;
            }
        }
        
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
