const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phoneNo: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    isEmailVerifed: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.statics.comparePassword = async (password, userPassword) =>
  bcrypt.compare(password, userPassword);

userSchema.options.toJSON = {
  transform(doc, ret) {
    delete ret.password;
    return ret;
  },
};

userSchema.pre('save', function saveHook(next) {
  if (!this.isModified('password')) return next();
  const saltRounds = 10;
  const salt = bcrypt.genSaltSync(saltRounds);
  const hash = bcrypt.hashSync(this.password, salt);
  this.password = hash;
  return next();
});

userSchema.methods.comparePassword = function comparePassword(password, cb) {
  if (!this.password && cb) {
    return cb(new Error('Registration not complete'), false);
  }

  if (!cb && this.password) {
    return bcrypt.compareSync(password, this.password);
  }

  if (cb) {
    bcrypt.compare(password, this.password, (err, isMatch) => {
      cb(err, isMatch);
    });
  }
};

const userModel = mongoose.model('User', userSchema);

module.exports = userModel;
