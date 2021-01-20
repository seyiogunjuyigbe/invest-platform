const { pick } = require('lodash');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const createError = require('http-errors');


class AuthController {
  static async login(req, res, next) {
    try {
      this.validateRequest(req.body, 'login');

      passport.authenticate('local', function (err, user, info) {
        if (err) return res.status(401).json(err);

        if (!user) return res.status(401).json(info);

        let token = jwt.sign(
          pick(
            user.toJSON(),
            ['_id', 'type', 'role', 'email', 'isEmailVerified']
          ),
          process.env.JWT_SECRET,
          { expiresIn: process.env.TOKEN_EXPIRY || 604800 }, // 7 days
        );

        jwt.verify(token, process.env.JWT_SECRET, function (err, decoded) {
          req.user = user;
          return res.status(200).json({
            message: 'Login successful',
            data: {
              user,
              token: token,
              expiry: decoded.exp
            }
          });
        });

      })(req, res);
    } catch (error) {
      next(error);
    }
  };

  static async changePassword(req, res, next) {
    try {
      this.validateRequest(req.body, 'change-password');

      const user = req.user;

      const isOldPasswordCorrect = await user.validPassword(req.body.oldPassword);


      if (!isOldPasswordCorrect) {
        throw createError(400, 'old password incorrect')
      }

      user.password = req.body.newPassword;
      await user.save();

      return res.status(200).json({
        message: 'password changed successfully'
      });
    } catch (error) {
      next(error)
    }
  };

  static validateRequest(body, action = 'login') {
    let fields;

    switch (action) {
      case 'login':
        fields = {
          email: {
            type: 'email',
            required: true,
          },
          password: {
            type: 'string',
            required: true,
          },
        };
        break;

      case 'change-password':
        fields = {
          oldPassword: {
            type: 'email',
            required: true,
          },
          newPassword: {
            type: 'string',
            required: true,
          },
        }
        break;

      default:
        break;
    }

    validate(body, { properties: fields });
  }
}

module.exports = AuthController;

