const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const bcrypt = require('bcryptjs');

const initialSetup = async () => {
  try {
    console.log('Running initial setup migration...');

    // Create admin user if not exists
    const adminExists = await User.findOne({ email: 'admin@restaurant.com' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await User.create({
        name: 'System Admin',
        email: 'admin@restaurant.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true
      });
      console.log('Admin user created');
    }

    // Create default categories
    const categories = [
      { name: 'Başlangıçlar', description: 'Açılış yemekleri', color: '#e74c3c', order: 1, icon: 'fas fa-leaf' },
      { name: 'Ana Yemekler', description: 'Ana öğün yemekleri', color: '#3498db', order: 2, icon: 'fas fa-utensils' },
      { name: 'Tatlılar', description: 'Tatlı çeşitleri', color: '#f39c12', order: 3, icon: 'fas fa-ice-cream' },
      { name: 'İçecekler', description: 'Soğuk ve sıcak içecekler', color: '#27ae60', order: 4, icon: 'fas fa-glass-cheers' }
    ];

    for (const categoryData of categories) {
      const exists = await Category.findOne({ name: categoryData.name });
      if (!exists) {
        await Category.create(categoryData);
        console.log(`Category created: ${categoryData.name}`);
      }
    }

    console.log('Initial setup completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
};

module.exports = { up: initialSetup }; 