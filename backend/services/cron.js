const cron = require('node-cron');
const Order = require('../models/Order');
const emailService = require('./email');
const { logger } = require('../middlewares/logger');
const mongoose = require('mongoose');

class CronService {
  constructor() {
    this.startCronJobs();
  }

  startCronJobs() {
    // Günlük rapor gönderimi (Her gün saat 23:00)
    cron.schedule('0 23 * * *', async () => {
      try {
        await this.sendDailyReport();
        logger.info('Daily report sent successfully');
      } catch (error) {
        logger.error('Error sending daily report:', error);
      }
    });

    // Eski completed siparişleri temizle (Her hafta)
    cron.schedule('0 2 * * 0', async () => {
      try {
        await this.cleanOldOrders();
        logger.info('Old orders cleaned successfully');
      } catch (error) {
        logger.error('Error cleaning old orders:', error);
      }
    });

    // Sistem durumu kontrolü (Her saat)
    cron.schedule('0 * * * *', async () => {
      try {
        await this.systemHealthCheck();
      } catch (error) {
        logger.error('System health check failed:', error);
      }
    });

    logger.info('Cron jobs started successfully');
  }

  async sendDailyReport() {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const orders = await Order.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      status: 'completed'
    }).populate(['items.menuItem', 'table']);

    const report = {
      date: startOfDay.toISOString().split('T')[0],
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
      averageOrderValue: orders.length > 0 ? 
        (orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length).toFixed(2) : 0
    };

    await emailService.sendDailyReport(report);
  }

  async cleanOldOrders() {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const result = await Order.deleteMany({
      status: 'completed',
      completedAt: { $lt: oneMonthAgo }
    });

    logger.info(`Cleaned ${result.deletedCount} old orders`);
  }

  async systemHealthCheck() {
    // Database connection check
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Memory usage
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024)
    };

    logger.info('System health check', { dbStatus, memUsageMB });
  }
}

module.exports = new CronService(); 