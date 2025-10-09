class CreateProductRequestDTO {
  constructor({ name, brand, category_id, short_description, description, image, price_current, price_original, discount_percent, inventory_qty, status }) {
    this.name = name;
    this.brand = brand;
    this.category_id = category_id;
    this.short_description = short_description;
    this.description = description;
    this.image = image;
    this.price_current = price_current;
    this.price_original = price_original;
    this.discount_percent = discount_percent;
    this.inventory_qty = inventory_qty;
    this.status = status || 'AVAILABLE';
  }
}

class UpdateProductRequestDTO {
  constructor({ name, brand, category_id, short_description, description, image, price_current, price_original, discount_percent, inventory_qty, status }) {
    this.name = name;
    this.brand = brand;
    this.category_id = category_id;
    this.short_description = short_description;
    this.description = description;
    this.image = image;
    this.price_current = price_current;
    this.price_original = price_original;
    this.discount_percent = discount_percent;
    this.inventory_qty = inventory_qty;
    this.status = status;
  }
}

class ImportCSVRequestDTO {
  constructor({ filePath, source }) {
    this.filePath = filePath;   // đường dẫn file CSV
    this.source = source || 'manual'; // có thể là 'manual', 'sync_website', ...
  }
}

module.exports = {
  CreateProductRequestDTO,
  UpdateProductRequestDTO,
  ImportCSVRequestDTO,
};