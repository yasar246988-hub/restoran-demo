const express = require('express');
const { body } = require('express-validator');
const categoryController = require('../controllers/categoryController');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');

const router = express.Router();

// Validation rules
const categoryValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Kategori adı 2-50 karakter arasında olmalıdır'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Açıklama en fazla 255 karakter olabilir'),
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Geçerli bir hex renk kodu giriniz'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sıra numarası pozitif bir sayı olmalıdır')
];

const reorderValidation = [
  body('categories')
    .isArray({ min: 1 })
    .withMessage('Kategoriler listesi gereklidir'),
  body('categories.*.id')
    .isMongoId()
    .withMessage('Geçerli kategori ID gereklidir'),
  body('categories.*.order')
    .isInt({ min: 0 })
    .withMessage('Sıra numarası pozitif bir sayı olmalıdır')
];

// Public routes
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

// Protected routes
router.use(auth);
router.post('/', authorize(['admin', 'manager']), categoryValidation, validate, categoryController.createCategory);
router.put('/:id', authorize(['admin', 'manager']), categoryValidation, validate, categoryController.updateCategory);
router.delete('/:id', authorize(['admin', 'manager']), categoryController.deleteCategory);
router.put('/reorder', authorize(['admin', 'manager']), reorderValidation, validate, categoryController.reorderCategories);

module.exports = router; 