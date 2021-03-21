const creditInvestmentReturns = require('./credit-investment-returns');
const processMaturedInvestments = require('./process-matured-investments');
const processPendingTransactions = require('./process-pending-transactions');

module.exports = async () => {
  await creditInvestmentReturns();
  await processMaturedInvestments();
  await processPendingTransactions();
};
