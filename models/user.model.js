const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Wallet = require('./wallet.model');

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
      unique: true,
    },
    phone: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    isEmailVerifed: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      default: 'investor',
      enum: ['investor', 'admin', 'superadmin'],
      required: true,
    },
    role: {
      type: String,
      default: 'none',
      enum: ['finance', 'non-finance', 'none'],
    },
    notificationToken: String,
    bvn: String,
    isBVNVerified: {
      type: Boolean,
      default: false,
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

userSchema.methods.validPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.getWallet = async function () {
  const wallet = await Wallet.findOne({
    user: this.id,
  });

  return wallet || await Wallet.create({ user: this.id });
};

const userModel = mongoose.model('User', userSchema);

module.exports = userModel;
