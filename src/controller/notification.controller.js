import { Notification } from '../models/notification.model.js';

// Get all unread notifications
export const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ isRead: false })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: notifications.length,
            notifications
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching notifications",
            error: error.message
        });
    }
};

// Mark notification as read
export const markNotificationAsRead = async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Notification marked as read successfully",
            notification
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Error marking notification as read",
            error: error.message
        });
    }
};
