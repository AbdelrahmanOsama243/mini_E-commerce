const BaseRepo = require('./BaseRepo');
const Product = require('../Models/Products.Model');

class ProductsRepository extends BaseRepo {
  constructor() {
    super(Product);
    this.allowedUpdates = ['name', 'description', 'price', 'category', 'stock', 'image'];
  }

  async getProducts(query = {}) {
    const { search, category, page = 1, limit = 10 } = query;
    
    const filter = {};
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (category) {
      filter.category = category;
    }

    const skip = (page - 1) * limit;
    
    const products = await this.model.find(filter).skip(skip).limit(Number(limit));
    const total = await this.model.countDocuments(filter);
    
    return { products, total };
  }

  async getProductById(id) {
    return await this.findById(id);
  }

  async createProduct(productData) {
    return await this.create(productData);
  }

  async updateProduct(id, updateData) {
    return await this.update(id, updateData);
  }

  async deleteProduct(id) {
    return await this.delete(id);
  }
}

module.exports = new ProductsRepository();
