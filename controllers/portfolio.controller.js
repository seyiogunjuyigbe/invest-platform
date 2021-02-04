const Portfolio = require("../models/portfolio.model");
const { find, findOne } = require("../utils/query")
const moment = require("moment");
const { validate } = require('../utils/validator');
const upload = require("../middlewares/multer");

class PortfolioController {
    static async createPortfolio(req, res) {
        try {
            console.log(req.files)
            const { title, category, startDate, endDate } = req.body;
            if (!title) {
                return res.status(400).json({ success: false, message: "Title required" })
            }
            if (!category) {
                return res.status(400).json({ success: false, message: "Category required" })
            }
            const portfolio = await Portfolio.create({
                ...req.body,
                image: req.files ? req.files.image ? req.files.image[0].path : null : null,
                memorandum: req.files ? req.files.memorandum ? req.files.memorandum[0].path : null : null
            });
            if (startDate && endDate) {
                if (moment.utc(startDate).diff(moment.utc(endDate)) > 0) {
                    return res.status(400).json({ success: false, message: "Start date must be earlier than end date" })
                }
            }
            return res.status(200).json({ success: true, portfolio })
        } catch (err) {
            return res.status(500).json({ success: false, error: err.message })
        }
    }
    static async updatePortfolio(req, res) {
        try {
            const { startDate, endDate } = req.body;
            if (startDate && endDate) {
                if (moment.utc(startDate).diff(moment.utc(endDate)) > 0) {
                    return res.status(400)
                        .json({
                            success: false,
                            message: "Start date must be earlier than end date"
                        })
                }
            }
            let portfolio = await Portfolio
                .findByIdAndUpdate(req.params.portfolioId, {
                    ...req.body,
                    image: req.files ? req.files.image ? req.files.image[0].path : null : null,
                    memorandum: req.files ? req.files.memorandum ? req.files.memorandum[0].path : null : null
                });
            if (!portfolio) {
                return res.status(404).json({ success: false, message: "Portfolio not found" })
            }

            await portfolio.save();
            const updatedPortfolio = await Portfolio.findById(portfolio._id)
            return res.status(200).json({ success: true, portfolio: updatedPortfolio })
        } catch (err) {
            return res.status(500).json({ success: false, error: err.message })
        }
    }
    static async deletePortfolio(req, res) {
        try {
            await Portfolio.findByIdAndDelete(req.params.portfolioId);
            return res.status(200).json({ success: true, message: "Portfolio deleted" })
        } catch (err) {
            return res.status(500).json({ success: false, error: err.message })
        }
    }
    static async fetchPortfolios(req, res) {
        try {
            let portfolios = await find(Portfolio, req);
            return res.status(200).json({ success: true, portfolios })
        } catch (err) {
            return res.status(500).json({ success: false, error: err.message })
        }
    }
    static async fetchSinglePortfolio(req, res) {
        try {
            const portfolio = await findOne(Portfolio, req);
            return res.status(200).json({ success: true, portfolio })
        } catch (err) {
            return res.status(500).json({ success: false, error: err.message })
        }
    }

}
module.exports = PortfolioController