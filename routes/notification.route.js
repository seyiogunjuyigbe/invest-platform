const router = require('express').Router();
const NotificationContoller = require('../controllers/notification.controller');
const isAuthenticated = require('../middlewares/is-authenticated');

router.get('/', isAuthenticated, NotificationContoller.fetchNotifications);
router.get(
  '/notificationId',
  isAuthenticated,
  NotificationContoller.fetchNotification
);
router.post(
  '/mark-read',
  isAuthenticated,
  NotificationContoller.markNotificationsAsRead
);
module.exports = router;
