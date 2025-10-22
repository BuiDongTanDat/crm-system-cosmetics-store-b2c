/**
 * Registry cho toàn bộ event type có thể kích hoạt flow.
 * Mỗi domain có thể đăng ký thêm event type của riêng nó.
 */
class TriggerRegistry {
  constructor() {
    this.events = new Map();
  }
// có thể mở rộng thông qua người dùng 
//   async loadFromDatabase(triggerModel) {
//     const records = await triggerModel.findAll(); // SELECT * FROM trigger_types
//     for (const row of records) {
//       this.events.set(row.key, { domain: row.domain, description: row.description });
//     }
//   }
  /**
   * Đăng ký event type (VD: 'lead.created', 'order.paid')
   * @param {string} key event_name
   * @param {object} meta metadata { domain, description }
   */
  register(key, meta = {}) {
    this.events.set(key, meta);
  }

  getAll() {
    return Array.from(this.events.entries()).map(([key, meta]) => ({ key, ...meta }));
  }

  exists(key) {
    return this.events.has(key);
  }
}

// Singleton
module.exports = new TriggerRegistry();
