import { Service } from '../models/service.model.js';

export const getAllServices = async (req, res) => {
    try {
        const services = await Service.find();
        return res.status(200).json({
            success: true,
            count: services.length,
            services
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching services",
            error: error.message
        });
    }
};
