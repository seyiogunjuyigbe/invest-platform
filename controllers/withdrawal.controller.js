const BankAccount = require('../models/bank.account.model');
const Transaction = require('../models/transaction.model');
const { response } = require('../middlewares/api-response');
const { validate } = require('../utils/validator');
const flutterwaveService = require('../services/flutterwave.service');
const { createReference } = require('../utils/app');
const { sendMail } = require('../services/mail.service');

const { ADMIN_MAIL } = process.env;
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
