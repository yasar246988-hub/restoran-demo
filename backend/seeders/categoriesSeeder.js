const Category = require('../models/Category');

const categories = [
  {
    name: 'Çorbalar',
    description: 'Sıcak çorba çeşitleri',
    color: '#e67e22',
    order: 1,
    icon: 'fas fa-bowl-hot'
  },
  {
    name: 'Salatalar',
    description: 'Taze salata çeşitleri',
    color: '#27ae60',
    order: 2,
    icon: 'fas fa-seedling'
  },
  {
    name: 'Pizza',
    description: 'İtalyan pizza çeşitleri',
    color: '#e74c3c',
    order: 3,
    icon: 'fas fa-pizza-slice'
  },
  {
    name: 'Makarnalar',
    description: 'Makarna ve soslar',
    color: '#f39c12',
    order: 4,
    icon: 'fas fa-utensils'
  },
  {
    name: 'Et Yemekleri',
    description: 'Et tabanlı ana yemekler',
    color: '#8e44ad',
    order: 5,
    icon: 'fas fa-drumstick-bite'
  },
  {
    name: 'Deniz Ürünleri',
    description: 'Balık ve deniz ürünleri',
    color: '#3498db',
    order: 6,
    icon: 'fas fa-fish'
  },
  {
    name: 'Kahveler',
    description: 'Sıcak kahve çeşitleri',
    color: '#795548',
    order: 7,
    icon: 'fas fa-coffee'
  },
  {
    name: 'Soğuk İçecekler',
    description: 'Ferahlatıcı içecekler',
    color: '#00bcd4',
    order: 8,
    icon: 'fas fa-glass-water'
  }
];

const seedCategories = async () => {
  try {
    await Category.deleteMany({});
    await Category.insertMany(categories);
    console.log('Categories seeded successfully');
  } catch (error) {
    console.error('Error seeding categories:', error);
  }
};

module.exports = seedCategories; 