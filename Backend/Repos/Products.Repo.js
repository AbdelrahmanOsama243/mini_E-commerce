const BaseRepo = require('./BaseRepo');
const Product = require('../Models/Products.Model');
const redisRepo = require('./Redis.Repo');

class ProductsRepository extends BaseRepo {
  constructor() {
    super(Product);
    this.allowedUpdates = ['name', 'description', 'price', 'category', 'stock', 'image'];
  }

  async _invalidateProductCache(productId) {
    // Invalidate individual product cache
    if (productId) {
      await redisRepo.deleteByPattern(`product:${productId}:*`);
    }
    // Invalidate all product list caches
    await redisRepo.deleteByPattern('products:query:*');
  }

  async getProducts(query = {}) {
    const cacheKey = `products:query:${JSON.stringify(query)}`;
    const cachedProducts = await redisRepo.get(cacheKey);
    if (cachedProducts) {
      return cachedProducts;
    }

    const { search, category, page = 1, limit = 10 } = query;
    const safeLimit = Math.min(Number(limit) || 10, 100);
    
    const filter = {};
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (category) {
      filter.category = { $regex: `^${category}$`, $options: 'i' };
    }

    const products = await this.findAll(filter, { page: Number(page) || 1, limit: safeLimit });
    await redisRepo.set(cacheKey, products, 3600); // Cache for 1 hour
    return products;
  }

  async findById(id, options = {}) {
    const cacheKey = `product:${id}:${JSON.stringify(options)}`;
    const cachedProduct = await redisRepo.get(cacheKey);
    if (cachedProduct) {
      return cachedProduct;
    }

    const product = await super.findById(id, options);
    if (product) {
      await redisRepo.set(cacheKey, product, 3600);
    }
    return product;
  }

  async update(id, data, options = {}) {
    const updatedProduct = await super.update(id, data, options);
    if (updatedProduct) {
      await this._invalidateProductCache(id);
    }
    return updatedProduct;
  }

  async delete(id, options = {}) {
    const deletedProduct = await super.delete(id, options);
    if (deletedProduct) {
      await this._invalidateProductCache(id);
    }
    return deletedProduct;
  }

  async decrementStock(productId, quantity) {
    const product = await this.model.findOneAndUpdate(
      { _id: productId, stock: { $gte: quantity } }, // Ensure enough stock
      { $inc: { stock: -quantity } },
      { new: true }
    );
    if (product) {
      await this._invalidateProductCache(productId);
    }
    return product;
  }
}

module.exports = new ProductsRepository();
