const ProductsRepository = require("../Repos/Products.Repo")
const asyncHandler = require("../Utils/asyncHandler")
const { sendSuccess } = require("../Utils/response")
const ApiError = require("../Utils/ApiError")
const { validateObjectId } = require("../Middlewares/validateObjectId")

const getProducts = asyncHandler(async (req, res, next) => {
  const { search, category } = req.query
  const page = Math.max(parseInt(req.query.page) || 1, 1)
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100)
  const result = await ProductsRepository.getProducts({search,category,page,limit})
  return sendSuccess(res, result)
})

const getProductById = [
  validateObjectId(['id'], 'params'),
  asyncHandler(async (req, res, next) => {
    const { id } = req.params
    const product = await ProductsRepository.findById(id)
    if (!product) {
      return next(new ApiError(404, "Product not found"))
    }
    return sendSuccess(res, product)
  })
]

const createProduct = asyncHandler(async (req, res, next) => {
  if (req.file) {
    req.body.image = `/uploads/products/${req.file.filename}`;
  }
  const { name, description, price, category, stock, image } = req.body
  const product = await ProductsRepository.create({name,description,price,category,stock,image})
  return sendSuccess(res, product, "Product created successfully.", 201)
})

const updateProduct = [
  validateObjectId(['id'], 'params'),
  asyncHandler(async (req, res, next) => {
    const { id } = req.params
    if (req.file) {
      req.body.image = `/uploads/products/${req.file.filename}`;
    }
    const updatedProduct = await ProductsRepository.update(id, req.body)
    if (!updatedProduct) {
      return next(new ApiError(404, "Product not found."))
    }
    return sendSuccess(res, updatedProduct, "Product updated successfully.")
  })
]

const deleteProduct = [
  validateObjectId(['id'], 'params'),
  asyncHandler(async (req, res, next) => {
    const { id } = req.params
    const deletedProduct = await ProductsRepository.delete(id)
    if (!deletedProduct) {
      return next(new ApiError(404, "Product not found"))
    }
    return sendSuccess(res, null, "Product deleted successfully")
  })
]

module.exports = {getProducts,getProductById,createProduct,updateProduct,deleteProduct}