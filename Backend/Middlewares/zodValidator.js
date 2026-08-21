const { z } = require('zod');
const ApiError = require('../Utils/ApiError');

// Middleware wrapper for Zod
const validateZod = (schema) => (req, res, next) => {
  try {
    if (schema.body) req.body = schema.body.parse(req.body);
    if (schema.query) req.query = schema.query.parse(req.query);
    if (schema.params) req.params = schema.params.parse(req.params);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => err.message).join(', ');
      return next(new ApiError(400, errorMessages));
    }
    next(error);
  }
};

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const passwordMessage = "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character";

const authSchemas = {
  register: {
    body: z.object({
      name: z.string({ required_error: "Name is required" }).min(2, "Name must be at least 2 characters long"),
      email: z.string({ required_error: "Email is required" }).regex(/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email address"),
      password: z.string({ required_error: "Password is required" }).regex(passwordRegex, passwordMessage)
    })
  },
  login: {
    body: z.object({
      email: z.string({ required_error: "Email is required" }).regex(/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email address"),
      password: z.string({ required_error: "Password is required" }).min(1, "Password is required")
    })
  },
  updateUserProfile: {
    body: z.object({
      name: z.string().min(2, "Name must be at least 2 characters long").optional(),
      email: z.string().regex(/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email address").optional()
    }).refine(data => Object.keys(data).length > 0, {
      message: "No valid fields provided for update"
    })
  },
  forgetPassword: {
    body: z.object({
      email: z.string({ required_error: "Email is required" }).regex(/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email address")
    })
  }
};

const productSchemas = {
  createProduct: {
    body: z.object({
      name: z.string({ required_error: "Name is required" }).min(1, "Name is required"),
      description: z.string().optional(),
      price: z.coerce.number({ required_error: "Price is required" }).min(0, "Price must be a positive number"),
      category: z.string({ required_error: "Category is required" }).min(1, "Category is required"),
      stock: z.coerce.number({ required_error: "Stock is required" }).min(0, "Stock must be a positive number"),
      image: z.string().optional()
    })
  },
  updateProduct: {
    body: z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      price: z.coerce.number().min(0, "Price must be a positive number").optional(),
      category: z.string().optional(),
      stock: z.coerce.number().min(0, "Stock must be a positive number").optional(),
      image: z.string().optional()
    })
  }
};

const cartSchemas = {
  addItemToCart: {
    body: z.object({
      productId: z.string({ required_error: "Product ID is required" }),
      quantity: z.number({ required_error: "Quantity is required" }).min(1, "Quantity must be greater than 0")
    })
  },
  updateCartItemQuantity: {
    body: z.object({
      quantity: z.number({ required_error: "Quantity is required" }).min(1, "Quantity must be greater than 0")
    })
  },
  mergeCart: {
    body: z.object({
      items: z.array(
        z.object({
          productId: z.string({ required_error: "Product ID is required" }),
          quantity: z.number({ required_error: "Quantity is required" }).min(1, "Quantity must be greater than 0")
        })
      , { required_error: "Items must be an array" })
    })
  }
};

const orderSchemas = {
  createOrder: {
    body: z.object({
      shippingAddress: z.string({ required_error: "Shipping address is required" }).min(1, "Shipping address is required")
    })
  },
  updateOrderStatus: {
    body: z.object({
      status: z.enum(["pending", "processing", "shipped", "delivered"], { 
        required_error: "Invalid status", 
        invalid_type_error: "Invalid status" 
      })
    })
  }
};

module.exports = {
  validateZod,
  authSchemas,
  productSchemas,
  cartSchemas,
  orderSchemas
};
