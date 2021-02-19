const BankAccount = require('../models/bank.account.model');
const Transaction = require('../models/transaction.model');
const { response } = require('../middlewares/api-response');
const { validate } = require('../utils/validator');
const flutterwaveService = require('../services/flutterwave.service');
const { createReference } = require('../utils/app');
const { find, findOne } = require('../utils/query');

const flutterwave = flutterwaveService.getInstance();
class WithdrawController {
  static async initiateWithdrawal(req, res, next) {
    try {
      WithdrawController.validateRequest(req.body);
      const { bankAccountId, amount, currency } = req.body;
      const userBank = await BankAccount.findOne({
        _id: bankAccountId,
        user: req.user.id,
      });
      if (!userBank) {
        return response(res, 422, 'invalid bank details');
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

  static async transactionCallback(req, res, next) {
    try {
      const { transactionId } = req.params;
      const transaction = await Transaction.findById(transactionId).populate(
        'user'
      );
      if (!transaction) {
        return response(res, 404, 'invalid transaction id');
      }
      if (transaction.status !== 'pending') {
        return response(res, 409, 'transaction already updated');
      }
      if (req.query.status === 'successful') {
        transaction.status = 'successful';
      } else {
        transaction.status = 'failed';
        // refund wallet debit
        const { user, amount } = transaction;
        const wallet = await user.getWallet();
        const refund = await Transaction.create({
          type: 'refund',
          reference: createReference('refund'),
          amount,
          user: user.id,
          description: 'refund to wallet',
          sourceType: 'Wallet',
          sourceId: wallet._id,
          destinationType: 'Wallet',
          destinationId: wallet._id,
        });
        await wallet.credit(refund);
      }
      await transaction.save();
      return response(res, 200, 'transaction updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async fetchWithdrawalequests(req, res, next) {
    try {
      if (
        ['superadmin', 'admin'].includes(req.user.type) &&
        !req.query.userId
      ) {
        return response(res, 400, 'user ID required');
      }
      const withdrawalRequests = await find(Transaction, req, {
        type: 'withdrawal',
        user: ['superadmin', 'admin'].includes(req.user.type)
          ? req.query.userId
          : req.user.id,
      });
      return response(
        res,
        200,
        'withdrawal requests fetched successfully',
        withdrawalRequests
      );
    } catch (error) {
      next(error);
    }
  }

  static async fetchWithdrawalequest(req, res, next) {
    try {
      if (
        ['superadmin', 'admin'].includes(req.user.type) &&
        !req.query.userId
      ) {
        return response(res, 400, 'user ID required');
      }
      const withdrawalRequest = await findOne(Transaction, req, {
        type: 'withdrawal',
        user: ['superadmin', 'admin'].includes(req.user.type)
          ? req.query.userId
          : req.user.id,
      });
      return response(
        res,
        200,
        'withdrawal request fetched successfully',
        withdrawalRequest
      );
    } catch (error) {
      next(error);
    }
  }

  static validateRequest(body) {
    const fields = {
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
    validate(body, { properties: fields });
  }
}
module.exports = WithdrawController;
