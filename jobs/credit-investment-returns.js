const m = require('moment');
const cronstrue = require('cronstrue');
const { scheduleJob } = require('node-schedule');

const Investment = require('../models/investment.model');
const { asyncSeries, currCalc } = require('../utils/app');

async function processInvestmentReturn(investment) {
  const { portfolio } = investment;
  if (!portfolio) {
    return;
  }

  console.log(`***** Processing investment with ID(${investment.id})`);

  const totalReturnsDue = await investment.getCurrentReturnsDue();
  console.log(
    `***** Total returns due for investment with ID(${investment.id}) = ${totalReturnsDue}`
  );

  if (!totalReturnsDue) {
    return;
  }

  const newReturns = currCalc(totalReturnsDue, '-', investment.capitalGains);

  await investment.creditReturn(newReturns);

  return investment.updateOne({
    lastReturnDate: m.utc().toDate(),
    nextReturnDate:
      portfolio.disbursementType === 'monthly'
        ? m.utc().add(1, 'month').startOf('day').toDate()
        : null,
  });
}

async function creditInvestmentReturns() {
  console.log('***** Running creditInvestmentReturns job *****');
  const allInvestmentsDueForReturns = await Investment.find({
    nextReturnDate: {
      $lte: m.utc().toDate(),
    },
  }).populate('portfolio');

  console.log(
    `***** Found ${allInvestmentsDueForReturns.length} investments due for returns *****`
  );

  return asyncSeries(allInvestmentsDueForReturns, processInvestmentReturn);
}

module.exports = async () => {
  const cron = '0 0 0 * * *';
  console.info(
    `Loaded creditInvestmentReturns job to be run ${cronstrue.toString(cron)}`
  );
  scheduleJob({ rule: cron, tz: 'Africa/Lagos' }, async () =>
    // Every 12:00:00 AM
    creditInvestmentReturns()
  );
};
