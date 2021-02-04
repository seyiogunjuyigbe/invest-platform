const jwt = require('jsonwebtoken');

const User = require('../models/user.model');

module.exports = function isAuthenticated(req, res, next) {
  if (req.headers && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2) {
      const scheme = parts[0];
      const credentials = parts[1];
      if (/^Bearer$/i.test(scheme)) {
        const token = credentials;
        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
          if (err) {
            return res.status(401).json({ message: err.message });
          }

          req.user = await User.findById(decoded._id);
          if (!req.user) {
            return res.status(401).json({
              message: 'Invalid auth credentials',
            });
          }

          next();
        });
      } else {
        return res
          .status(401)
          .json({ message: 'Format is Authorization: Bearer [token]' });
      }
    } else {
      return res
        .status(401)
        .json({ message: 'Format is Authorization: Bearer [token]' });
    }
  } else {
    return res
      .status(401)
      .json({ message: 'No Authorization header was found' });
  }
};
