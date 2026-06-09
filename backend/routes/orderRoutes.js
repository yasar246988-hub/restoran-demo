const express = require('express');
const router = express.Router();

// Mock order data - başlangıçta boş
let orders = [];

// GET /api/orders - Get all orders
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      orders: orders
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Siparişler alınırken hata oluştu',
      error: error.message
    });
  }
});

// POST /api/orders - Create new order
router.post('/', (req, res) => {
  try {
    const { table_id, items, total_amount, payment_method, customer_notes } = req.body;
    
    const newOrder = {
      id: 'ORD' + Date.now(),
      table_id,
      items,
      total_amount,
      payment_method,
      customer_notes,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    };
    
    orders.unshift(newOrder);
    
    // Emit socket event if available
    if (global.io) {
      global.io.to('restaurant').emit('new_order', newOrder);
      global.io.to('kitchen').emit('new_order', newOrder);
    }
    
    res.status(201).json({
      success: true,
      message: 'Sipariş başarıyla alındı',
      order: newOrder,
      id: newOrder.id
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Sipariş oluşturulurken hata oluştu',
      error: error.message
    });
  }
});

// PUT /api/orders/:id - Update order
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const orderIndex = orders.findIndex(order => order.id === id);
    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı'
      });
    }
    
    orders[orderIndex] = {
      ...orders[orderIndex],
      ...updateData,
      updatedAt: new Date()
    };
    
    // Emit socket event if available
    if (global.io) {
      global.io.to('restaurant').emit('order_updated', orders[orderIndex]);
    }
    
    res.json({
      success: true,
      order: orders[orderIndex],
      message: 'Sipariş başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({
      success: false,
      message: 'Sipariş güncellenirken hata oluştu',
      error: error.message
    });
  }
});

// DELETE /api/orders/:id - Delete order
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const orderIndex = orders.findIndex(order => order.id === id);
    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı'
      });
    }
    
    orders.splice(orderIndex, 1);
    
    res.json({
      success: true,
      message: 'Sipariş başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({
      success: false,
      message: 'Sipariş silinirken hata oluştu',
      error: error.message
    });
  }
});

module.exports = router;
