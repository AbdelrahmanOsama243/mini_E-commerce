const express = require('express')
const cartController = require('../Controllers/Cart.Controller')
const { authentication } = require('../Middlewares/auth.middleware')
const { validateObjectId } = require('../Middlewares/validateObjectId')

const router = express.Router()

router.use(authentication)

router.get('/', cartController.getCart)
router.post('/', cartController.addItemToCart)
router.put('/:itemId', validateObjectId(['itemId'], 'params'), cartController.updateCartItemQuantity)
router.delete('/:itemId', validateObjectId(['itemId'], 'params'), cartController.removeItemFromCart)
router.delete('/', cartController.clearCart)

module.exports = router
