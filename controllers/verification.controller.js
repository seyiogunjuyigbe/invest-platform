const moment = require('moment');
const Verification = require('../models/verification.model');
const BankAccount = require('../models/bank.account.model');
const { find, findOne } = require('../utils/query');
const { validate } = require('../utils/validator');
const { response } = require('../middlewares/api_response');
const FlwService = require('../services/flutterwave.service');

const Flw = new FlwService();
class VerificationController {
  static async requestverificationAsUser(req, res, next) {
    try {
      VerificationController.validateRequest(req.body, 'request');
      const {
        category,
        bvn,
        bankAccount,
        bankAccountName,
        bankCode,
        bankName,
        documentNumber,
      } = req.body;
      if (req.body.category === 'bvn') {
        if (!bvn) {
          return response(res, 400, 'bvn required');
        }
        const duplicateUser = await BankAccount.findOne({ bvn });
        if (duplicateUser) {
          return response(
            res,
            400,
            'this bvn is already matched with another user'
          );
        }
        const verifyAcct = await Flw.verifyAccount(req.body);
        if (!verifyAcct) {
          await Verification.create({
            ...req.body,
            status: 'declined',
            remarks: 'invalid bank details',
            user: req.user.id,
          });
          return response(res, 400, 'invalid bank details');
        }
        const bvnDetails = await Flw.verifyBvn(bvn);
        if (!bvnDetails) {
          await Verification.create({
            ...req.body,
            status: 'declined',
            remarks: 'invalid bvn match',
            user: req.user.id,
          });
          return response(
            res,
            400,
            'we could not verify your bvn. please check your details and try again'
          );
        }
        const check = () => {
          const { first_name, last_name, date_of_birth } = bvnDetails.data;
          const { firstName, lastName, dateOfBirth } = req.user;
          return (
            (first_name.toLowerCase() !== firstName.toLowercase() &&
              first_name.toLowerCase() !== lastName.toLowercase()) ||
            (last_name.toLowerCase() !== lastName.toLowercase() &&
              last_name.toLowerCase() !== firstName.toLowercase()) ||
            !moment.utc(date_of_birth).isSame(dateOfBirth, 'day')
          );
        };
        if (check()) {
          await Verification.create({
            ...req.body,
            status: 'declined',
            remarks: 'invalid bvn match',
            user: req.user.id,
          });
          return response(
            res,
            400,
            'we coud not match your bvn with your records'
          );
        }
        req.user.isBVNVerified = true;
        await Verification.create({
          ...req.body,
          status: 'approved',
          remarks: 'valid bvn match',
          user: req.user.id,
        });
        await BankAccount.create({
          bvn,
          accountNumber: bankAccount,
          accountName: bankAccountName,
          bankCode,
          user: req.user.id,
          bankName,
        });
        await req.user.save();
        response(res, 200, 'bvn verified successfully');
      }
      if (category === 'document') {
        const existingV = await Verification.findOne({
          user: req.user.id,
          status: 'pending',
          category,
        });
        if (existingV) {
          return response(res, 409, 'You have a pending verification request');
        }
        if (!req.file) {
          return response(res, 400, 'document upload required');
        }
        const verification = await Verification.create({
          ...req.body,
          document: req.file.path,
          user: req.user.id,
          documentNumber,
        });

        return response(
          res,
          200,
          'verification request successful',
          verification
        );
      }
    } catch (error) {
      next(error);
    }
  }

  static async viewVerificationRequests(req, res, next) {
    try {
      const requests = await find(Verification, req);
      return response(
        res,
        200,
        'verification requests fetched successfully',
        requests
      );
    } catch (error) {
      next(error);
    }
  }

  static async viewVerificationRequest(req, res, next) {
    try {
      const request = await findOne(Verification, req);
      return response(
        res,
        200,
        'verification request fetched successfully',
        request
      );
    } catch (error) {
      next(error);
    }
  }

  static async updateVerificationRequest(req, res, next) {
    try {
      VerificationController.validateRequest(req.body, 'update');
      const { status, remarks } = req.body;
      const verification = await Verification.findById(
        req.params.requestId
      ).populate('user');
      if (!verification) {
        return response(res, 400, 'verification request not found');
      }
      verification.set({
        status,
        remarks,
        actionBy: req.user.id,
      });
      await verification.save();
      const { user, document, documentNumber } = verification;
      if (status === 'approved' && user.isBVNVerified) {
        user.isKYCVerified = true;
        user.identificationDoc = document;
        user.identificationDocNumber = documentNumber;
        await user.save();
      }
      return response(
        res,
        200,
        'verification request updated sucessfully',
        verification
      );
    } catch (error) {
      next(error);
    }
  }

  static validateRequest(body, action = 'bvn') {
    let fields;
    switch (action) {
      case 'request':
        fields = {
          category: {
            type: 'string',
            required: true,
            enum: ['bvn', 'document'],
          },
          bvn: {
            type: 'string',
            required: false,
          },
          bankAccount: {
            type: 'string',
            required: false,
          },
          bankAccountName: {
            type: 'string',
            required: false,
          },
          bankCode: {
            type: 'string',
            required: false,
          },
          bankName: {
            type: 'string',
            required: false,
          },
          documentNumber: {
            type: 'string',
            required: false,
          },
        };
        break;
      case 'update':
        fields = {
          status: {
            type: 'string',
            required: true,
            enum: ['pending', 'approved', 'declined'],
          },
          remarks: {
            type: 'string',
            required: false,
          },
        };
        break;
      default:
        fields = {
          category: {
            type: 'string',
            required: true,
            enum: ['bvn', 'document'],
          },
        };
        break;
    }

    validate(body, { properties: fields });
  }
}
module.exports = VerificationController;
