const Order = require('../models/Order');
const User = require('../models/User');
const Table = require('../models/Table');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');

// @desc    Get dashboard statistics
// @route   GET /api/statistics/dashboard
// @access  Private (Admin/Manager only)
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's stats
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });

    const todayRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: today, $lt: tomorrow },
          status: 'completed',
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Active orders and tables
    const activeOrders = await Order.countDocuments({ status: 'active' });
    const occupiedTables = await Table.countDocuments({ status: 'occupied' });
    const totalTables = await Table.countDocuments();

    // Recent orders
    const recentOrders = await Order.find()
      .populate('table', 'number')
      .populate('waiter', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('orderNumber table waiter totalAmount status createdAt');

    res.json({
      success: true,
      data: {
        todayStats: {
          orders: todayOrders,
          revenue: todayRevenue[0]?.total || 0
        },
        activeStats: {
          orders: activeOrders,
          occupiedTables,
          totalTables,
          tableUtilization: totalTables > 0 ? (occupiedTables / totalTables * 100).toFixed(1) : 0
        },
        recentOrders
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get sales report
// @route   GET /api/statistics/sales-report
// @access  Private (Admin/Manager only)
exports.getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, period = 'daily' } = req.query;

    let matchStage = {
      status: 'completed',
      paymentStatus: 'paid'
    };

    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    let groupStage;
    if (period === 'daily') {
      groupStage = {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        }
      };
    } else if (period === 'monthly') {
      groupStage = {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        }
      };
    } else {
      groupStage = { _id: { year: { $year: '$createdAt' } } };
    }

    const salesData = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          ...groupStage,
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      success: true,
      data: salesData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get top menu items
// @route   GET /api/statistics/top-menu-items
// @access  Private (Admin/Manager only)
exports.getTopMenuItems = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topItems = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItem',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      },
      {
        $lookup: {
          from: 'menuitems',
          localField: '_id',
          foreignField: '_id',
          as: 'menuItem'
        }
      },
      { $unwind: '$menuItem' },
      {
        $project: {
          name: '$menuItem.name',
          totalQuantity: 1,
          totalRevenue: 1,
          category: '$menuItem.category'
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      success: true,
      data: topItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get waiter performance
// @route   GET /api/statistics/waiter-performance
// @access  Private (Admin/Manager only)
exports.getWaiterPerformance = async (req, res) => {
  try {
    const performance = await Order.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$waiter',
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'waiter'
        }
      },
      { $unwind: '$waiter' },
      {
        $project: {
          name: '$waiter.name',
          email: '$waiter.email',
          totalOrders: 1,
          totalRevenue: 1,
          averageOrderValue: 1
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get table utilization
// @route   GET /api/statistics/table-utilization
// @access  Private (Admin/Manager only)
exports.getTableUtilization = async (req, res) => {
  try {
    const tables = await Table.find().select('number status');
    const totalTables = tables.length;
    const occupiedTables = tables.filter(t => t.status === 'occupied').length;
    const availableTables = tables.filter(t => t.status === 'available').length;
    const reservedTables = tables.filter(t => t.status === 'reserved').length;

    res.json({
      success: true,
      data: {
        total: totalTables,
        occupied: occupiedTables,
        available: availableTables,
        reserved: reservedTables,
        utilization: totalTables > 0 ? (occupiedTables / totalTables * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get category performance
// @route   GET /api/statistics/category-performance
// @access  Private (Admin/Manager only)
exports.getCategoryPerformance = async (req, res) => {
  try {
    const categoryStats = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'menuitems',
          localField: 'items.menuItem',
          foreignField: '_id',
          as: 'menuItem'
        }
      },
      { $unwind: '$menuItem' },
      {
        $lookup: {
          from: 'categories',
          localField: 'menuItem.category',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$category._id',
          name: { $first: '$category.name' },
          color: { $first: '$category.color' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    res.json({
      success: true,
      data: categoryStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};