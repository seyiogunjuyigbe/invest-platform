const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Wallet = require('./wallet.model');

const { Schema } = mongoose;

const UserSchema = new Schema(
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
      sparse: true,
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
    isKYCVerified: {
      type: Boolean,
      default: false,
    },
    dateOfBirth: Date,
    stateOfOrigin: String,
    gender: String,
    nationality: String,
    occupation: String,
    residentialAddress: String,
    cityOfResidence: String,
    countryOfResidence: String,
    identificationDoc: String,
    identificationDocNumber: String,
    bvnFirstName: String,
    bvnMiddleName: String,
    bvnLastName: String,
    bvnDateOfBirth: String,
    bvnPhoneNumber: String,
    bankAccounts: [
      {
        type: Schema.Types.ObjectId,
        ref: 'BankAccount',
      },
    ],
    portfolios: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Portfolio',
        default: [],
      },
    ],
  },
  {
    timestamps: true,
  }
);

UserSchema.statics.comparePassword = async (password, userPassword) =>
  bcrypt.compare(password, userPassword);

UserSchema.options.toJSON = {
  virtuals: true,
  transform(doc, ret) {
    delete ret.password;
    ret.bvn = jwt.decode(ret.bvn);
    return ret;
  },
};

UserSchema.virtual('name').get(function name() {
  return `${this.firstName} ${this.lastName}`;
});

UserSchema.pre('save', function saveHook(next) {
  if (!this.isModified('password')) return next();
  const saltRounds = 10;
  const salt = bcrypt.genSaltSync(saltRounds);
  const hash = bcrypt.hashSync(this.password, salt);
  this.password = hash;
  return next();
});

UserSchema.pre('save', function saveBvn(next) {
  if (!this.isModified('bvn')) return next();
  this.bvn = jwt.sign(this.bvn, process.env.JWT_SECRET);
  return next();
});

UserSchema.methods.validPassword = async function validPassword(password) {
  return bcrypt.compare(password, this.password);
};

UserSchema.methods.getWallet = async function getWallet() {
  const wallet = await Wallet.findOne({
    user: this.id,
  });

  return wallet || Wallet.create({ user: this.id });
};

const User = mongoose.model('User', UserSchema);

module.exports = User;
