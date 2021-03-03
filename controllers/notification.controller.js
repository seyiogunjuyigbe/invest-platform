const Notification = require('../models/notification.model');
const response = require('../middlewares/api-response');
const { find, findOne } = require('../utils/query');
const { validate } = require('../utils/validator');

class NotificationController {
  static async fetchNotifications(req, res, next) {
    try {
      const notifications = await find(Notification, req, {
        user: req.user.id,
      });
      return response(
        res,
        200,
        'notifications fetched successfully',
        notifications
      );
    } catch (error) {
      next(error);
    }
  }

  static async fetchNotification(req, res, next) {
    try {
      const notification = await findOne(Notification, req, {
        user: req.user.id,
      });
      if (notification) {
        notification.set({ isRead: true });
        await notification.save();
      }
      return response(
        res,
        notification ? 200 : 404,
        notification
          ? 'notification fetched successfully'
          : 'notification not found',
        notification
      );
    } catch (error) {
      next(error);
    }
  }

  static async markNotificationsAsRead(req, res, next) {
    try {
      Notification.validateRequest(req.body);
      const conditions = { user: req.user.id };
      if (req.body.notificationIds) {
        conditions.$or = req.body.notificationIds.map(id => ({ _id: id }));
      }
      await Notification.updateMany(conditions, { isRead: true });
      return response(res, 200, 'notifications marked as read');
    } catch (error) {
      next(error);
    }
  }

  static validateRequest(body) {
    const fields = {
      notificationIds: {
        type: 'array',
        required: false,
      },
    };
    validate(body, { properties: fields });
  }
}
module.exports = NotificationController;
