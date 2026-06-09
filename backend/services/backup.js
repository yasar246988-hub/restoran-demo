const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');
const { logger } = require('../middlewares/logger');

class BackupService {
  constructor() {
    this.backupDir = path.join(__dirname, '../backups');
    this.ensureBackupDir();
  }

  async ensureBackupDir() {
    try {
      await fs.access(this.backupDir);
    } catch (error) {
      await fs.mkdir(this.backupDir, { recursive: true });
    }
  }

  async createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(this.backupDir, `backup-${timestamp}.json`);

      const collections = ['users', 'tables', 'orders', 'menuitems', 'categories'];
      const backup = {};

      for (const collectionName of collections) {
        const collection = mongoose.connection.collection(collectionName);
        backup[collectionName] = await collection.find({}).toArray();
      }

      await fs.writeFile(backupFile, JSON.stringify(backup, null, 2));
      logger.info(`Backup created: ${backupFile}`);

      // Clean old backups (keep only last 10)
      await this.cleanOldBackups();

      return backupFile;
    } catch (error) {
      logger.error('Backup creation failed:', error);
      throw error;
    }
  }

  async cleanOldBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
        .sort()
        .reverse();

      // Keep only the latest 10 backups
      const filesToDelete = backupFiles.slice(10);

      for (const file of filesToDelete) {
        await fs.unlink(path.join(this.backupDir, file));
        logger.info(`Deleted old backup: ${file}`);
      }
    } catch (error) {
      logger.error('Error cleaning old backups:', error);
    }
  }

  async restoreBackup(backupFile) {
    try {
      const backupData = JSON.parse(await fs.readFile(backupFile, 'utf8'));

      for (const [collectionName, data] of Object.entries(backupData)) {
        if (data.length > 0) {
          const collection = mongoose.connection.collection(collectionName);
          await collection.deleteMany({});
          await collection.insertMany(data);
          logger.info(`Restored ${data.length} documents to ${collectionName}`);
        }
      }

      logger.info(`Backup restored from: ${backupFile}`);
    } catch (error) {
      logger.error('Backup restoration failed:', error);
      throw error;
    }
  }

  async listBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      return files
        .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
        .sort()
        .reverse();
    } catch (error) {
      logger.error('Error listing backups:', error);
      return [];
    }
  }
}

module.exports = new BackupService(); 