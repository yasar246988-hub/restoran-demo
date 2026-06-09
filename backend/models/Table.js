const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  number: {
    type: Number,
    required: true,
    unique: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    max: 20
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved', 'maintenance'],
    default: 'available'
  },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 }
  },
  qrCode: {
    type: String
  },
  currentOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  waiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reservation: {
    customerName: String,
    customerPhone: String,
    time: Date,
    notes: String,
    isActive: {
      type: Boolean,
      default: true
    }
  },
  callWaiter: {
    isActive: {
      type: Boolean,
      default: false
    },
    timestamp: Date,
    reason: String
  }
}, {
  timestamps: true
});

tableSchema.index({ number: 1 });
tableSchema.index({ status: 1 });

module.exports = mongoose.model('Table', tableSchema);