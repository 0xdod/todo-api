const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const _ = require("lodash");

const Schema = mongoose.Schema;
let userSchema = new Schema({
  email: {
    type: String,
    required: true,
    minlength: 1,
    trim: true,
    unique: true,
    validate: {
      validator: validator.isEmail,
      message: "{VALUE} is not a valid email",
    },
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  tokens: [
    {
      access: {
        type: String,
        required: true,
      },
      token: {
        type: String,
        required: true,
      },
    },
  ],
});

userSchema.methods.toJSON() = function () {
  const self = this;
  const selfObject = self.toObject();

  return _.pick(selfObject, ["_id", "email"]);
};

userSchema.methods.generateAuthToken = function () {
  const user = this;
  const access = "auth";
  const token = jwt
    .sign({ _id: user._id.toHexString(), access }, "abcde")
    .toString();
  user.tokens = user.tokens.concat([{ access, token }]);

  return user.save().then(() => token);
};

userSchema.statics.findByToken = function (token) {
  const User = this;
  let decoded = null;

  try {
    decoded = jwt.verify(token, "abcde");
  } catch (e) {
    return Promise.reject("Failed to auth");
  }
  return User.findOne({
    _id: decoded._id,
    "tokens.token": token,
    "token.access": "auth",
  });
};

let User = mongoose.model("User", userSchema);
module.exports = { User };
