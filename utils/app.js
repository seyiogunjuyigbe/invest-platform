const n = require('numeral');

exports.objToQueryParams = function objToQueryParams(obj) {
  return Object.keys(obj).reduce((query, key) => {
    let pre = '';
    if (query !== '') {
      pre = `${query}&`;
    }
    return `${pre}${key}=${obj[key]}`;
  }, '');
};

exports.buildUrlParams = function buildUrlParams(url, params = {}) {
  const link = url.replace(/(\/|\?)$/, '');
  const paramQuery = exports.objToQueryParams(params);
  const join = link.includes('?') ? '&' : '?';
  return `${link}${join}${paramQuery}`;
};

exports.createReference = function createReference(type) {
  const randomChars = Math.random().toString(32).substr(8);
  let prefix = '';
  switch (type) {
    case 'deposit':
      prefix = 'BGIP_DEP';
      break;
    case 'withdrawal':
      prefix = 'BGIP_WDW';
      break;
    case 'fund':
      prefix = 'BGIP_FND';
      break;
    case 'payout':
      prefix = 'BGIP_PYT';
      break;
    case 'refund':
      prefix = 'BGIP_RFD';
      break;
    case 'return':
      prefix = 'BGIP_RTN';
      break;
    case 'penalty':
      prefix = 'BGIP_PEN';
      break;
    default:
      break;
  }

  return `${prefix}_${randomChars}_${Date.now()}`.toUpperCase();
};

exports.currCalc = function currCalc(val1, op, val2, toString = false) {
  const operand = {
    '*': 'multiply',
    '+': 'add',
    '-': 'subtract',
    '/': 'divide',
  }[op];

  const result = n(val1)[operand](val2);

  if (toString) {
    return result.format('0.00');
  }

  return result.value();
};

exports.asyncSeries = async function asyncSeries(array, callback, useIndex) {
  return array.reduce(async (previousPromise, nextItem, index) => {
    await previousPromise;

    return useIndex ? callback(nextItem, index) : callback(nextItem);
  }, Promise.resolve());
};
exports.formatAmountToCurrency = function formatAmountToCurrency(
  number,
  currency = 'NGN'
) {
  const format = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    currencyDisplay: 'symbol',
  });
  return format(number);
};
