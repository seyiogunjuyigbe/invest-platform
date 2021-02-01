// const Notification = require('../models/notification.model');
// const { sendMail } = require('./mailService');
const pushNotification = require('@pusher/push-notifications-server');
const beamsClient = new pushNotification({
  instanceId: PUSHER_INSTANCE_ID,
  secretKey: PUSHER_SECERT_KEY,
});

module.exports = {
  // async createNotification(user, title, message) {
  //     try {
  //         let notification = await Notification.create({ user, title, message });
  //         await sendMail(title, user.email, message);
  //         return notification;
  //     } catch (err) {
  //         return null;
  //     }
  // },
  async sendPushNotification(users = [], title, body) {
    try {
      let notification = await beamsClient.publishToUsers([...users], {
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
  async generateNotificationToken(user) {
    try {
      let token = await beamsClient.generateToken(user.id);
      user.notificationToken = token;
      await user.save();
      return token;
    } catch (err) {
      return null;
    }
  },
};
