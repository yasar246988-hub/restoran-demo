const MenuItem = require('../models/MenuItem');
const Category = require('../models/Category');

const menuItems = [
  // Çorbalar
  {
    categoryName: 'Çorbalar',
    items: [
      {
        name: 'Mercimek Çorbası',
        description: 'Geleneksel kırmızı mercimek çorbası',
        price: 25.00,
        preparationTime: 10,
        ingredients: ['kırmızı mercimek', 'soğan', 'havuç', 'baharat'],
        tags: ['vegetarian', 'vegan']
      },
      {
        name: 'Domates Çorbası',
        description: 'Taze domates ile hazırlanan çorba',
        price: 28.00,
        preparationTime: 12,
        ingredients: ['domates', 'krema', 'fesleğen'],
        tags: ['vegetarian']
      }
    ]
  },
  // Salatalar
  {
    categoryName: 'Salatalar',
    items: [
      {
        name: 'Sezar Salatası',
        description: 'Klasik sezar salatası, tavuk parçaları ile',
        price: 45.00,
        preparationTime: 8,
        ingredients: ['marul', 'tavuk', 'parmesan', 'kruton', 'sezar sos'],
        extras: [
          { name: 'Ekstra Tavuk', price: 10, isRequired: false },
          { name: 'Ekstra Parmesan', price: 8, isRequired: false }
        ]
      },
      {
        name: 'Mevsim Salatası',
        description: 'Taze mevsim yeşillikleri',
        price: 35.00,
        preparationTime: 5,
        ingredients: ['karışık yeşillik', 'domates', 'salatalık', 'mor lahana'],
        tags: ['vegetarian', 'vegan', 'gluten-free']
      }
    ]
  },
  // Pizza
  {
    categoryName: 'Pizza',
    items: [
      {
        name: 'Margherita Pizza',
        description: 'Klasik İtalyan pizzası',
        price: 65.00,
        preparationTime: 20,
        ingredients: ['domates sosu', 'mozzarella', 'fesleğen'],
        tags: ['vegetarian'],
        extras: [
          { name: 'Ekstra Peynir', price: 12, isRequired: false },
          { name: 'Zeytin', price: 8, isRequired: false }
        ]
      },
      {
        name: 'Pepperoni Pizza',
        description: 'Pepperoni ile hazırlanan pizza',
        price: 75.00,
        preparationTime: 22,
        ingredients: ['domates sosu', 'mozzarella', 'pepperoni']
      }
    ]
  }
];

const seedMenuItems = async () => {
  try {
    await MenuItem.deleteMany({});
    
    for (const categoryData of menuItems) {
      const category = await Category.findOne({ name: categoryData.categoryName });
      if (!category) {
        console.log(`Category not found: ${categoryData.categoryName}`);
        continue;
      }

      for (const itemData of categoryData.items) {
        await MenuItem.create({
          ...itemData,
          category: category._id
        });
      }
    }
    
    console.log('Menu items seeded successfully');
  } catch (error) {
    console.error('Error seeding menu items:', error);
  }
};

module.exports = seedMenuItems; 