import mongoose, { Schema } from 'mongoose';

const patientSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    pid: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    demographics: {
        type: String, // Age, Gender, etc.
        required: true
    },
    branch: {
        type: String,
        required: true
    },
    contact: {
        type: String,
        required: true
    },
    address: {
        type: String
    },
    lastVisit: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'CRITICAL', 'PENDING', 'DISCHARGED'],
        default: 'ACTIVE'
    },
    consultedBy: {
        type: String, // Doctor name or ID
        required: true
    },
    assignedDoctor: {
        type: String,
        required: true
    },
    diseases: [{
        type: String
    }],
    conditions: [{
        type: String
    }],
    assignments: [{
        type: String
    }],
    assessment: {
        type: String,
        trim: true
    },
    assessmentData: {
        type: Object,
        default: null
    },
    notes: {
        type: String,
        trim: true
    },
    initials: {
        type: String
    },
    initialsBg: {
        type: String,
        default: 'bg-teal-100 text-teal-700'
    }
}, {
    timestamps: true
});

export const Patient = mongoose.model('Patient', patientSchema);
