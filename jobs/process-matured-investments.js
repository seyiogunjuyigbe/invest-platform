const m = require('moment');
const cronstrue = require('cronstrue');
const { scheduleJob } = require('node-schedule');

const Investment = require('../models/investment.model');
const { asyncSeries } = require('../utils/app');

async function processMaturedInvestment(investment) {
  const { portfolio } = investment;
  if (!portfolio) {
    return;
  }

  console.log(`***** Processing investment with ID(${investment.id})`);

  return investment.payout();
}

async function processMaturedInvestments() {
  console.log('***** Running processMaturedInvestments job *****');
  const allMaturedInvestments = await Investment.find({
    maturityDate: {
      $lte: m.utc().toDate(),
    },
    isClosed: false,
  }).populate('portfolio');

  console.log(
    `***** Found ${allMaturedInvestments.length} matured investments *****`
  );

  return asyncSeries(allMaturedInvestments, processMaturedInvestment);
}

module.exports = async () => {
  const cron = '0 0 2 * * *';
  console.info(
    `Loaded processMaturedInvestments job to be run ${cronstrue.toString(cron)}`
  );
  scheduleJob({ rule: cron, tz: 'Africa/Lagos' }, async () =>
    // Every 2:00:00 AM
    processMaturedInvestments()
  );
};
