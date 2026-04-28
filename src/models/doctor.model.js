import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    specialization: {
        type: String,
        required: true,
        trim: true
    },
    experience: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    avatar: {
        type: String
    },
    branch: {
        type: String,
        default: 'All Branches'
    }
}, { timestamps: true });

export const Doctor = mongoose.model('Doctor', doctorSchema);
