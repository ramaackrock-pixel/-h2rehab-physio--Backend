import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
    number: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        enum: ['GENERAL', 'SEMIPRIVATE', 'PRIVATE', 'ICU'],
        default: 'GENERAL'
    },
    status: {
        type: String,
        enum: ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'],
        default: 'AVAILABLE'
    },
    pricePerDay: {
        type: Number,
        required: true
    },
    department: {
        type: String,
        required: true
    }
}, { timestamps: true });

export const Room = mongoose.model('Room', roomSchema);
