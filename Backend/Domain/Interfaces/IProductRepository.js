class IProductRepository {
  async findById() { throw new Error('Not implemented'); }
  async findAll() { throw new Error('Not implemented'); }
  async save() { throw new Error('Not implemented'); }
  async delete() { throw new Error('Not implemented'); }
  async findByName() { throw new Error('Not implemented'); }
  async findByCategory() { throw new Error('Not implemented'); }
  async updateInventory() { throw new Error('Not implemented'); }
  async findByPriceRange() { throw new Error('Not implemented'); }
}

module.exports = IProductRepository;