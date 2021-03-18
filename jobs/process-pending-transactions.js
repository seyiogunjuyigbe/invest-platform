const cronstrue = require('cronstrue');
const { scheduleJob } = require('node-schedule');

const Transaction = require('../models/transaction.model');
const { asyncSeries } = require('../utils/app');

async function processPendingTransaction(transaction) {
  console.log(`***** Processing transaction with ID(${transaction.id})`);

  return transaction.processPayment();
}

async function processPendingTransactions() {
  console.log('***** Running processPendingTransactions job *****');
  const allPendingTransactions = await Transaction.find({
    status: 'pending',
    type: 'deposit',
  });

  console.log(
    `***** Found ${allPendingTransactions.length} pending transactions *****`
  );

  return asyncSeries(allPendingTransactions, processPendingTransaction);
}

module.exports = async () => {
  await processPendingTransactions();
  const cron = '0 0 */1 * * *';
  console.info(
    `Loaded processPendingTransactions job to be run ${cronstrue.toString(
      cron
    )}`
  );
  scheduleJob({ rule: cron, tz: 'Africa/Lagos' }, async () =>
    // Every hour
    processPendingTransactions()
  );
};
