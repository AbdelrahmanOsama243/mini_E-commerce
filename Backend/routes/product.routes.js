const express = require("express");
const productController = require("../Controllers/product.controller");
const { authentication } = require("../Middlewares/auth.middleware");
const { authorize } = require("../Middlewares/authorize.middleware");
const { validateObjectId } = require("../Middlewares/validateObjectId");
const { validateZod, productSchemas } = require("../Middlewares/zodValidator");
const { handleUpload } = require("../Middlewares/upload.middleware");
const { redisCache, invalidateCache } = require("../Middlewares/redisCache");

const router = express.Router();

const PRODUCT_CACHE_PATTERNS = ['cache:GET:/api/products*', 'products:query:*', 'product:*'];

router.get("/", redisCache(3600, 300), productController.getProducts);
router.get(
  "/:id",
  validateObjectId(["id"], "params"),
  redisCache(3600, 600),
  productController.getProductById,
);

router.use(authentication);

router.post(
  "/", 
  authorize("admin"), 
  invalidateCache(PRODUCT_CACHE_PATTERNS),
  handleUpload,
  validateZod(productSchemas.createProduct), 
  productController.createProduct
);
router.put(
  "/:id",
  authorize("admin"),
  invalidateCache(PRODUCT_CACHE_PATTERNS),
  handleUpload,
  validateObjectId(["id"], "params"),
  validateZod(productSchemas.updateProduct),
  productController.updateProduct,
);
router.delete(
  "/:id",
  authorize("admin"),
  invalidateCache(PRODUCT_CACHE_PATTERNS),
  validateObjectId(["id"], "params"),
  productController.deleteProduct,
);

module.exports = router;
