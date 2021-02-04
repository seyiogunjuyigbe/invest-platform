module.exports = function adminRoute(criteria) {
  return async function adminRouteMiddleware(req, res, next) {
    if (!req.user) {
      return res.status(403).json({
        status: false,
        message: 'You are not authorised to perform this action.',
      });
    }

    if (req.user.type === 'superadmin') return next();

    if (req.user.type !== 'admin') {
      return res.status(403).json({
        status: false,
        message: 'You are not authorised to perform this action.',
      });
    }

    try {
      const isAlllowed = [];

      Object.keys(criteria).forEach(criterium => {
        if (req.user[criterium] !== criteria[criterium]) isAlllowed.push(false);
      });

      if (!isAlllowed.includes(false)) {
        return res.status(401).json({
          status: false,
          message:
            'You are not authorized to perform this action. Please contact superadmin.',
        });
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
};
