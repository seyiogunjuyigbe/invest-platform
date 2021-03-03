const PushNotification = require('@pusher/push-notifications-server');
const createError = require('http-errors');
const Notification = require('../models/notification.model');

const { PUSHER_INSTANCE_ID, PUSHER_SECERT_KEY } = process.env;

const BeamsClient = new PushNotification({
  instanceId: PUSHER_INSTANCE_ID,
  secretKey: PUSHER_SECERT_KEY,
});

module.exports = {
  async sendPushNotification(users = [], title, body) {
    try {
      const notification = await BeamsClient.publishToUsers([...users], {
        apns: {
          aps: {
            alert: {
              title,
              body,
            },
          },
        },
        fcm: {
          notification: {
            title,
            body,
          },
        },
        web: {
          notification: {
            title,
            body,
          },
        },
      });
      return notification;
    } catch (err) {
      return null;
    }
  },
  async createNotification(users = [], title, message) {
    try {
      const notifications = await Promise.all(
        users.map(async user => {
          await Notification.create({ user, title, message });
        })
      );
      return notifications;
    } catch (error) {
      throw createError(500, error.message);
    }
  },
  async generateNotificationToken(user) {
    try {
      const token = await BeamsClient.generateToken(user.id);
      user.notificationToken = token;
      await user.save();
      return token;
    } catch (err) {
      return null;
    }
  },
};
