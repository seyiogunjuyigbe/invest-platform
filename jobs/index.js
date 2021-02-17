const creditInvestmentReturns = require('./credit-investment-returns');
const processMaturedInvestments = require('./process-matured-investments');

module.exports = async () => {
  await creditInvestmentReturns();
  await processMaturedInvestments();
};
