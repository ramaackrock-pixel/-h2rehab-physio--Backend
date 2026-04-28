import { Branch } from '../models/branch.model.js';

export const getAllBranches = async (req, res) => {
    try {
        const branches = await Branch.find();
        res.status(200).json({ success: true, branches });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const createBranch = async (req, res) => {
    try {
        const branch = new Branch(req.body);
        await branch.save();
        res.status(201).json({ success: true, branch });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

export const updateBranch = async (req, res) => {
    try {
        const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
        res.status(200).json({ success: true, branch });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

export const deleteBranch = async (req, res) => {
    try {
        const branch = await Branch.findByIdAndDelete(req.params.id);
        if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
        res.status(200).json({ success: true, message: 'Branch deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
