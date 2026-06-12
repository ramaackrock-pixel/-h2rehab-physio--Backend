import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    manager: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    branchCode: {
        type: String,
        required: true,
        unique: true
    },
    staffCount: {
        type: Number,
        default: 0
    },
    patientCount: {
        type: Number,
        default: 0
    },
    totalRevenue: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Active', 'Maintenance', 'Expanding'],
        default: 'Active'
    },
    performance: {
        weeklyRevenue: [Number],
        revenueGrowth: Number
    },
    coordinates: {
        lat: Number,
        lng: Number
    },
    image: {
        type: String
    }
}, { timestamps: true });

export const Branch = mongoose.model('Branch', branchSchema);
