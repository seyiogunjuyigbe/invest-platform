const router = require('express').Router();
const WebhookController = require('../controllers/webhook.controller');

router.post('/flutterwave', WebhookController.processWebhookData);

module.exports = router;
