const rateLimit = require('express-rate-limit');

exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: {
    success: false,
    message: 'Çok fazla giriş denemesi, 15 dakika sonra tekrar deneyin'
  },
  standardHeaders: true,
  legacyHeaders: false
});