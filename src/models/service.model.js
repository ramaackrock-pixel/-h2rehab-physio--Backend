import mongoose, { Schema } from 'mongoose';

const serviceSchema = new Schema({
    category: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    subServices: [{
        type: String,
        required: true,
        trim: true
    }]
}, {
    timestamps: true
});

export const Service = mongoose.model('Service', serviceSchema);
