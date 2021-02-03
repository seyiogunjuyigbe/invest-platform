const PushNotification = require('@pusher/push-notifications-server');

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
