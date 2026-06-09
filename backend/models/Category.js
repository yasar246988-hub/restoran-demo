const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    default: null
  },
  color: {
    type: String,
    default: '#3498db'
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  icon: {
    type: String,
    default: 'fas fa-utensils'
  }
}, {
  timestamps: true
});

categorySchema.index({ order: 1 });

module.exports = mongoose.model('Category', categorySchema);