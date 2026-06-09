const express = require('express');
const router = express.Router();

// Mock waiter calls data
let waiterCalls = [];

// GET /api/waiter-calls - Get all waiter calls
router.get('/', (req, res) => {
  try {
    // Sadece handled:false olan çağrıları dön
    const activeCalls = waiterCalls.filter(call => !call.handled);
    res.json({
      success: true,
      calls: activeCalls
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
    const { tableId, message } = req.body;
    
    const newCall = {
      id: 'CALL' + Date.now(),
      tableId,
      message: message || 'Garson çağrısı',
      timestamp: new Date(),
      handled: false
    };
    
    waiterCalls.unshift(newCall);
    
    // Emit socket event if available
    if (global.io) {
      global.io.to('restaurant').emit('waiter_call', newCall);
    }
    
    res.status(201).json({
      success: true,
      call: newCall,
      message: 'Garson çağrısı başarıyla oluşturuldu'
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

// PUT /api/waiter-calls/:id/handled - Mark waiter call as handled
router.put('/:id/handled', (req, res) => {
  try {
    const { id } = req.params;
    
    const callIndex = waiterCalls.findIndex(call => call.id === id);
    if (callIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Garson çağrısı bulunamadı'
      });
    }
    
    waiterCalls[callIndex] = {
      ...waiterCalls[callIndex],
      handled: true,
      handledAt: new Date()
    };
    
    res.json({
      success: true,
      call: waiterCalls[callIndex],
      message: 'Garson çağrısı başarıyla işaretlendi'
    });
  } catch (error) {
    console.error('Mark waiter call handled error:', error);
    res.status(500).json({
      success: false,
      message: 'Garson çağrısı işaretlenirken hata oluştu',
      error: error.message
    });
  }
});

module.exports = router;
