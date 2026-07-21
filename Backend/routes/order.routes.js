const express = require('express');
const orderController = require('../Controllers/order.controller')
const { authentication } = require('../Middlewares/auth.middleware')
const { authorize } = require('../Middlewares/authorize.middleware')
const { validateObjectId } = require('../Middlewares/validateObjectId')

const router = express.Router()

router.use(authentication)

router.post('/', orderController.createOrder)
router.get('/', orderController.getOrders)
router.get('/:id', validateObjectId(['id'], 'params'), orderController.getOrderById)
router.put('/:id/status', authorize('admin'), validateObjectId(['id'], 'params'), orderController.updateOrderStatus)

module.exports = router
