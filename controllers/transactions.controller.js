const createError = require('http-errors');

const Transaction = require('../models/transaction.model');
const BankAccount = require('../models/bank.account.model');

const { findOne, find } = require('../utils/query');
const Flutterwave = require('../services/flutterwave.service');
const { createReference } = require('../utils/app');
const { validate } = require('../utils/validator');
const { response } = require('../middlewares/api-response');
const { sendMail } = require('../services/mail.service');

const { ADMIN_MAIL } = process.env;

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

  static async initiateWithdrawal(req, res, next) {
    try {
      TransactionsController.validateRequest(req.body, 'withdraw');
      const { bankAccountId, amount, currency } = req.body;
      const userBank = await BankAccount.findOne({
        _id: bankAccountId,
        user: req.user.id,
      });
      if (!userBank) {
        return response(res, 422, 'invalid bank details');
      }
      if (!userBank.isVerified) {
        return response(
          res,
          401,
          'sorry, you can only withdraw to a verified bank account'
        );
      }
      const wallet = await req.user.getWallet();
      if (!wallet.canWithdraw(Number(amount))) {
        return response(res, 422, 'insufficient wallet balance');
      }

      const withdrawalTransaction = await Transaction.create({
        type: 'withdrawal',
        reference: createReference('withdrawal'),
        amount,
        user: req.user.id,
        description: 'withdrawal from wallet',
        sourceType: 'Wallet',
        sourceId: wallet._id,
        destinationType: 'Bank Account',
        destinationId: userBank._id,
      });
      await wallet.debit(withdrawalTransaction);

      // check balance
      const flwBalance = await flutterwave.getBalance();
      if (!flwBalance || flwBalance.available_balance < Number(amount)) {
        await sendMail(
          'Insufficient Flutterwave Balance',
          ADMIN_MAIL,
          `Your flutterwave wallet balance is low and users can therefore not make withdrawals. Please fund urgently`
        );
        return response(res, 200, 'withdrawal pending', withdrawalTransaction);
      }
      const options = {
        amountNgn: amount,
        reference: withdrawalTransaction.reference,
        bankAccount: userBank,
        currency: currency || 'NGN',
        callback_url: `${req.headers.host}/flw-callback/${withdrawalTransaction._id}`,
        meta: {
          transaction: withdrawalTransaction._id,
        },
      };
      const withdrawalRequest = await flutterwave.withdraw(options);
      if (withdrawalRequest.status === 'success') {
        return response(
          res,
          200,
          'withdrawal initiated successfully',
          withdrawalRequest
        );
      }
      return response(res, 400, withdrawalRequest.message, withdrawalRequest);
    } catch (error) {
      return next(error);
    }
  }

  static async processWithdrawal(req, res, next) {
    try {
      const withdrawal = await Transaction.findById(
        req.params.transactionId
      ).populate('bankAccount');
      if (!withdrawal) {
        return response(res, 404, 'withdrawal request not found');
      }
      const { amount, bankAccount, reference, _id, currency } = withdrawal;
      const flwBalance = await flutterwave.getBalance();
      if (!flwBalance || flwBalance.available_balance < amount) {
        await sendMail(
          'Insufficient Flutterwave Balance',
          ADMIN_MAIL,
          `Your flutterwave wallet balance is low and users can therefore not make withdrawals. Please fund urgently`
        );
        return response(
          res,
          200,
          'withdrawal processing failed due to insufficient balance',
          withdrawal
        );
      }
      const options = {
        amountNgn: amount,
        reference,
        bankAccount,
        currency,
        callback_url: `${req.headers.host}/flw-callback/${_id}`,
        meta: {
          transaction: _id,
        },
      };
      const withdrawalRequest = await flutterwave.withdraw(options);
      if (withdrawalRequest.status === 'success') {
        return response(
          res,
          200,
          'withdrawal initiated successfully',
          withdrawalRequest
        );
      }
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
      case 'withdraw':
        fields = {
          amount: {
            type: 'number',
            required: true,
          },
          bankAccountId: {
            type: 'string',
            format: 'mongo-id',
            required: true,
          },
          currency: {
            type: 'string',
            required: false,
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
