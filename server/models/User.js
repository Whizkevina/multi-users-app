const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const saltRounds = 10;

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      trim: true,
      required: true,
      max: 12,
      unique: true,
      index: true,
      lowercase: true
    },
    name: {
      type: String,
      trim: true,
      required: true,
      max: 32
    },
    email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      lowercase: true
    },
    hashed_password: {
      type: String,
      default: ''
    },
    role: {
      type: String,
      required: true,
      default: 'user',
      enum: ['admin', 'user', 'root']
    },
    resetPasswordLink: {
      data: String,
      default: ''
    }
  },
  { timestamps: true }
);

UserSchema.virtual('password')
  .set(function(password) {
    // create a temporarity variable called _password
    this._password = password;
    // encrypt the input
    this.hashed_password = this.encryptPassword(password);
  })
  .get(function() {
    return this._password;
  });

UserSchema.methods = {
  //compare the input password to the hashed password in the server
  authenticate: function(plainText) {
    return bcrypt.compareSync(plainText) === this.hashed_password;
  },

  encryptPassword: function(password) {
    if (!password) return '';
    try {
      return bcrypt.hashSync(password, saltRounds);
    } catch (err) {
      console.error(err);
    }
  }
};

module.exports = mongoose.model('User', UserSchema);
