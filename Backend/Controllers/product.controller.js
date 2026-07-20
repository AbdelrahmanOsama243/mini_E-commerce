const ProductsRepository = require("../Repos/Products.Repo")

const getProducts = async (req, res, next) => {
  try {
    const { search, category } = req.query
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100)
    const result = await ProductsRepository.getProducts({search,category,page,limit})
    return res.status(200).json(result)
  } catch (err) {
    next(err)
  }
}

const getProductById = async (req, res, next) => {
  try {
    const product = await ProductsRepository.getProductById(req.params.id)
    if (!product) {
      return res.status(404).json({success: false,message: "Product not found"})
    }
    return res.status(200).json({success: true,data: product})
  } catch (err) {
    next(err)
  }
}

const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, stock, image } = req.body
    if (!name || !category || price === undefined || stock === undefined) {
      return res.status(400).json({success: false,message: "Name, category, price and stock are required."})
    }
    if (price < 0) {
      return res.status(400).json({success: false,message: "Price must be a positive number"})
    }
    if (stock < 0) {
      return res.status(400).json({success: false,message: "Stock must be a positive number"})
    }
    const product = await ProductsRepository.createProduct({name,description,price,category,stock,image})
    return res.status(201).json({success: true,message: "Product created successfully.",data: product})
  } catch (err) {
    next(err)
  }
}

const updateProduct = async (req, res, next) => {
  try {
    const { price, stock } = req.body
    if (price !== undefined && price < 0) {
      return res.status(400).json({success: false,message: "Price must be a positive number"})
    }
    if (stock !== undefined && stock < 0) {
      return res.status(400).json({success: false,message: "Stock must be a positive number"})
    }
    const updatedProduct = await ProductsRepository.updateProduct(req.params.id,req.body)
    if (!updatedProduct) {
      return res.status(404).json({success: false,message: "Product not found."})
    }
    return res.status(200).json({success: true,message: "Product updated successfully.",data: updatedProduct})
  } catch (err) {
    next(err)
  }
}

const deleteProduct = async (req, res, next) => {
  try {
    const deletedProduct = await ProductsRepository.deleteProduct(req.params.id)
    if (!deletedProduct) {
      return res.status(404).json({success: false,message: "Product not found"})
    }
    return res.status(200).json({success: true,message: "Product deleted successfully"})
  } catch (err) {
    next(err)
  }
}

module.exports = {getProducts,getProductById,createProduct,updateProduct,deleteProduct}