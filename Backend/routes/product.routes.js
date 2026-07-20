const express = require('express')
const productController = require('../Controllers/product.controller')
const { authentication } = require('../Middlewares/auth.middleware')
const { authorize } = require('../Middlewares/authorize.middleware')
const { validateObjectId } = require('../Middlewares/validateObjectId')

const router = express.Router()
router.get('/', productController.getProducts)
router.get('/:id', validateObjectId(['id'], 'params'), productController.getProductById)

router.use(authentication)

router.post('/', authorize('admin'), productController.createProduct)
router.put('/:id', authorize('admin'), validateObjectId(['id'], 'params'), productController.updateProduct)
router.delete('/:id', authorize('admin'), validateObjectId(['id'], 'params'), productController.deleteProduct)

module.exports = router
