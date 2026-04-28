import mongoose, { Schema } from 'mongoose';

const appointmentDetailsSchema = new Schema({
    phone: { type: String },
    email: { type: String },
    lastVisit: { type: String },
    condition: { type: String },
    nextSteps: { type: String }
}, { _id: false });

const appointmentSchema = new Schema({
    patientId: {
        type: Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    patientName: {
        type: String,
        required: true
    },
    therapistId: {
        type: Schema.Types.ObjectId,
        ref: 'Admin', // Staff/Doctor are stored in Admin model with different roles
        required: true
    },
    therapistName: {
        type: String,
        required: true
    },
    appointmentDate: {
        type: Date,
        required: true
    },
    time: {
        type: String, // "09:30 AM"
        required: true
    },
    duration: {
        type: Number, // in minutes, e.g., 45
        required: true
    },
    branch: {
        type: String,
        required: true
    },
    sessionType: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['CONFIRMED', 'PENDING', 'COMPLETED', 'CANCELLED'],
        default: 'PENDING'
    },
    details: appointmentDetailsSchema,
    initials: { type: String },
    initialsBg: { type: String, default: 'bg-teal-100 text-teal-700' }
}, {
    timestamps: true
});

// Index for conflict checking: (therapistId, appointmentDate)
appointmentSchema.index({ therapistId: 1, appointmentDate: 1 });

export const Appointment = mongoose.model('Appointment', appointmentSchema);
