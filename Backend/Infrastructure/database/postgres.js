const { Sequelize } = require('sequelize');
require('dotenv').config();

class DataManager {
  constructor() {
    if (!DataManager.instance) {
      this.sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        String(process.env.DB_PASSWORD),
        {
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
          dialect: 'postgres',
          logging: process.env.DB_LOGGING === 'true',
        }
      );
      DataManager.instance = this;
    }
    return DataManager.instance;
  }

  async connect() {
    try {
      await this.sequelize.authenticate();
      console.log('Database connected!');
    } catch (err) {
      console.error('Unable to connect to DB:', err);
      throw err;
    }
  }

  async sync(options = { alter: true }) {
    try {
      // --- IMPORT MODEL TRƯỚC KHI SYNC ---
      require('../../Domain/Entities/Product');
    //   require('../../Domain/Entities/User');
      require('../../Domain/Entities/Customer');
      await this.sequelize.sync(options);
      console.log('Database synced!');
    } catch (err) {
      console.error('Sync error:', err);
      throw err;
    }
  }

  // ---------------- KẾT HỢP CONNECT + SYNC ----------------
  async connectAndSync(options = { alter: true }) {
    await this.connect();
    await this.sync(options);
  }

  getSequelize() {
    return this.sequelize;
  }
}

const instance = new DataManager();
Object.freeze(instance);

module.exports = instance;
