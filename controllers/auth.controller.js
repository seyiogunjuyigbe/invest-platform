const { pick } = require('lodash');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const { customAlphabet } = require("nanoid")
const { validate } = require('../utils/validator');
const User = require("../models/user.model")
const Otp = require("../models/otp.model")
const { sendMail } = require("../services/mailService")
const moment = require("moment")
class AuthController {
  static async login(req, res, next) {
    try {
      AuthController.validateRequest(req.body, 'login');

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
      AuthController.validateRequest(req.body, 'change-password');

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
  static async requestPasswordReset(req, res, next) {
    try {
      let { email } = req.body;
      AuthController.validateRequest(req.body, "reset-password")
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(403).json({
          message: "No account found with this email"
        })
      } else {
        // expire previous Otps
        let previousOtps = await Otp.find({ user, isExpired: false, type: "reset-password", });
        previousOtps.forEach(previousOtp => {
          previousOtp.isExpired = true;
          previousOtp.save()
        })
        let expiry = moment.utc().add(1, 'hours')
        let otp = await Otp.create({
          otp: customAlphabet("23456789ADFGHJKLMNBVCXZPUYTREWQ", 8)(),
          type: "reset-password",
          user,
          expiry,
        });
        console.log({ otp })

        let message = `Use this code to reset your password: ${otp.otp}. This code expires in 1 hour`
        await sendMail("Password Reset", user.email, message)
        return res.status(200).json({ message: "A reset code has been sent to your email address" })
      }
    } catch (err) {
      next(err)
    }
  }
  static async resetPassword(req, res, next) {
    try {
      AuthController.validateRequest(req.body, 'set-password');
      let otp = await Otp.findOne({ otp: req.params.otp }).populate("user");
      if (!otp) {
        return res.status(401).json({ message: "Invalid Recovery Code" })
      }
      if (otp.isExpired || moment.utc(otp.expiresIn).diff(moment.utc(), "hours") > 0) {
        // expire the otp if it is just a date difference
        otp.isExpired = true;
        await otp.save()
        return res.status(401).json({ message: "This code is expired. Please request a new one" })
      }
      let { user } = otp;
      user.password = req.body.password;
      otp.isExpired = true;
      await otp.save()
      await user.save();
      return res.status(200).json({
        message: 'Password reset successful'
      });

    } catch (err) {
      next(err)
    }
  }
  static async resendVerificationToken(req, res, next) {
    try {
      let { email } = req.body;
      AuthController.validateRequest(req.body, "verification")
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(403).json({
          message: "No account found with this email"
        })
      };
      if (user.isEmailVerifed) {
        return res.status(409).json({ message: "User account already verified" })
      }
      // expire all previous tokens
      let previousOtps = await Otp.find({ user, isExpired: false, type: "verify-email", });
      previousOtps.forEach(previousOtp => {
        previousOtp.isExpired = true;
        previousOtp.save()
      })
      let expiry = moment.utc().add(1, 'hours')
      let otp = await Otp.create({
        otp: customAlphabet("23456789ADFGHJKLMNBVCXZPUYTREWQ", 8)(),
        type: "verify-email",
        user,
        expiry,
      });
      console.log({ otp })

      let message = `Use this code to verify your email ${otp.otp}. This code expires in 1 hour`
      await sendMail("Verify you email", user.email, message)
      return res.status(200).json({ message: "A reset code has been sent to your email address" })

    } catch (err) {
      next(err)
    }
  }
  static async verifyEmail(req, res, next) {
    try {
      let otp = await Otp.findOne({ otp: req.params.otp }).populate("user");
      if (!otp) {
        return res.status(401).json({ message: "Invalid Verification Code" })
      }
      if (otp.isExpired || moment.utc(otp.expiresIn).diff(moment.utc(), "hours") > 0) {
        // expire the otp if it is just a date difference
        otp.isExpired = true;
        await otp.save()
        return res.status(401).json({ message: "This code is expired. Please request a new one" })
      }
      let { user } = otp;
      if (user.isEmailVerifed) {
        return res.status(409).json({ message: "User account already verified" })
      }
      user.isEmailVerifed = true;
      console.log({ otp, user })
      otp.isExpired = true;
      await otp.save()
      await user.save();
      return res.status(200).json({
        message: 'Email verified successfully'
      });

    } catch (err) {
      next(err)
    }
  }
  static validateRequest(body, action = 'login') {
    let fields;

    switch (action) {
      case 'login':
        fields = {
          email: {
            type: 'string',
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
            type: 'string',
            required: true,
          },
          newPassword: {
            type: 'string',
            required: true,
          },
        }
        break;

      case 'set-password':
        fields = {
          password: {
            type: 'string',
            required: true,
          },
        }
        break;
      case 'reset-password':
        fields = {
          email: {
            type: 'string',
            required: true
          }
        }
      case 'verification':
        fields = {
          email: {
            type: 'string',
            required: true
          }
        }
      default:
        break;
    }

    validate(body, { properties: fields });
  }

}

module.exports = AuthController;

