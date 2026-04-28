import mongoose, { Schema } from 'mongoose'

const staffSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
        trim: true,
    },
    role: {
        type: String,
        default: "staff"
    },
    mobile: {
        type: String,
        trim: true
    },
    department: {
        type: String,
        trim: true
    },
    branch: {
        type: String,
        trim: true
    },
    avatar: {
        type: String
    },
    status: {
        type: String,
        default: "Active",
        enum: ['Active', 'Inactive']
    },
    active: {
        type: Boolean,
        default: true
    },
    scheduleDays: [{
        type: String
    }],
    shift: {
        type: String,
        trim: true
    },
    workingHours: {
        type: String,
        trim: true
    },
    attendanceLogs: [{
        date: String,
        checkInTime: String,
        checkOutTime: String,
        status: String,
        location: String
    }],
    payrollLogs: [{
        month: String,
        daysPresent: Number,
        salary: Number,
        deductions: Number,
        bonus: Number,
        netPay: Number
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

export const Staff = mongoose.model('Staff', staffSchema);
