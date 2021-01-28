const Notification = require('../models/notification.model');
const { sendMail } = require('./mailService');
module.exports = {
    async createNotification(user, title, message) {
        try {
            let notification = await Notification.create({ user, title, message });
            await sendMail(title, user.email, message);
            return notification;
        } catch (err) {
            return null;
        }
    }
}