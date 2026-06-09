const express = require('express');
const router = express.Router();

// Mock waiter calls data
let waiterCalls = [];

// GET /api/waiter-calls - Get all waiter calls
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      calls: waiterCalls
    });
  } catch (error) {
    console.error('Get waiter calls error:', error);
    res.status(500).json({
      success: false,
      message: 'Garson çağrıları alınırken hata oluştu',
      error: error.message
    });
  }
});

// POST /api/waiter-calls - Create new waiter call
router.post('/', (req, res) => {
  try {
    const { table_id, request_type, payment_method, message } = req.body;
    
    const newCall = {
      id: 'CALL' + Date.now(),
      table_id,
      request_type,
      payment_method,
      message,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    };
    
    waiterCalls.unshift(newCall);
    
    // Emit socket event if available
    if (global.io) {
      global.io.to('restaurant').emit('waiter_call', newCall);
    }
    
    res.status(201).json({
      success: true,
      message: 'Garson çağrısı başarıyla gönderildi',
      call: newCall
    });
  } catch (error) {
    console.error('Create waiter call error:', error);
    res.status(500).json({
      success: false,
      message: 'Garson çağrısı oluşturulurken hata oluştu',
      error: error.message
    });
  }
});

// PUT /api/waiter-calls/:id - Update waiter call status
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const callIndex = waiterCalls.findIndex(call => call.id === id);
    
    if (callIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Garson çağrısı bulunamadı'
      });
    }
    
    waiterCalls[callIndex].status = status;
    waiterCalls[callIndex].updated_at = new Date();
    
    // Emit socket event if available
    if (global.io) {
      global.io.to('restaurant').emit('waiter_call_updated', waiterCalls[callIndex]);
    }
    
    res.json({
      success: true,
      message: 'Garson çağrısı durumu güncellendi',
      call: waiterCalls[callIndex]
    });
  } catch (error) {
    console.error('Update waiter call error:', error);
    res.status(500).json({
      success: false,
      message: 'Garson çağrısı güncellenirken hata oluştu',
      error: error.message
    });
  }
});

// DELETE /api/waiter-calls/:id - Delete waiter call
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const callIndex = waiterCalls.findIndex(call => call.id === id);
    
    if (callIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Garson çağrısı bulunamadı'
      });
    }
    
    waiterCalls.splice(callIndex, 1);
    
    // Emit socket event if available
    if (global.io) {
      global.io.to('restaurant').emit('waiter_call_deleted', { id });
    }
    
    res.json({
      success: true,
      message: 'Garson çağrısı silindi'
    });
  } catch (error) {
    console.error('Delete waiter call error:', error);
    res.status(500).json({
      success: false,
      message: 'Garson çağrısı silinirken hata oluştu',
      error: error.message
    });
  }
});

module.exports = router;
