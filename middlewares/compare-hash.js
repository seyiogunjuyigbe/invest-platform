const crypto = require('crypto');

const { HELLOSIGN_KEY } = process.env;

module.exports = function compareHash(obj) {
  const { event_time, event_type, event_hash } = obj;
  const newHash = crypto
    .createHmac('sha256', HELLOSIGN_KEY)
    .update(event_time + event_type)
    .digest('hex')
    .toString();
  return newHash === event_hash;
};
