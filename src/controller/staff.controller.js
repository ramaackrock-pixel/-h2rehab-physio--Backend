import { Staff } from '../models/staff.model.js';
import { Branch } from '../models/branch.model.js';

// Haversine formula to calculate distance in meters
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
};

// Get all staff members
export const getAllStaff = async (req, res) => {
    try {
        const { role, branch, department } = req.query;
        let query = {};

        if (role) query.role = role;
        if (branch) query.branch = branch;
        if (department) query.department = department;

        const staff = await Staff.find(query).select("-password -refreshToken").sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: staff.length,
            staff
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching staff members",
            error: error.message
        });
    }
};

// Add a new staff member
export const addStaff = async (req, res) => {
    try {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: "Unauthorized access: Only administrators can add staff members"
            });
        }

        const {
            name, email, password, role, department, branch, mobile,
            avatar, scheduleDays, shift, workingHours, workingMode,
            joiningDate, aadharNumber
        } = req.body;

        let degreeCertificate = "";
        let finalAvatar = avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;

        if (req.files) {
            if (req.files.degreeCertificate && req.files.degreeCertificate[0]) {
                degreeCertificate = `${req.protocol}://${req.get('host')}/uploads/${req.files.degreeCertificate[0].filename}`;
            }
            if (req.files.photo && req.files.photo[0]) {
                finalAvatar = `${req.protocol}://${req.get('host')}/uploads/${req.files.photo[0].filename}`;
            }
        }

        if (!req.files || !req.files.photo || !req.files.photo[0]) {
            return res.status(400).json({
                success: false,
                message: "Photo is required"
            });
        }

        if (aadharNumber && !/^\d{12}$/.test(aadharNumber)) {
            return res.status(400).json({
                success: false,
                message: "Aadhar number must be exactly 12 digits"
            });
        }

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const existingUser = await Staff.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User with this email already exists"
            });
        }

        const staff = new Staff({
            name,
            email,
            password: password || 'defaultpassword123',
            role: role || 'staff',
            department,
            branch,
            mobile,
            avatar: finalAvatar,
            joiningDate,
            aadharNumber,
            degreeCertificate,
            scheduleDays,
            shift,
            workingMode: workingMode || 'Full time',
            workingHours
        });

        await staff.save();

        const staffResponse = staff.toObject();
        delete staffResponse.password;
        delete staffResponse.refreshToken;

        return res.status(201).json({
            success: true,
            message: "Staff member added successfully",
            staff: staffResponse
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Error adding staff member",
            error: error.message
        });
    }
};

// Update staff member
export const updateStaff = async (req, res) => {
    try {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: "Unauthorized access: Only administrators can update staff members"
            });
        }

        const updateData = { ...req.body };

        // Remove empty password from updateData to prevent validation and overwrite failures
        if (updateData.password === '' || updateData.password === undefined || updateData.password === null) {
            delete updateData.password;
        }

        if (req.files) {
            if (req.files.degreeCertificate && req.files.degreeCertificate[0]) {
                updateData.degreeCertificate = `${req.protocol}://${req.get('host')}/uploads/${req.files.degreeCertificate[0].filename}`;
            }
            if (req.files.photo && req.files.photo[0]) {
                updateData.avatar = `${req.protocol}://${req.get('host')}/uploads/${req.files.photo[0].filename}`;
            }
        }
        if (updateData.password) {
            // Pre-save hook will handle hashing if we use save(), 
            // but for findByIdAndUpdate we need to be careful or just use save()
            const user = await Staff.findById(req.params.id);
            if (!user) return res.status(404).json({ success: false, message: "Staff not found" });

            Object.assign(user, updateData);
            await user.save();

            const userResponse = user.toObject();
            delete userResponse.password;
            return res.status(200).json({ success: true, staff: userResponse });
        }

        const staff = await Staff.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select("-password -refreshToken");

        if (!staff) {
            return res.status(404).json({
                success: false,
                message: "Staff member not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Staff member updated successfully",
            staff
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Error updating staff member",
            error: error.message
        });
    }
};

// Delete staff member
export const deleteStaff = async (req, res) => {
    try {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: "Unauthorized access: Only administrators can delete staff members"
            });
        }

        const staff = await Staff.findByIdAndDelete(req.params.id);
        if (!staff) {
            return res.status(404).json({
                success: false,
                message: "Staff member not found"
            });
        }
        return res.status(200).json({
            success: true,
            message: "Staff member deleted successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error deleting staff member",
            error: error.message
        });
    }
};

