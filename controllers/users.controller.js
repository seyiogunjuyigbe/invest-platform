const createError = require('http-errors');
const { customAlphabet } = require('nanoid');
const moment = require('moment');
const { validate } = require('../utils/validator');
const Otp = require('../models/otp.model');
const { sendMail } = require('../services/mail.service');
const User = require('../models/user.model');
const WalletHistory = require('../models/wallet.history.model');
const { find, findOne } = require('../utils/query');

class UsersController {
  static async createUser(req, res, next) {
    try {
      UsersController.validateRequest(
        req.body,
        false,
        req.path.includes('signup')
      );
      const user = await User.create(req.body);
      const expiry = moment.utc().add(1, 'hours');
      const otp = await Otp.create({
        otp: customAlphabet('0123456789', 6)(),
        type: 'verify-email',
        user,
        expiry,
      });
      const message = `Use this code to verify your email ${otp.otp}. This code expires in 1 hour`;
      console.log({ otp });
      await sendMail('Verify your email', user.email, message);
      return res.status(200).json({
        message: 'user created successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async fetchUser(req, res, next) {
    try {
      const user = await findOne(User, req);

      return res.status(200).json({
        message: 'user retrieved successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getWallet(req, res, next) {
    try {
      const wallet = await req.user.getWallet();

      return res.status(200).json({
        message: 'wallet retrieved successfully',
        data: wallet,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getWalletHistories(req, res, next) {
    try {
      const histories = await find(WalletHistory, req, { user: req.user.id });

      return res.status(200).json({
        message: 'wallet histories retrieved successfully',
        data: histories,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listUsers(req, res, next) {
    try {
      const users = await find(User, req);

      return res.status(200).json({
        message: 'users retrieved successfully',
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req, res, next) {
    try {
      UsersController.validateRequest(req.body, true);

      const user = await findOne(User, req);

      if (!user) {
        throw createError('404', 'user not found');
      }

      await user.updateOne(req.body);

      return res.status(200).json({
        message: 'users retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req, res, next) {
    try {
      const user = await findOne(User, req);

      if (!user) {
        throw createError('404', 'user not found');
      }

      await User.remove({ _id: req.params.userId });

      return res.status(200).json({
        message: 'user deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static validateRequest(body, isUpdate, isUserSignup) {
    const fields = {
      type: {
        type: 'string',
        required: !isUpdate && !isUserSignup,
        enum: ['investor', 'admin', 'superadmin'],
      },
      role: {
        type: 'string',
        required: !isUpdate && !isUserSignup,
        enum: ['finance', 'non-finance', 'none'],
      },
      firstName: {
        type: 'string',
        required: !isUpdate,
      },
      lastName: {
        type: 'string',
        required: !isUpdate,
      },
      email: {
        type: 'string',
        required: !isUpdate,
      },
      phone: {
        type: 'string',
      },
      password: {
        type: 'string',
        required: !isUpdate,
      },
      isEmailVerifed: {
        type: 'string',
      },
    };

    validate(body, { properties: fields }, isUpdate);
  }
}

module.exports = UsersController;
