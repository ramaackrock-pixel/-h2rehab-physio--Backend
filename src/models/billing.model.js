import mongoose, { Schema } from 'mongoose';

const billingSchema = new Schema({
    patientId: {
        type: Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    patientName: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    totalAmount: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    dueAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['PAID', 'OVERDUE', 'PENDING', 'PARTIALLY PAID'],
        default: 'PENDING'
    },
    initials: { type: String },
    initialsBg: { type: String, default: 'bg-teal-100 text-teal-700' },
    billingType: { type: String },
    service: { type: String },
    subService: { type: String },
    packageCategory: { type: String },
    sessions: { type: String }
}, {
    timestamps: true
});

export const Billing = mongoose.model('Billing', billingSchema);
