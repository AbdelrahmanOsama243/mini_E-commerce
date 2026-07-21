const OrdersRepo = require('../Repos/orders.Repo');
const ProductsRepo = require('../Repos/Products.Repo');
const CartsRepo = require('../Repos/Carts.Repo');
const asyncHandler = require('../Utils/asyncHandler');
const ApiError = require('../Utils/ApiError');
const { sendSuccess } = require('../Utils/response');

const createOrder = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const { shippingAddress, items: inputItems } = req.body;

  let orderItems = [];

  if (inputItems && inputItems.length > 0) {
    orderItems = inputItems;
  } else {
    // If items not provided, load items from user's current Cart
    const userCart = await CartsRepo.getCartByUserId(userId);
    if (!userCart || !userCart.items || userCart.items.length === 0) {
      throw new ApiError(400, 'Cannot place order: Cart is empty and no order items were provided');
    }
    orderItems = userCart.items.map(item => ({
      productId: item.productId._id ? item.productId._id.toString() : item.productId.toString(),
      quantity: item.quantity
    }));
  }

  // 1. Verify stock and calculate priceAtPurchase for each product item
  const validatedItems = [];
  let totalPrice = 0;

  for (const item of orderItems) {
    const product = await ProductsRepo.findById(item.productId);
    if (!product) {
      throw new ApiError(404, `Product '${item.productId}' not found`);
    }

    if (product.stock < item.quantity) {
      throw new ApiError(
        400,
        `Insufficient stock for product '${product.name}'. Available: ${product.stock}, Requested: ${item.quantity}`
      );
    }

    const itemPrice = product.price;
    const lineTotal = itemPrice * item.quantity;
    totalPrice += lineTotal;

    validatedItems.push({
      productId: product._id,
      quantity: item.quantity,
      priceAtPurchase: itemPrice
    });
  }

  // 2. Decrement stock for each purchased product
  for (const item of validatedItems) {
    await ProductsRepo.updateStock(item.productId, -item.quantity);
  }

  // 3. Create Order
  const order = await OrdersRepo.createOrder({
    userId,
    items: validatedItems,
    totalPrice,
    shippingAddress,
    status: 'pending'
  });

  // 4. Clear user's Cart after successful order
  await CartsRepo.clearCart(userId);

  // 5. Populate product details before returning
  const populatedOrder = await OrdersRepo.getOrderById(order._id);

  return sendSuccess(res, populatedOrder, 'Order placed successfully', 201);
});

const getUserOrders = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const orders = await OrdersRepo.getUserOrders(userId);
  return sendSuccess(res, orders.items, 'User orders retrieved successfully');
});

const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id || req.user._id;
  const userRole = req.user.role;

  const order = await OrdersRepo.getOrderById(id);
  if (!order) {
    throw new ApiError(404, `Order with ID '${id}' not found`);
  }

  // Authorize: user can view their own order; admin can view any order
  if (order.userId.toString() !== userId.toString() && userRole !== 'admin') {
    throw new ApiError(403, 'Access denied: You can only view your own orders');
  }

  return sendSuccess(res, order, 'Order details retrieved successfully');
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const order = await OrdersRepo.findById(id);
  if (!order) {
    throw new ApiError(404, `Order with ID '${id}' not found`);
  }

  const updatedOrder = await OrdersRepo.update(id, { status });
  const populatedOrder = await OrdersRepo.getOrderById(updatedOrder._id);

  return sendSuccess(res, populatedOrder, 'Order status updated successfully');
});

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus
};
