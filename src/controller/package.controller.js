import { Package } from '../models/package.model.js';

export const getAllPackages = async (req, res) => {
    try {
        const packages = await Package.find();
        return res.status(200).json({
            success: true,
            count: packages.length,
            packages
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching packages",
            error: error.message
        });
    }
};
