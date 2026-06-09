const express = require('express');
const statisticsController = require('../controllers/statisticsController');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');

const router = express.Router();

// All routes require authentication and manager/admin role
router.use(auth);
router.use(authorize(['admin', 'manager']));

// Routes
router.get('/dashboard', statisticsController.getDashboardStats);
router.get('/sales-report', statisticsController.getSalesReport);
router.get('/top-menu-items', statisticsController.getTopMenuItems);
router.get('/waiter-performance', statisticsController.getWaiterPerformance);
router.get('/table-utilization', statisticsController.getTableUtilization);
router.get('/category-performance', statisticsController.getCategoryPerformance);

module.exports = router; 