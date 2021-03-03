const Transaction = require('../models/transaction.model');
const { createReference } = require('../utils/app');
const { validate } = require('../utils/validator');
const { response } = require('../middlewares/api-response');
const {
  sendPushNotification,
  createNotification,
} = require('../services/notification.service');

class WebhookController {
  static async processWebhookData(req, res, next) {
    try {
      const hash = req.headers['verif-hash'];
      if (!hash) {
        return response(res, 200, 'unauthenticated request');
      }
      if (hash !== process.env.FLW_HASH) {
        return response(res, 200, 'unauthenticated request');
      }
      WebhookController.validateRequest(req.body);
      const { amount, status, reference } = req.body.data;
      const transaction = await Transaction.findOne({ reference }).populate(
        'user'
      );
      // TODO: notify admin for any failed webhook processing
      if (!transaction) {
        return response(res, 200, 'transaction record not found');
      }
      const { user } = transaction;
      if (transaction.status !== 'pending') {
        return response(res, 200, 'transaction already processed');
      }
      if (status.toLowerCase === 'failed') {
        transaction.status = 'failed';
        if (transaction.type === 'withdrawal') {
          // refund user wallet
          const wallet = await user.getWallet();
          const walletRefund = await Transaction.create({
            amount,
            type: 'refund',
            status: 'successful',
            reference: createReference('refund'),
            processor: 'wallet',
            paymentType: 'wallet',
            user,
            description: `refund for failed withdrawal attempt(${transaction.id})`,
            sourceType: 'Wallet',
            sourceId: wallet.id,
            destinationType: 'Wallet',
            destinationId: wallet.id,
          });
          await wallet.credit(walletRefund);
        }
      }
      if (status.toLowerCase === 'successful') {
        transaction.status = 'successful';
        if (transaction.type === 'deposit') {
          await transaction.processPayment();
        }
      }
      const title = `${transaction.type} ${status}`;
      const message = `Your withdrawal of ${transaction.amount} was ${status}`;
      await sendPushNotification([user._id], title, message);
      await createNotification([user], title, message, true);
      await transaction.save();

      return response(res, 200, 'transaction updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static validateRequest(body) {
    const fields = {
      event: {
        type: 'string',
        required: true,
      },
      'event.type': {
        type: 'string',
        required: true,
      },
      data: {
        type: 'object',
        required: true,
      },
    };

    validate(body, { properties: fields });
  }
}
module.exports = WebhookController;
