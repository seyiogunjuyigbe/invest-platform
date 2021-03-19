const moment = require('moment');
const Portfolio = require('../models/portfolio.model');
const User = require('../models/user.model');
const { find, findOne } = require('../utils/query');
const { validate } = require('../utils/validator');
const { sendPushNotification } = require('../services/notification.service');
const requestSignature = require('../services/hellosign');
const compareHash = require('../middlewares/compare-hash');

class PortfolioController {
  static async createPortfolio(req, res, next) {
    try {
      PortfolioController.validateRequest({ ...req.body });
      const { startDate, endDate } = req.body;
      let image;
      let memorandum;

      if (req.files) {
        if (req.files.image) {
          image = req.files.image[0].path;
        }
        if (req.files.memorandum) {
          memorandum = req.files.memorandum[0].path;
        }
      }
      const portfolio = await Portfolio.create({
        ...req.body,
        image,
        memorandum,
        localPath: `${req.body.title}_${Date.now()}`,
      });
      if (startDate && endDate) {
        if (moment.utc(startDate).diff(moment.utc(endDate), 'days') > 0) {
          return res.status(400).json({
            message: 'Start date must be earlier than end date',
          });
        }
      }
      // send push notification to all active users;
      const users = await User.find({
        status: 'active',
        newInvestmentAlert: true,
      });
      const userIds = users.map(user => user._id);
      const title = `New Portfolio`;
      const message = `A new ${portfolio.category} investment portfolio is now available`;
      await sendPushNotification(userIds, title, message);
      return res
        .status(200)
        .json({ message: 'portfolio created successfully', data: portfolio });
    } catch (err) {
      next(err);
    }
  }

  static async updatePortfolio(req, res, next) {
    try {
      const { startDate, endDate } = req.body;
      if (startDate && endDate) {
        if (moment.utc(startDate).diff(moment.utc(endDate), 'days') > 0) {
          return res.status(400).json({
            message: 'Start date must be earlier than end date',
          });
        }
      }
      if (req.files) {
        if (req.files.image) {
          req.body.image = req.files.image[0].path;
        }
        if (req.files.memorandum) {
          req.body.memorandum = req.files.memorandum[0].path;
        }
      }
      const portfolio = await Portfolio.findByIdAndUpdate(
        req.params.portfolioId,
        {
          ...req.body,
        }
      );
      if (!portfolio) {
        return res.status(404).json({ message: 'portfolio not found' });
      }

      await portfolio.save();
      const updatedPortfolio = await Portfolio.findById(portfolio._id);
      return res.status(200).json({
        message: 'portfolio updated successfully',
        data: updatedPortfolio,
      });
    } catch (err) {
      next(err);
    }
  }

  static async deletePortfolio(req, res, next) {
    try {
      await Portfolio.findByIdAndDelete(req.params.portfolioId);
      return res
        .status(200)
        .json({ message: 'portfolio deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  static async fetchPortfolios(req, res, next) {
    try {
      const portfolios = await find(Portfolio, req);
      portfolios.data.map(async portfolio => ({
        ...portfolio.toJSON(),
        investorCount: await portfolio.getInvestorCount(),
      }));
      return res.status(200).json({
        message: 'portfolios retrieved successfully',
        data: portfolios,
      });
    } catch (err) {
      next(err);
    }
  }

  static async fetchSinglePortfolio(req, res, next) {
    try {
      const portfolio = await findOne(Portfolio, req);
      return res.status(200).json({
        message: 'portfolio retrieved successfully',
        data: {
          ...portfolio.toJSON(),
          investorCount: await portfolio.getInvestorCount(),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async initiateMouSignature(req, res, next) {
    try {
      let portfolio = await Portfolio.findById(req.params.portfolioId);
      if (!portfolio) {
        return res.status(400).json({ message: 'portfolio not found' });
      }
      if (!portfolio.localPath) {
        await portfolio.updateOne({
          localPath: `${portfolio.title}_${Date.now()}`,
        });
        portfolio = await Portfolio.findById(portfolio._id);
      }
      const getSignUrl = await requestSignature(req.user, portfolio);
      const isSuccessful =
        getSignUrl.statusCode === 200 && getSignUrl.statusMessage === 'OK';
      return res.status(isSuccessful ? 200 : 400).json({
        message: isSuccessful
          ? 'signature request initiated successfully'
          : 'an error occured, plese try again',
        data: getSignUrl ? getSignUrl.embedded : null,
      });
    } catch (error) {
      next(error);
    }
  }

  static async completeMouSignature(req, res, next) {
    try {
      const reqBody = JSON.parse(req.body.json);
      if (!compareHash(reqBody.event)) {
        return res.status(403).json({ message: 'Unauthorized access' });
      }
      if (reqBody && reqBody.event.event_type === 'signature_request_signed') {
        const { portfolioId, userId } = reqBody.signature_request.metadata;
        const portfolio = await Portfolio.findById(portfolioId);
        const user = await User.findById(userId);
        user.signedPortfolioMous.addToSet(portfolio._id);
        await user.save();
      }
      return res.status(200).send('Hello API Event Received');
    } catch (error) {
      next(error);
    }
  }

  static validateRequest(body) {
    const fields = {
      title: {
        type: 'string',
        required: true,
      },
      category: {
        type: 'string',
        required: true,
        enum: ['forex', 'real-estate', 'mutual-funds'],
      },
      description: {
        type: 'string',
        required: false,
      },
      roi: {
        type: 'number',
        required: true,
      },
      duration: {
        type: 'number',
        required: true,
      },
      risk: {
        type: 'string',
        required: true,
        enum: ['low', 'medium', 'high'],
      },
      disbursementType: {
        type: 'string',
        required: true,
        enum: ['monthly', 'maturity'],
      },
      startDate: {
        type: 'string',
        required: false,
      },
      endDate: {
        type: 'string',
        required: false,
      },
      minInvestment: {
        type: 'number',
        required: false,
      },
      maxInvestment: {
        type: 'number',
        required: false,
      },
      image: {
        type: 'string',
        required: false,
      },
      memorandum: {
        type: 'string',
        required: false,
      },
    };

    validate(body, { properties: fields });
  }
}

module.exports = PortfolioController;
