require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'restaurant_secret_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  },
  
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
  },
  
  printer: {
    name: process.env.PRINTER_NAME || 'Restaurant_Printer',
    host: process.env.PRINTER_HOST,
    port: process.env.PRINTER_PORT || 9100
  },
  
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    credentials: true
  },
  
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  }
}; 