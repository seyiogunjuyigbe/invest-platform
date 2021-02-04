const { omit } = require('lodash');

module.exports = (err, req, res) => {
  console.error(err);
  const isProd = process.env.NODE_ENV === 'production';

  if (err.code === 'ENOTFOUND') {
    return res.status(500).send({
      message: 'Service not available at the moment. Please try again later',
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
