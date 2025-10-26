// backend/src/Infrastructure/database/postgres.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

class DataManager {
  constructor() {
    if (!DataManager.instance) {
      const {
        DB_NAME,
        DB_USER,
        DB_PASSWORD,
        DB_HOST = 'localhost',
        DB_PORT = '5432',
        DB_LOGGING = 'false',
        DB_SSL = 'false',
        NODE_ENV = 'development',   // Thêm
      } = process.env;

      this.env = NODE_ENV;
      this.sequelize = new Sequelize(DB_NAME, DB_USER, String(DB_PASSWORD), {
        host: DB_HOST,
        port: parseInt(DB_PORT, 10),
        dialect: 'postgres',
        logging: DB_LOGGING === 'true',
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
        dialectOptions:
          DB_SSL === 'true'
            ? {
              ssl: { require: true, rejectUnauthorized: false },
            }
            : {},
      });

      DataManager.instance = this;
    }
    return DataManager.instance;
  }

  async connect() {
    try {
      await this.sequelize.authenticate();
      console.log('✅ Database connected');
    } catch (error) {
      console.error('❌ Unable to connect to database:', error);
      throw error;
    }
  }

  loadModels() {
    // Import tất cả model của bạn
    require('../../Domain/Entities/User');
    require('../../Domain/Entities/Role');
    require('../../Domain/Entities/Product');
    require('../../Domain/Entities/Customer');
    require('../../Domain/Entities/Campaign');
    require('../../Domain/Entities/Category');
    require('../../Domain/Entities/ProductReviews');
    require('../../Domain/Entities/ProductSpecifications');
    require('../../Domain/Entities/Lead');
    require('../../Domain/Entities/LeadStatusHistory');
    require('../../Domain/Entities/LeadInteraction');
    require('../../Domain/Entities/AlModelResult');
    require('../../Domain/Entities/AutomationFlow');
    require('../../Domain/Entities/AutomationTrigger');
    require('../../Domain/Entities/AutomationAction');
  }

  async sync(options = { alter: true }) {
    try {
      this.loadModels();
      await this.sequelize.sync(options);
      console.log('🧩 Database synced');
    } catch (error) {
      console.error('❌ Sync error:', error);
      throw error;
    }
  }

  async connectAndSync() {
    await this.connect();
    // sau này chỉnh lại development cho đúng tại vì đang test mail
    if (this.env === 'production') {
      console.log('⚙️ Running in DEVELOPMENT mode (code-first)');
      await this.sync({ alter: true });
      if (process.env.SEED_ON_START === 'true') {
        try {
          const { seedDatabase } = require('./seed');
          await seedDatabase();
        } catch (err) {
          console.error('Seed error:', err);
        }
      }
    } else {
      console.log('Running in PRODUCTION mode (database-first)');
      this.loadModels(); // chỉ load model để dùng trong app

    }
  }

  getSequelize() {
    return this.sequelize;
  }
}

const instance = new DataManager();
Object.freeze(instance);
module.exports = instance;
