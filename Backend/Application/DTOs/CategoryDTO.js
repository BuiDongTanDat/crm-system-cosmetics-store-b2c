class CategoryDTO {
  constructor(category) {
    this.category_id = category.category_id;
    this.name = category.name;
    this.description = category.description;
    this.status = category.status;
  }
}

module.exports = CategoryDTO;
