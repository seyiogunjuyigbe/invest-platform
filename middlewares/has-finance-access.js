module.exports = function hasFinanceAccess(req, res, next) {
  if (!req.user) {
    return res.status(403).json({
      status: false,
      message: 'You are not authorised to perform this action.',
    });
  }

  if (['superadmin', 'investor'].includes(req.user.type)) return next();

  if (req.user.type === 'admin' && req.user.role !== 'finance') {
    return res.status(403).json({
      status: false,
      message: 'You are not authorised to perform this action.',
    });
  }

  return next();
};
