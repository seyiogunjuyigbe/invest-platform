const moment = require('moment');
const Portfolio = require('../models/portfolio.model');
const { find, findOne } = require('../utils/query');
const { validate } = require('../utils/validator');

class PortfolioController {
  static async createPortfolio(req, res, next) {
    try {
      PortfolioController.validateRequest(req.body);
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
      });
      if (startDate && endDate) {
        if (moment.utc(startDate).diff(moment.utc(endDate), 'days') > 0) {
          return res.status(400).json({
            message: 'Start date must be earlier than end date',
          });
        }
      }
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
      return res
        .status(200)
        .json({ message: 'portfolio retrieved successfully', data: portfolio });
    } catch (err) {
      next(err);
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
      },
      description: {
        type: 'string',
        required: false,
      },
      roi: {
        type: 'number',
        required: false,
      },
      risk: {
        type: 'string',
        required: false,
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
