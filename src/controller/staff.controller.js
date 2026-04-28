import { Staff } from '../models/staff.model.js';

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
        const { name, email, password, role, department, branch, mobile, avatar, scheduleDays, shift, workingHours } = req.body;

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
            avatar,
            scheduleDays,
            shift,
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
        const updateData = { ...req.body };
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
