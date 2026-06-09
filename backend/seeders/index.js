const mongoose = require('mongoose');
const config = require('../config');
const seedCategories = require('./categoriesSeeder');
const seedMenuItems = require('./menuItemsSeeder');
const seedTables = require('./tablesSeeder');

const runSeeders = async () => {
  try {
    await mongoose.connect(config.database.url, config.database.options);
    console.log('Connected to MongoDB');

    console.log('Starting seeders...');
    
    await seedCategories();
    await seedMenuItems();
    await seedTables();
    
    console.log('All seeders completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeder error:', error);
    process.exit(1);
  }
};

runSeeders(); 