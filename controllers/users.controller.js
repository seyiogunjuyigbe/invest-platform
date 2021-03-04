const createError = require('http-errors');
const { customAlphabet } = require('nanoid');
const moment = require('moment');
const { validate } = require('../utils/validator');
const Otp = require('../models/otp.model');
const { sendMail, sendSMS } = require('../services/message.service');
const User = require('../models/user.model');
const WalletHistory = require('../models/wallet.history.model');
const { find, findOne } = require('../utils/query');
const flutterwaveService = require('../services/flutterwave.service');

const flutterwave = flutterwaveService.getInstance();
const response = require('../middlewares/api-response');

class UsersController {
  static async createUser(req, res, next) {
    try {
      UsersController.validateRequest(req, false, req.path.includes('signup'));
      const user = await User.create(req.body);
      const expiry = moment.utc().add(1, 'hours');
      const otp = await Otp.create({
        otp: customAlphabet('0123456789', 6)(),
        type: 'verify-email',
        user,
        expiry,
      });
      const message = `Use this code to verify your email ${otp.otp}. This code expires in 1 hour`;
      await sendMail('Verify your email', user.email, message);
      await sendSMS(user.phone, message);
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
        data: {
          ...user.toJSON(),
          totalInvested: await user.getTotalInvested(),
        },
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
      const conditions = ['superadmin', 'admin'].includes(req.user.type)
        ? {}
        : { user: req.user.id };
      const histories = await find(WalletHistory, req, conditions);

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

      users.data = await Promise.all(
        users.data.map(async user => ({
          ...user.toJSON(),
          totalInvested: await user.getTotalInvested(),
        }))
      );

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
      UsersController.validateRequest(req, true);

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

  static async verifyBvn(req, res, next) {
    UsersController.validateRequest(req, false, false, true);
    try {
      const { bvn } = req.body;
      const duplicateUser = await User.findOne({ bvn });
      if (duplicateUser) {
        return response(
          res,
          400,
          'this bvn is already matched with another user'
        );
      }
      // attempt bvn verification
      const bvnDetails = await flutterwave.verifyBvn(bvn);

      if (!bvnDetails) {
        // bvn not resolved at all
        return response(
          res,
          400,
          'we could not verify your bvn. please check your details and try again'
        );
      }
      const {
        first_name,
        last_name,
        middle_name,
        date_of_birth,
        phone_number,
      } = bvnDetails.data;
      req.user.set({
        bvn,
        bvnFirstName: first_name,
        bvnMiddleName: middle_name,
        bvnLastName: last_name,
        bvnDateOfBirth: date_of_birth,
        bvnPhoneNumber: phone_number,
      });
      const check = () => {
        const { firstName, lastName, dateOfBirth } = req.user;
        return (
          (first_name.toLowerCase() !== firstName.toLowercase() &&
            first_name.toLowerCase() !== lastName.toLowercase()) ||
          (last_name.toLowerCase() !== lastName.toLowercase() &&
            last_name.toLowerCase() !== firstName.toLowercase()) ||
          (middle_name.toLowerCase() !== lastName.toLowercase() &&
            middle_name.toLowerCase() !== firstName.toLowercase()) ||
          !moment.utc(date_of_birth).isSame(dateOfBirth, 'day')
        );
      };

      if (check()) {
        // bvn resolved but not a perfect match;
        // TODO: send notification to admin
        await req.user.save();
        return response(
          res,
          400,
          'we coud not match your bvn with your records. please contact support'
        );
      }
      // bvn is a perfect match
      req.user.isBVNVerified = true;
      await req.user.save();
      response(res, 200, 'bvn verified successfully');
    } catch (error) {
      return next(error);
    }
  }

  static async verifyUserBvnAsAdmin(req, res, next) {
    try {
      const user = await User.findById(req.params.userId);
      if (!user) {
        return response(res, 404, 'user not found');
      }
      user.isBVNVerified = !![true, 'true'].includes(req.body.status);
      await user.save();
      return response(res, 200, 'user bvn verification status updated', user);
    } catch (error) {
      next(error);
    }
  }

  static validateRequest(req, isUpdate, isUserSignup, isBvnUpdate = false) {
    const { body, user } = req;
    const fields = {
      type: {
        type: 'string',
        required: !isUpdate && !isUserSignup && !isBvnUpdate,
        enum: ['investor', 'admin', 'superadmin'],
      },
      role: {
        type: 'string',
        required: !isUpdate && !isUserSignup && !isBvnUpdate,
        enum: ['finance', 'non-finance', 'none'],
      },
      firstName: {
        type: 'string',
        required: !isUpdate && !isBvnUpdate,
      },
      lastName: {
        type: 'string',
        required: !isUpdate && !isBvnUpdate,
      },
      email: {
        type: 'string',
        required: !isUpdate && !isBvnUpdate,
      },
      phone: {
        type: 'string',
      },
      password: {
        type: 'string',
        required: !isUpdate && !isBvnUpdate,
      },
      bvn: {
        type: 'string',
        required: isBvnUpdate,
      },
      isEmailVerifed: {
        type: 'string',
      },
      dateOfBirth: {
        type: 'string',
      },
      stateOfOrigin: {
        type: 'string',
      },
      gender: {
        type: 'string',
      },
      nationality: {
        type: 'string',
      },
      occupation: {
        type: 'string',
      },
      residentialAddress: {
        type: 'string',
      },
      cityOfResidence: {
        type: 'string',
      },
      countryOfResidence: {
        type: 'string',
      },
      identificationDoc: {
        type: 'string',
      },
      identificationDocNumber: {
        type: 'string',
      },
      investmentMaturityAlert: {
        type: 'boolean',
      },
      fundWalletAlert: {
        type: 'boolean',
      },
      withdrawalAlert: {
        type: 'boolean',
      },
      newInvestmentAlert: {
        type: 'boolean',
      },
      updateAlert: {
        type: 'boolean',
      },
      ...(['superadmin', 'admin'].includes(user ? user.type : '')
        ? {
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'disabled'],
            },
          }
        : {}),
    };

    validate(body, { properties: fields }, isUpdate);
  }
}

module.exports = UsersController;
