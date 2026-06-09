const config = require('../config');

module.exports = {
  development: {
    url: config.database.url,
    options: config.database.options
  },
  production: {
    url: config.database.url,
    options: config.database.options
  }
}; 