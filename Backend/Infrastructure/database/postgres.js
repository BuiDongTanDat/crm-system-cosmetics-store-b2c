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
      } = process.env;

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
              ssl: {
                require: true,
                rejectUnauthorized: false,
              },
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

  /**
   * Load models và thiết lập associations
   */
  loadModels() {
    // ===== Import các model =====
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
      console.log(' Database synced');
    } catch (error) {
      console.error('Sync error:', error);
      throw error;
    }
  }

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
