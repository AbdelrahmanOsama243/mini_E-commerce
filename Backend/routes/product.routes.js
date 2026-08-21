const express = require("express");
const productController = require("../Controllers/product.controller");
const { authentication } = require("../Middlewares/auth.middleware");
const { authorize } = require("../Middlewares/authorize.middleware");
const { validateObjectId } = require("../Middlewares/validateObjectId");
const { validateZod, productSchemas } = require("../Middlewares/zodValidator");
const { handleUpload } = require("../Middlewares/upload.middleware");

const router = express.Router();
router.get("/", productController.getProducts);
router.get(
  "/:id",
  validateObjectId(["id"], "params"),
  productController.getProductById,
);

router.use(authentication);

router.post(
  "/", 
  authorize("admin"), 
  handleUpload,
  validateZod(productSchemas.createProduct), 
  productController.createProduct
);
router.put(
  "/:id",
  authorize("admin"),
  handleUpload,
  validateObjectId(["id"], "params"),
  validateZod(productSchemas.updateProduct),
  productController.updateProduct,
);
router.delete(
  "/:id",
  authorize("admin"),
  validateObjectId(["id"], "params"),
  productController.deleteProduct,
);

module.exports = router;
