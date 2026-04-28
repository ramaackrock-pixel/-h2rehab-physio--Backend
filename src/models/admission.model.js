import mongoose from 'mongoose';

const admissionSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    patientName: {
        type: String,
        required: true
    },
    roomNumber: {
        type: String,
        required: true
    },
    admissionDate: {
        type: Date,
        default: Date.now
    },
    dischargeDate: {
        type: Date
    },
    department: {
        type: String,
        required: true
    },
    attendingDoctor: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['ADMITTED', 'DISCHARGED', 'TRANSFERRING'],
        default: 'ADMITTED'
    },
    totalFees: {
        type: Number,
        default: 0
    },
    paidFees: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

export const Admission = mongoose.model('Admission', admissionSchema);
