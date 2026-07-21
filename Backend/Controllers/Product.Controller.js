const ProductsRepo = require('../Repos/Products.Repo');
const asyncHandler = require('../Utils/asyncHandler');
const ApiError = require('../Utils/ApiError');
const { sendSuccess } = require('../Utils/response');

const getProducts = asyncHandler(async (req, res) => {
  const result = await ProductsRepo.getProducts(req.query);
  return sendSuccess(res, result.items, 'Products retrieved successfully', 200, {
    pagination: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit) || 1
    }
  });
});

const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await ProductsRepo.findById(id);

  if (!product) {
    throw new ApiError(404, `Product with ID '${id}' not found`);
  }

  return sendSuccess(res, product, 'Product details retrieved successfully');
});

const checkProductStock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const stockInfo = await ProductsRepo.checkStock(id);

  if (!stockInfo) {
    throw new ApiError(404, `Product with ID '${id}' not found`);
  }

  return sendSuccess(res, stockInfo, 'Stock status retrieved successfully');
});

const createProduct = asyncHandler(async (req, res) => {
  const product = await ProductsRepo.create(req.body);
  return sendSuccess(res, product, 'Product created successfully', 201);
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existingProduct = await ProductsRepo.findById(id);

  if (!existingProduct) {
    throw new ApiError(404, `Product with ID '${id}' not found`);
  }

  const updatedProduct = await ProductsRepo.update(id, req.body);
  return sendSuccess(res, updatedProduct, 'Product updated successfully');
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existingProduct = await ProductsRepo.findById(id);

  if (!existingProduct) {
    throw new ApiError(404, `Product with ID '${id}' not found`);
  }

  await ProductsRepo.delete(id);
  return res.status(200).json({
    success: true,
    message: 'Product deleted successfully'
  });
});

module.exports = {
  getProducts,
  getProductById,
  checkProductStock,
  createProduct,
  updateProduct,
  deleteProduct
};
