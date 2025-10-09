class ICustomerService {
  async getAll() {throw new Error('Method not implemented.');}
  async getById(id) {throw new Error('Method not implemented.');}
  async create(data) {throw new Error('Method not implemented.');}
  async update(id, data) {throw new Error('Method not implemented.');}
  async delete(id) {throw new Error('Method not implemented.');}
  async getInteractions(id) {throw new Error('Method not implemented.');}
  async getOrders(id) {throw new Error('Method not implemented.');}
  async getRecommendations(id) {throw new Error('Method not implemented.');}

  // AI-related methods
  async analyzeCLV(id) {throw new Error('Method not implemented.');}
  async analyzeChurn(id) {throw new Error('Method not implemented.');}
  async analyzeBehavior(id) {throw new Error('Method not implemented.');}
  async autoSegmentAll() {throw new Error('Method not implemented.');}

  async importCustomers(filePath) {throw new Error('Method not implemented.');} 
}

module.exports = ICustomerService;
