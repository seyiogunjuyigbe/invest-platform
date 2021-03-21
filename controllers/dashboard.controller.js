const { groupBy, startCase } = require('lodash');

const User = require('../models/user.model');
const Portfolio = require('../models/portfolio.model');
const Investment = require('../models/investment.model');

class DashboardController {
  static async getInvestmentsData(req, res, next) {
    try {
      const totalInvestorCount = await User.countDocuments({
        type: 'investor',
      });

      const totalPortfolios = await Portfolio.find({});
      const totalPortfolioCount = totalPortfolios.length;

      const portfoliosByCategories = groupBy(totalPortfolios, 'category');

      const investorCountByCategories = await Promise.all(
        Object.keys(portfoliosByCategories).map(async category => ({
          category: `${startCase(category)} Investors`,
          investorCount: await User.countDocuments({
            type: 'investor',
            portfolios: portfoliosByCategories[category].map(p => p.id),
          }),
        }))
      );

      const totalInvestments = await Investment.find({
        isClosed: false,
      });

      const totalInvestmentCount = totalInvestments.length;

      const poolBalance = totalInvestments.reduce(
        (p, n) => p + n.currentBalance,
        0
      );

      return res.status(200).json({
        message: 'investments data retrieved successfully',
        data: {
          totalInvestorCount,
          totalPortfolioCount,
          totalInvestmentCount,
          poolBalance,
          investorCountByCategories,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
module.exports = DashboardController;
