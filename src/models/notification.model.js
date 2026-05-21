import mongoose, { Schema } from 'mongoose';

const notificationSchema = new Schema({
    appointmentId: {
        type: Schema.Types.ObjectId,
        ref: 'Appointment',
        required: true
    },
    patientId: {
        type: Schema.Types.ObjectId,
        ref: 'Patient'
    },
    patientName: {
        type: String,
        required: true
    },
    patientPid: {
        type: String,
        required: true
    },
    doctorName: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        default: 'CONSULTATION_ENDING'
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export const Notification = mongoose.model('Notification', notificationSchema);
