const { validate } = require('../utils/validator');
const { find, findOne } = require('../utils/query');
const BankAccount = require('../models/bank.account.model');
const flutterwaveService = require('../services/flutterwave.service');

const flutterwave = flutterwaveService.getInstance();
const { response } = require('../middlewares/api-response');

class BankController {
  static async fetchBanks(req, res, next) {
    try {
      const banks = await flutterwave.getAllBanks();
      return response(res, 200, 'banks fetched successfully', banks);
    } catch (error) {
      next(error);
    }
  }

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
      BankController.validateRequest(req.body, false);
      const { bankCode, bankName } = req.body;
      const verifyAcct = await flutterwave.verifyAccount(req.body);
      if (!verifyAcct) {
        return response(
          res,
          400,
          'your bank details coud not be verified. please double check and try again'
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

  static async addMultipleBankAccounts(req, res, next) {
    try {
      const errors = [];
      let newAccounts;
      BankController.validateRequest(req.body, false, true);
      const accounts = await Promise.all(
        req.body.accounts.map(async account => {
          const verification = await flutterwave.verifyAccount(account);
          if (!verification) {
            errors.push({ account, verification });
          } else {
            return {
              accountNumber: verification.account_number,
              accountName: verification.account_name,
              bankCode: account.bankCode,
              user: req.user.id,
              bankName: account.bankName,
            };
          }
        })
      );
      if (accounts.length) {
        newAccounts = await BankAccount.create(...accounts);
        req.user.bankAccounts.addToSet(newAccounts);
        await req.user.save();
      }
      return response(
        res,
        accounts.length ? 200 : 400,
        `${
          accounts.length
            ? `${accounts.length} bank account(s) added successfully. ${
                errors.length
                  ? `${errors.length} entries could not be verified`
                  : ``
              }`
            : `we could not verify your bank accounts. please retry`
        }`,
        newAccounts || null
      );
    } catch (error) {
      next(error);
    }
  }

  static async removeBankAccount(req, res, next) {
    try {
      const bankAccount = await BankAccount.findOne({
        _id: req.params.bankAccountId,
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
      await BankAccount.findByIdAndDelete(req.params.bankAccountId);
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
        _id: req.params.bankAccountId,
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

  static async verifyBankAccount(req, res, next) {
    try {
      BankController.validateRequest(req.body, true);
      const bankAccount = await BankAccount.findById(req.params.bankAccountId);
      if (!bankAccount) {
        return response(res, 404, 'invalid bank account');
      }
      bankAccount.isVerified = req.body.status === 'approved';
      bankAccount.verifiedBy = req.user.id;
      await bankAccount.save();
      return response(
        res,
        200,
        'bank account updated successfully',
        bankAccount
      );
    } catch (error) {
      next(error);
    }
  }

  static validateRequest(body, verify = false, multiple = false) {
    const fields = {
      bankAccount: {
        type: 'string',
        required: !verify && !multiple,
      },
      bankCode: {
        type: 'string',
        required: !verify && !multiple,
      },
      bankName: {
        type: 'string',
        required: !verify && !multiple,
      },
      status: {
        type: 'string',
        enum: ['approved', 'declined'],
        required: verify && !multiple,
      },
      accounts: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            bankAccount: {
              type: 'string',
              required: !verify && multiple,
            },
            bankCode: {
              type: 'string',
              required: !verify && multiple,
            },
            bankName: {
              type: 'string',
              required: !verify && multiple,
            },
          },
        },
        required: !verify && multiple,
      },
    };

    validate(body, { properties: fields });
  }
}
module.exports = BankController;
