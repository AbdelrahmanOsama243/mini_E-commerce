const express = require('express')
const cartController = require('../Controllers/Cart.Controller')
const { optionalAuth } = require('../Middlewares/optionalAuth.middleware')
const { validateObjectId } = require('../Middlewares/validateObjectId')
const { validateZod, cartSchemas } = require("../Middlewares/zodValidator");
// You can also use Joi by uncommenting the next line and changing validateZod to validateJoi
// const { validateJoi, cartSchemas } = require("../Middlewares/joiValidator");

const router = express.Router()

router.use(optionalAuth)

router.get('/', cartController.getCart)
router.post('/', validateZod(cartSchemas.addItemToCart), cartController.addItemToCart)
router.put('/:itemId', validateObjectId(['itemId'], 'params'), validateZod(cartSchemas.updateCartItemQuantity), cartController.updateCartItemQuantity)
router.delete('/:itemId', validateObjectId(['itemId'], 'params'), cartController.removeItemFromCart)
router.delete('/', cartController.clearCart)
router.post('/merge', validateZod(cartSchemas.mergeCart), cartController.mergeCart)

module.exports = router
