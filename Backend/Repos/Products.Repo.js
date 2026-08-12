const BaseRepo = require('./BaseRepo');
const Product = require('../Models/Products.Model');
const redisRepo = require('./Redis.Repo');

class ProductsRepository extends BaseRepo {
  constructor() {
    super(Product);
    this.allowedUpdates = ['name', 'description', 'price', 'category', 'stock', 'image'];
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
      filter.category = category;
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
}

module.exports = new ProductsRepository();
