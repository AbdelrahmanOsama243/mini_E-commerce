const Order = require("");
const Cart = require("");
const Product = require("");

const createOrder = async (req, res, next) => {
  try {
    const { shippingAddress } = req.body;
    if (!shippingAddress || shippingAddress.trim() === "") {
      return res.status(400).json({ msg: "Shipping address is required" });
    }


    const cart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product"
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ msg: "Cart is empty" });
    }
    for (const item of cart.items) {
      if (item.quantity > item.product.stock) {
        return res.status(400).json({
          msg: `Insufficient stock for ${item.product.name}`,
        });
      }
    }



    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: {
          stock: -item.quantity,
        },
      });
    }

  
    const orderItems = cart.items.map((item) => ({
      product: item.product._id,
      quantity: item.quantity,
      priceAtPurchase: item.product.price,
    }));


    const totalPrice = cart.items.reduce((total, item) => {
      return total + item.quantity * item.product.price;
    }, 0);

  
    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      shippingAddress,
      totalPrice,
      status: "pending",
    });


    cart.items = [];
    await cart.save();

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
};


const getOrders = async (req, res, next) => {
  try {
    let orders;

    if (req.query.all === "true" && req.user.role === "admin") {
      orders = await Order.find().populate("user items.product");
    } else {
      orders = await Order.find({
        user: req.user.id,
      }).populate("items.product");
    }

    res.status(200).json(orders);
  } catch (err) {
    next(err);
  }
};


const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "user items.product"
    );

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    if (
      order.user._id.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ msg: "Forbidden" });
    }

    res.status(200).json(order);
  } catch (err) {
    next(err);
  }
};


const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const validStatus = [
      "pending",
      "paid",
      "shipped",
      "delivered",
    ];

    if (!validStatus.includes(status)) {
      return res.status(400).json({
        msg: "Invalid status",
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        msg: "Order not found",
      });
    }

    res.status(200).json(order);
  } catch (err) {
    next(err);
  }
};

module.exports = {createOrder, getOrders, getOrderById, updateOrderStatus,};