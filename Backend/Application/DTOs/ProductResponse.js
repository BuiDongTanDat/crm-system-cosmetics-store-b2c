class ProductResponseDTO {
  constructor(product) {
    this.product_id = product.product_id;
    this.name = product.name;
    this.brand = product.brand;
    this.category = product.category; // chỉ là string
    this.short_description = product.short_description;
    this.description = product.description;
    this.image = product.image;
    this.price_current = product.price_current;
    this.price_original = product.price_original;
    this.discount_percent = product.discount_percent;
    this.rating = product.rating;
    this.reviews_count = product.reviews_count;
    this.inventory_qty = product.inventory_qty;
    this.status = product.status;
    // handle both underscored and camelCase timestamp fields
    this.created_at = product.created_at || product.createdAt;
    this.updated_at = product.updated_at || product.updatedAt;
  }
}

class ProductListResponseDTO {
  constructor(product) {
    this.product_id = product.product_id;
    this.name = product.name;
    this.brand = product.brand;
    this.category = product.category; // chỉ là string
    this.image = product.image;
    this.price_current = product.price_current;
    this.price_original = product.price_original;
    this.discount_percent = product.discount_percent;
    this.rating = product.rating;
    this.status = product.status;
    this.inventory_qty = product.inventory_qty;
  }

  static fromEntities(products) {
    return products.map(product => new ProductListResponseDTO(product));
  }
}

class ProductImportResponseDTO {
  constructor({ importedCount, updatedCount, failedCount, errors = [] }) {
    this.imported = importedCount;
    this.updated = updatedCount;
    this.failed = failedCount;
    this.errors = errors;
  }
}

module.exports = {
  ProductResponseDTO,
  ProductListResponseDTO,
  ProductImportResponseDTO
};
