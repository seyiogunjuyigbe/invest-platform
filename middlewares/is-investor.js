module.exports = function isInvestor(req, res, next) {
  if (!req.user) {
    return res.status(403).json({
      status: false,
      message: 'You are not authorised to perform this action.',
    });
  }

  if (req.user.type !== 'investor') {
    return res.status(403).json({
      status: false,
      message: 'You are not authorised to perform this action.',
    });
  }

  return next();
};
