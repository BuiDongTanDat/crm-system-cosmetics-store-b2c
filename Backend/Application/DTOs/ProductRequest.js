class CreateProductRequestDTO {
  constructor({
    name,
    brand,
    category, // string
    short_description,
    description,
    image,
    price_current,
    price_original,
    discount_percent,
    inventory_qty,
    rating,
    reviews_count,
    monthly_sales,
    sell_progress,
    status,
    status_updated_at
  }) {
    this.name = name;
    this.brand = brand;
    this.category = category;
    this.short_description = short_description;
    this.description = description;
    this.image = image;
    this.price_current = price_current;
    this.price_original = price_original;
    this.discount_percent = discount_percent;
    this.inventory_qty = inventory_qty || 0;
    this.rating = rating || 0;
    this.reviews_count = reviews_count || 0;
    this.monthly_sales = monthly_sales || "";
    this.sell_progress = sell_progress || "";
    this.status = status || "AVAILABLE";
    this.status_updated_at = status_updated_at;
  }
}

class UpdateProductRequestDTO {
  constructor({
    product_id,
    name,
    brand,
    category, // string
    short_description,
    description,
    image,
    price_current,
    price_original,
    discount_percent,
    inventory_qty,
    rating,
    reviews_count,
    monthly_sales,
    sell_progress,
    status,
    status_updated_at
  }) {
    this.product_id = product_id;
    this.name = name;
    this.brand = brand;
    this.category = category;
    this.short_description = short_description;
    this.description = description;
    this.image = image;
    this.price_current = price_current;
    this.price_original = price_original;
    this.discount_percent = discount_percent;
    this.inventory_qty = inventory_qty;
    this.rating = rating;
    this.reviews_count = reviews_count;
    this.monthly_sales = monthly_sales;
    this.sell_progress = sell_progress;
    this.status = status;
    this.status_updated_at = status_updated_at;
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