// Logged-in Staff check-in (Today only)
export const selfCheckIn = async (req, res) => {
    try {
        const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

        const staff = await Staff.findById(req.user._id);
        if (!staff) {
            return res.status(404).json({
                success: false,
                message: "Staff profile not found"
            });
        }

        // --- GPS Geolocation Verification ---
        const locationStr = req.body.location || '';
        const match = locationStr.match(/GPS Coordinates: \[([0-9.-]+),\s*([0-9.-]+)\]/);

        if (!match) {
            return res.status(403).json({
                success: false,
                message: "Location verification failed. Please allow Location/GPS permissions in your browser."
            });
        }

        const staffLat = parseFloat(match[1]);
        const staffLon = parseFloat(match[2]);

        const branch = await Branch.findOne({ name: staff.branch });
        if (!branch) {
            return res.status(400).json({
                success: false,
                message: `Your assigned branch '${staff.branch}' was not found in the system. Please update your profile.`
            });
        }
        if (!branch.coordinates || !branch.coordinates.lat) {
            return res.status(400).json({
                success: false,
                message: `GPS coordinates are missing for '${branch.name}'. An administrator must configure them first.`
            });
        }

        const distance = calculateDistance(staffLat, staffLon, branch.coordinates.lat, branch.coordinates.lng);

        if (distance > 100) { // Max 100 meters radius
            return res.status(403).json({
                success: false,
                message: `You are ${Math.round(distance)}m away from ${branch.name}. You must be inside the clinic to check in.`
            });
        }
        // ------------------------------------

        const alreadyCheckedIn = (staff.attendanceLogs || []).some(log => log.date === todayStr);
        if (alreadyCheckedIn) {
            return res.status(400).json({
                success: false,
                message: "You have already checked in for today."
            });
        }

        const checkInTime = new Date().toLocaleTimeString('en-US', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit'
        });

        staff.attendanceLogs = staff.attendanceLogs || [];
        staff.attendanceLogs.push({
            date: todayStr,
            checkInTime,
            status: 'checked in',
            location: req.body.location || 'Location details not provided'
        });

        await staff.save();

        return res.status(200).json({
            success: true,
            message: "Successfully checked in for today!",
            attendanceLogs: staff.attendanceLogs
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to perform check-in",
            error: error.message
        });
    }
};

// Logged-in Staff check-out (Today only)
export const selfCheckOut = async (req, res) => {
    try {
        const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

        const staff = await Staff.findById(req.user._id);
        if (!staff) {
            return res.status(404).json({
                success: false,
                message: "Staff profile not found"
            });
        }

        // --- GPS Geolocation Verification ---
        const locationStr = req.body.location || '';
        const match = locationStr.match(/GPS Coordinates: \[([0-9.-]+),\s*([0-9.-]+)\]/);

        if (!match) {
            return res.status(403).json({
                success: false,
                message: "Location verification failed. Please allow Location/GPS permissions in your browser."
            });
        }

        const staffLat = parseFloat(match[1]);
        const staffLon = parseFloat(match[2]);

        const branch = await Branch.findOne({ name: staff.branch });
        if (!branch) {
            return res.status(400).json({
                success: false,
                message: `Your assigned branch '${staff.branch}' was not found in the system. Please update your profile.`
            });
        }
        if (!branch.coordinates || !branch.coordinates.lat) {
            return res.status(400).json({
                success: false,
                message: `GPS coordinates are missing for '${branch.name}'. An administrator must configure them first.`
            });
        }

        const distance = calculateDistance(staffLat, staffLon, branch.coordinates.lat, branch.coordinates.lng);

        if (distance > 100) { // Max 100 meters radius
            return res.status(403).json({
                success: false,
                message: `You are ${Math.round(distance)}m away from ${branch.name}. You must be inside the clinic to check out.`
            });
        }
        // ------------------------------------

        const todayLogIndex = (staff.attendanceLogs || []).findIndex(log => log.date === todayStr);
        if (todayLogIndex === -1) {
            return res.status(400).json({
                success: false,
                message: "You must check in first before checking out."
            });
        }

        const todayLog = staff.attendanceLogs[todayLogIndex];
        if (todayLog.checkOutTime || todayLog.status === 'presented today') {
            return res.status(400).json({
                success: false,
                message: "You have already checked out for today."
            });
        }

        const checkOutTime = new Date().toLocaleTimeString('en-US', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit'
        });

        todayLog.checkOutTime = checkOutTime;
        todayLog.status = 'presented today';

        if (req.body.location) {
            todayLog.location = todayLog.location && todayLog.location !== req.body.location
                ? `${todayLog.location} (In) / ${req.body.location} (Out)`
                : req.body.location;
        }

        staff.attendanceLogs[todayLogIndex] = todayLog;
        // Mark attendanceLogs as modified to ensure Mongoose saves the updated array element
        staff.markModified('attendanceLogs');
        await staff.save();

        return res.status(200).json({
            success: true,
            message: "Successfully checked out for today!",
            attendanceLogs: staff.attendanceLogs
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to perform check-out",
            error: error.message
        });
    }
};

// Get profile details of currently logged-in staff
export const getMyProfile = async (req, res) => {
    try {
        const staff = await Staff.findById(req.user._id).select("-password -refreshToken");
        if (!staff) {
            return res.status(404).json({
                success: false,
                message: "Staff member profile not found"
            });
        }
        return res.status(200).json({
            success: true,
            staff
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching staff profile",
            error: error.message
        });
    }
};
