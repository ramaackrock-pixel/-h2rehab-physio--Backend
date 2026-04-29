import { Admin } from '../models/admin.model.js'
import { Patient } from '../models/patient.model.js'
import { Appointment } from '../models/appointment.model.js'
import { Billing } from '../models/billing.model.js'
import { MedicalRecord } from '../models/medicalRecord.model.js'
import { Admission } from '../models/admission.model.js'
import jwt from 'jsonwebtoken'

const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await Admin.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new Error("Something went wrong while generating referesh and access token")
    }
}

const signIn = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'All Fields are required' })
    }

    const user = await Admin.findOne({ email: email.toLowerCase() })
    if (!user) {
        return res.status(404).json({ message: 'User is not registered', isValidAdmin: false })
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid user credentials', isValidAdmin: false })
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)

    const options = {
        httpOnly: true,
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json({
            message: 'User is registered',
            isValidAdmin: true,
            role: user.role,
            name: user.name,
            accessToken,
            refreshToken
        })
}

const logout = async (req, res) => {
    await Admin.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json({ message: "User logged out" })
}

const refreshAccessToken = async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        return res.status(401).json({ message: "unauthorized request" })
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await Admin.findById(decodedToken?._id)

        if (!user) {
            return res.status(401).json({ message: "Invalid refresh token" })
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            return res.status(401).json({ message: "Refresh token is expired or used" })
        }

        const options = {
            httpOnly: true,
            secure: true,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefereshTokens(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json({
                accessToken,
                refreshToken: newRefreshToken,
                message: "Access token refreshed"
            })
    } catch (error) {
        return res.status(401).json({ message: error?.message || "Invalid refresh token" })
    }
}

const changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Old and new passwords are required' });
    }

    try {
        const user = await Admin.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isPasswordValid = await user.isPasswordCorrect(oldPassword);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid old password' });
        }

        user.password = newPassword;
        user.markModified('password');
        // Invalidate current refresh token to force logout on other devices if needed
        user.refreshToken = undefined; 
        await user.save();

        const options = {
            httpOnly: true,
            secure: true
        };

        return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json({ message: "Password updated successfully. Please log in again." });
    } catch (error) {
        console.error("Change password error:", error);
        return res.status(500).json({ message: "An error occurred while changing password" });
    }
}

const wipeData = async (req, res) => {
    // Highly restrictive endpoint. Ensure only superadmin or authorized admins can do this.
    // Assuming verifyJWT middleware checks req.user
    if (!req.user || (req.user.role !== 'superadmin' && req.user.role !== 'admin')) {
        return res.status(403).json({ message: 'Unauthorized to perform this destructive action' });
    }

    const { confirmationText } = req.body;
    if (confirmationText !== 'delete in portal') {
        return res.status(400).json({ message: 'Invalid confirmation text' });
    }

    try {
        await Promise.all([
            Patient.deleteMany({}),
            Appointment.deleteMany({}),
            Billing.deleteMany({}),
            MedicalRecord.deleteMany({}),
            Admission.deleteMany({})
        ]);

        return res.status(200).json({ message: 'All operational data has been successfully wiped.' });
    } catch (error) {
        console.error("Wipe data error:", error);
        return res.status(500).json({ message: "An error occurred while wiping data" });
    }
}

export { signIn, logout, refreshAccessToken, changePassword, wipeData }