const jwt = require("jsonwebtoken");
const expressJWT = require("express-jwt");
const AWS = require("aws-sdk");
const bcrypt = require("bcrypt");

const { registerEmailParams, resetEmailParams } = require("../helpers/email");
const User = require("../models/User");

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const ses = new AWS.SES({ apiVersion: "2010-12-01" });

//By default, the decoded token is attached to req.user
exports.requireSignin = expressJWT({ secret: process.env.JWT_SECRET });

exports.userMiddleware = async (req, res, next) => {
  try {
    const _id = req.user._id;
    const user = await User.findOne({ _id });
    if (!user)
      res.status(422).json({
        message: "User is not found!"
      });
    //  pass user's info to profile
    req.profile = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Access Denied!" });
  }
};

exports.adminMiddleware = async (req, res, next) => {
  try {
    const _id = req.user._id;
    const user = await User.findOne({ _id });
    if (!user) {
      res.status(422).json({
        message: "User is not found!"
      });
    } else if (user.role !== "admin" && user.role !== "root") {
      res.status(422).json({
        message: "Admin resource! Access Denied"
      });
    } else {
      req.profile = user;
      next();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Access Denied!" });
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, categories } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      return res
        .status(422)
        .json({ error: `User with ${email} already exists` });
    } else {
      const token = jwt.sign(
        { name, email, password, categories },
        process.env.JWT_ACCOUNT_ACTIVATION,
        {
          expiresIn: "45m"
        }
      );
      //   set up email and send out using AWS SES
      const params = registerEmailParams(email, token);
      const sendEmailOnRegister = await ses.sendEmail(params).promise();
      if (sendEmailOnRegister) {
        res.status(200).json({
          message: `An email has been sent to ${email}. Follow the instructions to complete your registration!`
        });
      } else {
        res.status(422).json({
          error: `We could not verify your email. Please try again!`
        });
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Email address is not verified" });
  }
};

exports.registerActivate = async (req, res) => {
  const { token } = req.body;
  try {
    const verified = jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION);
    if (!verified)
      res.status(422).json({
        error: `We could not verify your account. Please try again!`
      });

    const { name, email, password, categories } = jwt.decode(token);
    const user = await User.findOne({ email });
    if (user)
      return res.status(401).json({
        error: "Email already exists"
      });
    const newUser = new User({
      username: name,
      name,
      email,
      password,
      categories
    });

    newUser.save();
    res.status(200).json({
      message: "Registration success! Please log in."
    });
  } catch (error) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Server error! Please sign up again later." });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(422).json({
        error: "User with that email does not exist. Please register!"
      });
    } else {
      if (!user.authenticate(password)) {
        return res.status(404).json({
          error: "Email and password do not match"
        });
      }
      // generate token and send to client
      const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "7d"
      });
      const { _id, name, email, role, username } = user;

      return res.status(200).json({
        token,
        user: { _id, name, email, role, username }
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error! Please try again later." });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(422).json({
        error: "The email does not exist"
      });
    }
    const { name } = user;
    const token = jwt.sign({ name, email }, process.env.JWT_RESET_PASSWORD, {
      expiresIn: "45m"
    });
    //   set up email and send out using AWS SES
    const params = resetEmailParams(email, token);
    const sendEmailOnRegister = await ses.sendEmail(params).promise();
    if (sendEmailOnRegister) {
      res.status(200).json({
        message: `An email has been sent to ${email}. Follow the instructions to reset your email!`
      });
    } else {
      res.status(422).json({
        error: `We could not verify your email. Please try again!`
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error! Please try again later." });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const verified = jwt.verify(token, process.env.JWT_RESET_PASSWORD);
    if (!verified)
      res.status(422).json({
        error: `We could not verify your account. Please try again!`
      });
    const { email } = jwt.decode(token);
    const hashed_password = bcrypt.hashSync(newPassword, 10);
    await User.findOneAndUpdate(
      { email },
      {
        hashed_password
      }
    );
    res.status(200).json({
      message: "Password updated successfully!"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error! Please try again later." });
  }
};
