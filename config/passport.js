const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user.model');

passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true,
  },
  function (req, email, password, done) {
    User.findOne({ email }, async function (err, user) {
      if (err) { return done(err); }

      if (!user) {
        return done(null, false, { message: 'Invalid credentials.' });
      }

      const isValidPassword = await user.validPassword(password);

      if (!isValidPassword) {
        return done(null, false, { message: 'Invalid password.' });
      }

      return done(null, user);
    });
  }
));
