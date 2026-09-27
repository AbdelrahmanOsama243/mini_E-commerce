const express = require("express");
const orderController = require("../Controllers/order.controller");
const { authentication } = require("../Middlewares/auth.middleware");
const { authorize } = require("../Middlewares/authorize.middleware");
const { validateObjectId } = require("../Middlewares/validateObjectId");
const { validateZod, orderSchemas } = require("../Middlewares/zodValidator");
// You can also use Joi by uncommenting the next line and changing validateZod to validateJoi
// const { validateJoi, orderSchemas } = require("../Middlewares/joiValidator");

const router = express.Router();

router.use(authentication);

router.post("/", validateZod(orderSchemas.createOrder), orderController.createOrder);
router.get("/", orderController.getOrders);
router.get(
  "/:id",
  validateObjectId(["id"], "params"),
  orderController.getOrderById,
);
router.put(
  "/:id/status",
  authorize("admin"),
  validateObjectId(["id"], "params"),
  validateZod(orderSchemas.updateOrderStatus),
  orderController.updateOrderStatus,
);
router.post(
  "/:id/cancel",
  validateObjectId(["id"], "params"),
  orderController.cancelOrder,
);

module.exports = router;
