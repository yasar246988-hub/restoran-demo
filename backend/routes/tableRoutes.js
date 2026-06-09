const express = require('express');
const router = express.Router();

// Mock tables data
let tables = [
  {
    id: 1,
    number: 1,
    capacity: 4,
    status: 'available',
    currentOrder: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 2,
    number: 2,
    capacity: 2,
    status: 'occupied',
    currentOrder: 'ORD001',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 3,
    number: 3,
    capacity: 6,
    status: 'available',
    currentOrder: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 4,
    number: 4,
    capacity: 4,
    status: 'reserved',
    currentOrder: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 5,
    number: 5,
    capacity: 2,
    status: 'occupied',
    currentOrder: 'ORD002',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// GET /api/tables - Get all tables
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      tables: tables
    });
  } catch (error) {
    console.error('Get tables error:', error);
    res.status(500).json({
      success: false,
      message: 'Masalar alınırken hata oluştu',
      error: error.message
    });
  }
});

// PUT /api/tables/:id - Update table
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const tableIndex = tables.findIndex(table => table.id == id);
    if (tableIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Masa bulunamadı'
      });
    }
    
    tables[tableIndex] = {
      ...tables[tableIndex],
      ...updateData,
      updatedAt: new Date()
    };
    
    res.json({
      success: true,
      table: tables[tableIndex],
      message: 'Masa başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Update table error:', error);
    res.status(500).json({
      success: false,
      message: 'Masa güncellenirken hata oluştu',
      error: error.message
    });
  }
});

module.exports = router;
