const { validate } = require('../utils/validator');
const { find, findOne } = require('../utils/query');
const BankAccount = require('../models/bank.account.model');
const flutterwaveService = require('../services/flutterwave.service');

const flutterwave = flutterwaveService.getInstance();
const { response } = require('../middlewares/api_response');

class BankController {
  static async fetchBankAccount(req, res, next) {
    try {
      const account = await findOne(BankAccount, req, { user: req.user.id });
      return response(res, 200, 'bank account fetched successfully', account);
    } catch (error) {
      next(error);
    }
  }

  static async fetchAllAccounts(req, res, next) {
    try {
      const accounts = await find(BankAccount, req, { user: req.user.id });
      return response(res, 200, 'bank accounts fetched successfully', accounts);
    } catch (error) {
      next(error);
    }
  }

  static async addBankAccount(req, res, next) {
    try {
      BankController.validateRequest(req.body, false, false, false, true);
      const { bankCode, bankName } = req.body;
      const verifyAcct = await flutterwave.verifyAccount(req.body);
      if (!verifyAcct) {
        return response(
          res,
          400,
          'your bank details coud not be verified. please doube check and try again'
        );
        // bank account not resolved
      }
      const newAccount = await BankAccount.create({
        accountNumber: verifyAcct.account_number,
        accountName: verifyAcct.account_name,
        bankCode,
        user: req.user.id,
        bankName,
      });
      req.user.bankAccounts.addToSet(newAccount);
      await req.user.save();
      return response(res, 200, 'bank account added successfully', newAccount);
    } catch (error) {
      next(error);
    }
  }

  static async removeBankAccount(req, res, next) {
    try {
      const bankAccount = await BankAccount.findOne({
        _id: req.params.bankId,
        user: req.user.id,
      });
      if (!bankAccount) {
        return response(res, 404, 'bank account not found');
      }
      if (bankAccount.isDefault && req.user.bankAccounts.length === 1) {
        // user is attempting to remove only (deault) bank account
        return response(
          res,
          400,
          'sorry, you can not remove your default bank account'
        );
      }
      await BankAccount.findByIdAndDelete(req.params.bankId);
      req.user.bankAccounts.pull(bankAccount._id);
      await req.user.save();
      return response(res, 200, 'bank account removed successfully');
    } catch (error) {
      next(error);
    }
  }

  static async setDefaultAcct(req, res, next) {
    try {
      const bankAccount = await BankAccount.findOne({
        _id: req.params.bankId,
        user: req.user.id,
      });
      if (!bankAccount) {
        return response(res, 404, 'bank account not found');
      }
      // set all others as not default
      await BankAccount.updateMany({ user: req.user.id }, { isDefault: false });
      bankAccount.isDefault = true;
      await bankAccount.save();
      return response(res, 200, 'bank account set as default successfully');
    } catch (error) {
      next(error);
    }
  }

  static validateRequest(body) {
    const fields = {
      bankAccount: {
        type: 'string',
        required: true,
      },
      bankCode: {
        type: 'string',
        required: true,
      },
      bankName: {
        type: 'string',
        required: true,
      },
    };

    validate(body, { properties: fields });
  }
}
module.exports = BankController;
