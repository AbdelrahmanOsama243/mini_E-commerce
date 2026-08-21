const Joi = require('joi');
const ApiError = require('../Utils/ApiError');

// Middleware wrapper for Joi
const validateJoi = (schema) => (req, res, next) => {
  if (schema.body) {
    const { error, value } = schema.body.validate(req.body, { abortEarly: false });
    if (error) {
      const errorMessages = error.details.map((err) => err.message).join(', ');
      return next(new ApiError(400, errorMessages));
    }
    req.body = value;
  }
  if (schema.query) {
    const { error, value } = schema.query.validate(req.query, { abortEarly: false });
    if (error) {
      const errorMessages = error.details.map((err) => err.message).join(', ');
      return next(new ApiError(400, errorMessages));
    }
    req.query = value;
  }
  if (schema.params) {
    const { error, value } = schema.params.validate(req.params, { abortEarly: false });
    if (error) {
      const errorMessages = error.details.map((err) => err.message).join(', ');
      return next(new ApiError(400, errorMessages));
    }
    req.params = value;
  }
  next();
};

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
const passwordMessage = "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character";

const authSchemas = {
  register: {
    body: Joi.object({
      name: Joi.string().min(2).required().messages({
        'string.min': "Name must be at least 2 characters long",
        'any.required': "Name is required"
      }),
      email: Joi.string().pattern(emailRegex).required().messages({
        'string.pattern.base': "Please enter a valid email address",
        'any.required': "Email is required"
      }),
      password: Joi.string().pattern(passwordRegex).required().messages({
        'string.pattern.base': passwordMessage,
        'any.required': "Password is required"
      })
    })
  },
  login: {
    body: Joi.object({
      email: Joi.string().pattern(emailRegex).required().messages({
        'string.pattern.base': "Please enter a valid email address",
        'any.required': "Email is required"
      }),
      password: Joi.string().required().messages({
        'any.required': "Password is required"
      })
    })
  },
  updateUserProfile: {
    body: Joi.object({
      name: Joi.string().min(2).messages({
        'string.min': "Name must be at least 2 characters long"
      }),
      email: Joi.string().pattern(emailRegex).messages({
        'string.pattern.base': "Please enter a valid email address"
      })
    }).min(1).messages({
      'object.min': "No valid fields provided for update"
    })
  },
  forgetPassword: {
    body: Joi.object({
      email: Joi.string().pattern(emailRegex).required().messages({
        'string.pattern.base': "Please enter a valid email address",
        'any.required': "Email is required"
      })
    })
  }
};

const productSchemas = {
  createProduct: {
    body: Joi.object({
      name: Joi.string().required().messages({'any.required': "Name is required"}),
      description: Joi.string().optional(),
      price: Joi.number().min(0).required().messages({
        'number.min': "Price must be a positive number",
        'any.required': "Price is required"
      }),
      category: Joi.string().required().messages({'any.required': "Category is required"}),
      stock: Joi.number().min(0).required().messages({
        'number.min': "Stock must be a positive number",
        'any.required': "Stock is required"
      }),
      image: Joi.string().optional()
    })
  },
  updateProduct: {
    body: Joi.object({
      name: Joi.string().optional(),
      description: Joi.string().optional(),
      price: Joi.number().min(0).optional().messages({
        'number.min': "Price must be a positive number"
      }),
      category: Joi.string().optional(),
      stock: Joi.number().min(0).optional().messages({
        'number.min': "Stock must be a positive number"
      }),
      image: Joi.string().optional()
    })
  }
};

const cartSchemas = {
  addItemToCart: {
    body: Joi.object({
      productId: Joi.string().required().messages({ 'any.required': 'Product ID is required' }),
      quantity: Joi.number().min(1).required().messages({
        'number.min': 'Quantity must be greater than 0',
        'any.required': 'Quantity is required'
      })
    })
  },
  updateCartItemQuantity: {
    body: Joi.object({
      quantity: Joi.number().min(1).required().messages({
        'number.min': 'Quantity must be greater than 0',
        'any.required': 'Quantity is required'
      })
    })
  },
  mergeCart: {
    body: Joi.object({
      items: Joi.array().items(
        Joi.object({
          productId: Joi.string().required().messages({ 'any.required': 'Product ID is required' }),
          quantity: Joi.number().min(1).required().messages({
            'number.min': 'Quantity must be greater than 0',
            'any.required': 'Quantity is required'
          })
        })
      ).required().messages({ 'any.required': 'Items must be an array' })
    })
  }
};

const orderSchemas = {
  createOrder: {
    body: Joi.object({
      shippingAddress: Joi.string().required().min(1).messages({
        'any.required': "Shipping address is required",
        'string.empty': "Shipping address is required"
      })
    })
  },
  updateOrderStatus: {
    body: Joi.object({
      status: Joi.string().valid("pending", "processing", "shipped", "delivered").required().messages({
        'any.required': "Invalid status",
        'any.only': "Invalid status"
      })
    })
  }
};

module.exports = {
  validateJoi,
  authSchemas,
  productSchemas,
  cartSchemas,
  orderSchemas
};
