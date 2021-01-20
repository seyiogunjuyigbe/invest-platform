const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const User = mongoose.model('user');

passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true,
  },
  function (req, email, password, done) {
    User.findOne({ email: email, isDeleted: false }, function (err, user) {
      if (err) { return done(err); }

      if (!user) {
        return done(null, false, { message: 'Invalid credentials.' });
      }

      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Invalid password.' });
      }

      return done(null, user);
    });
  }
));
