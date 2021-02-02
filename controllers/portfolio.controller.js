const Portfolio = require("../models/portfolio.model");
const { find, findOne } = require("../utils/query")

class PortfolioController {
    static async createPortfolio(req, res, next) {
        try {
            const portfolio = await Portfolio.create({ ...req.body });
            return res.status(200).json({ success: true, portfolio })
        } catch (err) {
            next(err)
        }
    }
    static async updatePortfolio(req, res, next) {
        try {
            let portfolio = await Portfolio.findByIdAndUpdate(req.params.portfolioId, { ...req.body });
            if (!portfolio) {
                return res.status(404).json({ success: false, message: "Portfolio not found" })
            }
            await portfolio.save();
            const updatedPortfolio = await Portfolio.findById(portfolio._id)
            return res.status(200).json({ success: true, portfolio: updatedPortfolio })
        } catch (err) {
            next(err)
        }
    }
    static async deletePortfolio(req, res, next) {
        try {
            await Portfolio.findByIdAndDelete(req.params.portfolioId);
            return res.status(200).json({ success: true, message: "Portfolio deleted" })
        } catch (err) {
            next(err)
        }
    }
    static async fetchPortfolios(req, res, next) {
        try {
            let portfolios = await find(Portfolio, req);
            return res.status(200).json({ success: true, portfolios })
        } catch (err) {
            next(err)
        }
    }
    static async fetchSinglePortfolio(req, res, next) {
        try {
            const portfolio = await findOne(Portfolio, req);
            return res.status(200).json({ success: true, portfolio })
        } catch (err) {
            next(err)
        }
    }
}
module.exports = PortfolioController