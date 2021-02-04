const createError = require('http-errors');

const Transaction = require('../models/transaction.model');
const { findOne, find } = require('../utils/query');
const Flutterwave = require('../services/flutterwave.service');
const { createReference } = require('../utils/app');
const { validate } = require('../utils/validator');

const flutterwave = Flutterwave.getInstance();

class TransactionsController {
  static async initiateTransaction(req, res, next) {
    try {
      TransactionsController.validateRequest(req.body);

      const transaction = await Transaction.create({
        user: req.user.id,
        description: 'wallet deposit',
        amount: req.body.amount,
        reference: createReference('deposit'),
      });

      return res.status(200).json({
        message: 'transaction initiated successfully',
        data: {
          transaction,
          auth: await flutterwave.initiate({
            transaction,
            authType: req.body.authType || 'url',
            user: req.user,
          }),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyTransaction(req, res, next) {
    try {
      const transaction = await Transaction.findOne({
        _id: req.params.transactionId,
      }).populate('user');

      if (!transaction || !transaction.user) {
        throw createError(404, 'transaction details not found');
      }

      if (transaction.status === 'successful') {
        throw createError(400, 'transaction already verified');
      }

      const isSuccessful = await transaction.processPayment();

      return res.status(200).json({
        message: isSuccessful
          ? 'transaction verified and wallet credited'
          : 'transaction could not be verified',
      });
    } catch (error) {
      next(error);
    }
  }

  static async fetchTransaction(req, res, next) {
    try {
      const transaction = ['superadmin', 'admin'].includes(req.user.type)
        ? await findOne(Transaction, req)
        : await findOne(Transaction, req, { user: req.user.id });

      return res.status(200).json({
        message: 'transaction retrieved successfully',
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  static async fetchTransactions(req, res, next) {
    try {
      const conditions = ['superadmin', 'admin'].includes(req.user.type)
        ? {}
        : { user: req.user.id };

      const histories = await find(Transaction, req, conditions);

      return res.status(200).json({
        message: 'transaction histories retrieved successfully',
        data: histories,
      });
    } catch (error) {
      next(error);
    }
  }

  static validateRequest(body, action = 'initiate') {
    let fields;

    switch (action) {
      case 'initiate':
        fields = {
          amount: {
            type: ['integer', 'number', 'string'],
            required: true,
          },
          authType: {
            type: 'string',
            required: false,
            enum: ['url', 'manual'],
          },
        };
        break;
      default:
        break;
    }

    validate(body, { properties: fields });
  }
}

module.exports = TransactionsController;
