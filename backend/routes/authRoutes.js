const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { authLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('İsim 2-50 karakter arasında olmalıdır'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Geçerli bir email adresi giriniz'),
  body('password')
    .isLength({ min: 6, max: 100 })
    .withMessage('Şifre en az 6 karakter olmalıdır'),
  body('role')
    .isIn(['admin', 'manager', 'waiter', 'kitchen'])
    .withMessage('Geçersiz rol'),
  body('phone')
    .optional()
    .isMobilePhone('tr-TR')
    .withMessage('Geçerli bir telefon numarası giriniz')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Geçerli bir email adresi giriniz'),
  body('password')
    .notEmpty()
    .withMessage('Şifre gereklidir')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Mevcut şifre gereklidir'),
  body('newPassword')
    .isLength({ min: 6, max: 100 })
    .withMessage('Yeni şifre en az 6 karakter olmalıdır')
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Geçerli bir email adresi giriniz')
];

// Routes
router.post('/register', authLimiter, registerValidation, validate, authController.register);
router.post('/login', authLimiter, loginValidation, validate, authController.login);
router.post('/logout', auth, authController.logout);
router.get('/me', auth, authController.getMe);
router.put('/change-password', auth, changePasswordValidation, validate, authController.changePassword);
router.post('/forgot-password', authLimiter, forgotPasswordValidation, validate, authController.forgotPassword);
router.post('/reset-password/:token', authLimiter, authController.resetPassword);
router.post('/refresh-token', auth, authController.refreshToken);

module.exports = router; 