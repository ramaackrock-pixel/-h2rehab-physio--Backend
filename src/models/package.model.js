import mongoose, { Schema } from 'mongoose';

const packageSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    sessions: [{
        type: String,
        required: true,
        trim: true
    }],
    defaultPrice: {
        type: Number,
        default: 35000
    }
}, {
    timestamps: true
});

export const Package = mongoose.model('Package', packageSchema);
