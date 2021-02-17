const createError = require('http-errors');
const { validate } = require('../utils/validator');
const Investment = require('../models/investment.model');
const InvestmentReturn = require('../models/investment.return.model');
const User = require('../models/user.model');
const { find, findOne } = require('../utils/query');

class InvestmentsController {
  static async createInvestment(req, res, next) {
    try {
      InvestmentsController.validateRequest(req, false);

      const investment = await Investment.create(req.body);

      return res.status(200).json({
        message: 'investment created successfully',
        data: investment,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createAndFundInvestment(req, res, next) {
    try {
      const user = ['superadmin', 'admin'].includes(req.user.type)
        ? await User.findById(req.body.userId)
        : req.user;

      if (!user) {
        throw createError(400, 'invalid user info');
      }

      InvestmentsController.validateRequest(req, false);

      const wallet = await user.getWallet();
      const investment = await Investment.create({
        ...req.body,
        user: user.id,
      });

      await wallet.fundInvestment(investment, investment.capital);

      return res.status(200).json({
        message: 'investment created and funded successfully',
        data: investment,
      });
    } catch (error) {
      next(error);
    }
  }

  static async fundInvestment(req, res, next) {
    try {
      const user = ['superadmin', 'admin'].includes(req.user.type)
        ? await User.findById(req.body.userId)
        : req.user;

      if (!user) {
        throw createError(400, 'invalid user info');
      }

      InvestmentsController.validateRequest(req, false, 'fund');

      const wallet = await user.getWallet();
      const investment = await Investment.findById(req.params.investmentId);

      if (!investment) {
        throw createError(404, 'investment not found');
      }

      if (investment.isClosed) {
        throw createError(422, 'you cannot fund a closed investment');
      }

      if (user.id !== investment.user.toString()) {
        throw createError(403, 'you are not allowed to perform this action');
      }

      await wallet.fundInvestment(investment, req.body.amount);

      return res.status(200).json({
        message: 'investment funded successfully',
        data: investment,
      });
    } catch (error) {
      next(error);
    }
  }

  static async creditInvestmentReturn(req, res, next) {
    try {
      const user = await User.findById(req.body.userId);

      if (!user) {
        throw createError(400, 'invalid user info');
      }

      InvestmentsController.validateRequest(req, false, 'credit-return');

      const investment = await Investment.findById(req.params.investmentId);

      if (!investment) {
        throw createError(404, 'investment not found');
      }

      if (investment.isClosed) {
        throw createError(
          422,
          'you cannot credit returns to a closed investment'
        );
      }

      if (user.id !== investment.user.toString()) {
        throw createError(403, 'you are not allowed to perform this action');
      }

      const newReturn = await investment.creditReturn(
        req.body.amount,
        req.user.id
      );

      return res.status(200).json({
        message: 'investment return credited successfully',
        data: newReturn,
      });
    } catch (error) {
      next(error);
    }
  }

  static async fetchInvestment(req, res, next) {
    try {
      const investment = await findOne(Investment, req);

      return res.status(200).json({
        message: 'investment retrieved successfully',
        data: investment,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listInvestments(req, res, next) {
    try {
      const conditions = ['superadmin', 'admin'].includes(req.user.type)
        ? {}
        : { user: req.user.id };

      const investments = await find(Investment, req, conditions);

      return res.status(200).json({
        message: 'investments retrieved successfully',
        data: investments,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listInvestmentReturns(req, res, next) {
    try {
      const conditions = ['superadmin', 'admin'].includes(req.user.type)
        ? {}
        : { user: req.user.id };

      const returns = await find(InvestmentReturn, req, conditions);

      return res.status(200).json({
        message: 'investment returns retrieved successfully',
        data: returns,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateInvestment(req, res, next) {
    try {
      InvestmentsController.validateRequest(req, true);

      const investment = await findOne(Investment, req);

      if (!investment) {
        throw createError('404', 'investment not found');
      }

      await investment.updateOne(req.body);

      return res.status(200).json({
        message: 'investments retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteInvestment(req, res, next) {
    try {
      const investment = await findOne(Investment, req);

      if (!investment) {
        throw createError('404', 'investment not found');
      }

      await Investment.remove({ _id: req.params.investmentId });

      return res.status(200).json({
        message: 'investment deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static validateRequest(req, isUpdate, type = 'create') {
    const { body, user } = req;
    let fields;

    switch (type) {
      case 'create':
        fields = {
          name: {
            type: 'string',
            required: false,
          },
          capital: {
            type: ['integer', 'number'],
            required: !isUpdate,
          },
          portfolio: {
            type: 'string',
            format: 'mongo-id',
            required: !isUpdate,
          },
        };
        break;

      case 'fund':
      case 'credit-return':
        fields = {
          amount: {
            type: ['integer', 'number'],
            required: true,
          },
          ...(['superadmin', 'admin'].includes(user.type)
            ? {
                userId: {
                  type: 'integer',
                  required: true,
                },
              }
            : {}),
        };
        break;

      default:
        break;
    }

    validate(body, { properties: fields }, isUpdate);
  }
}

module.exports = InvestmentsController;
