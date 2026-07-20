const BaseRepo = require('./BaseRepo');
const Product = require('../Models/Products.Model');

class ProductsRepository extends BaseRepo {
  constructor() {
    super(Product);
    this.allowedUpdates = ['name', 'description', 'price', 'category', 'stock', 'image'];
  }

  async getProducts(query = {}) {
    const { search, category, page = 1, limit = 10 } = query;
    const safeLimit = Math.min(Number(limit) || 10, 100);
    
    const filter = {};
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (category) {
      filter.category = category;
    }

    return await this.findAll(filter, { page: Number(page) || 1, limit: safeLimit });
  }
}

module.exports = new ProductsRepository();
