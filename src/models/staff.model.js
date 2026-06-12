import mongoose, { Schema } from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'


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
    joiningDate: {
        type: String,
        trim: true
    },
    aadharNumber: {
        type: String,
        trim: true
    },
    degreeCertificate: {
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
    workingMode: {
        type: String,
        trim: true,
        default: 'Full time'
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

staffSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
})

staffSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

staffSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            name: this.name,
            role: 'staff',        // system access level
            jobRole: this.role,   // display role e.g. 'Physiotherapist'
            branch: this.branch
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

staffSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const Staff = mongoose.model('Staff', staffSchema);

