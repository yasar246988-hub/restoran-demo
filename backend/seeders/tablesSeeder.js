const Table = require('../models/Table');

const tables = [];

// 20 masa oluştur
for (let i = 1; i <= 20; i++) {
  tables.push({
    number: i,
    capacity: Math.floor(Math.random() * 6) + 2, // 2-8 kişilik
    position: {
      x: Math.floor(Math.random() * 10) * 50,
      y: Math.floor(Math.random() * 8) * 50
    },
    status: 'available'
  });
}

const seedTables = async () => {
  try {
    await Table.deleteMany({});
    await Table.insertMany(tables);
    console.log('Tables seeded successfully');
  } catch (error) {
    console.error('Error seeding tables:', error);
  }
};

module.exports = seedTables; 