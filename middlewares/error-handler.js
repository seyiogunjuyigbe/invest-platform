const { omit, startCase } = require('lodash');
const pluralize = require('pluralize');

// eslint-disable-next-line
module.exports = function errorHandler(err, req, res, next) {
  console.error({ err });
  const isProd = process.env.NODE_ENV === 'production';

  if (err.code === 'ENOTFOUND') {
    return res.status(500).send({
      message: 'Service not available at the moment. Please try again later',
    });
  }

  if (
    err.message &&
    err.message.includes('Cast to ObjectId failed for value')
  ) {
    return res.status(400).send({
      message: 'invalid parameter sent',
      reason: !isProd ? err.message : null,
    });
  }

  if (err.code === 11000) {
    const vars = err.message.split(':');
    const tableName = vars[1].split(' ')[1].split('.')[1];
    const modelName = startCase(pluralize.singular(tableName));
    const fieldName = vars[2].split(' ')[1].split('_')[0];
    console.log({
      err,
      vars,
      tableName,
      modelName,
      fieldName,
    });
    return res.status(400).json({
      message: `${modelName} with the ${fieldName} exists`,
    });
  }

  if (/^5/.test(err.status) || !err.status) {
    const message = !isProd ? err.message : 'Something broke. We will fix it';
    return res.status(500).send({ message });
  }

  if (err.response) {
    const errorText = JSON.parse(err.response.text);

    if (errorText) {
      return res
        .status(400)
        .send({ message: errorText.message || errorText.error });
    }
  }

  if (err) {
    return res
      .status(err.status)
      .send({ message: err.message, errors: omit(err, ['response']) });
  }

  res.status(404).json({ message: 'Not Found' });
};
