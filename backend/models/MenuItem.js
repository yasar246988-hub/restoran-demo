const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  image: {
    type: String,
    default: null
  },
  ingredients: [String],
  allergens: [String],
  isAvailable: {
    type: Boolean,
    default: true
  },
  preparationTime: {
    type: Number,
    default: 15,
    min: 1
  },
  extras: [{
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    isRequired: {
      type: Boolean,
      default: false
    }
  }],
  tags: [String],
  popularity: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

menuItemSchema.index({ category: 1 });
menuItemSchema.index({ isAvailable: 1 });
menuItemSchema.index({ popularity: -1 });

module.exports = mongoose.model('MenuItem', menuItemSchema);