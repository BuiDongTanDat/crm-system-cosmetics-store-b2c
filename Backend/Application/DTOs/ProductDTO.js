class CreateProductRequestDTO {
  constructor({ name, description, category, price, promo, inventoryQty, images }) {
    this.name = name;
    this.description = description;
    this.category = category;
    this.price = price;
    this.promo = promo;
    this.inventoryQty = inventoryQty;
    this.images = images;
  }
}

class UpdateProductRequestDTO {
  constructor({ name, description, category, price, promo, inventoryQty }) {
    this.name = name;
    this.description = description;
    this.category = category;
    this.price = price;
    this.promo = promo;
    this.inventoryQty = inventoryQty;
  }
}

class ProductResponseDTO {
  constructor(product) {
    this.id = product.product_id;
    this.name = product.name;
    this.description = product.description;
    this.category = product.category;
    this.price = product.price;
    this.promo = product.promo;
    this.inventoryQty = product.inventory_qty;
    this.images = product.images;
  }
}

module.exports = { CreateProductRequestDTO, UpdateProductRequestDTO, ProductResponseDTO };
