import { Admission } from '../models/admission.model.js';
import { Room } from '../models/room.model.js';

export const getAllAdmissions = async (req, res) => {
    try {
        const admissions = await Admission.find().populate('patientId');
        res.status(200).json({ success: true, admissions });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const admitPatient = async (req, res) => {
    try {
        const admission = new Admission(req.body);
        await admission.save();
        
        // Update room status
        if (req.body.roomNumber) {
            await Room.findOneAndUpdate({ number: req.body.roomNumber }, { status: 'OCCUPIED' });
        }
        
        res.status(201).json({ success: true, admission });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

export const dischargePatient = async (req, res) => {
    try {
        const admission = await Admission.findByIdAndUpdate(req.params.id, { 
            status: 'DISCHARGED', 
            dischargeDate: Date.now() 
        }, { new: true });
        
        if (!admission) return res.status(404).json({ success: false, message: 'Admission not found' });
        
        // Free up the room
        await Room.findOneAndUpdate({ number: admission.roomNumber }, { status: 'AVAILABLE' });
        
        res.status(200).json({ success: true, admission });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// Room Controllers
export const getAllRooms = async (req, res) => {
    try {
        const rooms = await Room.find();
        res.status(200).json({ success: true, rooms });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const createRoom = async (req, res) => {
    try {
        const room = new Room(req.body);
        await room.save();
        res.status(201).json({ success: true, room });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
