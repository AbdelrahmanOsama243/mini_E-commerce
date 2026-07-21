const BaseRepo = require('./BaseRepo');
const Product = require('../Models/Products.Model');

class ProductsRepository extends BaseRepo {
  constructor() {
    super(Product);
    this.allowedUpdates = ['name', 'description', 'price', 'category', 'stock', 'image', 'images'];
  }

  async getProducts(query = {}) {
    const { search, category, minPrice, maxPrice, page = 1, limit = 10 } = query;
    const safeLimit = Math.min(Number(limit) || 10, 100);
    
    const filter = {};
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (category) {
      filter.category = category;
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined && !isNaN(Number(minPrice))) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined && !isNaN(Number(maxPrice))) filter.price.$lte = Number(maxPrice);
    }

    return await this.findAll(filter, { page: Number(page) || 1, limit: safeLimit });
  }

  async checkStock(productId) {
    const product = await this.findById(productId);
    if (!product) return null;
    return {
      productId: product._id,
      stock: product.stock,
      inStock: product.stock > 0
    };
  }

  async updateStock(productId, delta, options = {}) {
    return await this.model.findByIdAndUpdate(
      productId,
      { $inc: { stock: delta } },
      { new: true, runValidators: true, ...options }
    );
  }
}

module.exports = new ProductsRepository();
