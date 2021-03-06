const { check } = require('express-validator');
//https://express-validator.github.io/docs/validation-chain-api.html

exports.userRegisterValidator = [
  check('name')
    .not()
    .isEmpty()
    .withMessage('Name is required'),
  check('email')
    .isEmail()
    .withMessage('Must be a valid email address'),
  check('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  check('categories')
    .not()
    .isEmpty()
    .withMessage('Please select at least one category')
];

exports.userUpdateValidator = [
  check('username')
    .not()
    .isEmpty()
    .withMessage('Username is required'),
  check('name')
    .not()
    .isEmpty()
    .withMessage('Name is required')
];

exports.userLoginValidator = [
  check('email')
    .isEmail()
    .withMessage('Must be a valid email address'),
  check('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

exports.forgotPasswordValidator = [
  check('email')
    .not()
    .isEmpty()
    .isEmail()
    .withMessage('Must be a valid email address')
];

exports.resetPasswordValidator = [
  check('newPassword')
    .not()
    .isEmpty()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];
