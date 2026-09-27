const mongoose = require('mongoose');
const Order = require('../Models/orders.Model');
const Product = require('../Models/Products.Model');
const User = require('../Models/User.Model');

class AnalyticsService {
  // ───────────────────────────────────────────────────────────────────────────
  // USER-LEVEL ANALYTICS (Scoped to specific user)
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Summary stats for a user (total spent, total orders, counts by status)
   */
  async getUserOrderStats(userId) {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const stats = await Order.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: {
            $sum: {
              $cond: [
                { $in: ['$status', ['paid', 'processing', 'shipped', 'delivered']] },
                '$totalPrice',
                0
              ]
            }
          },
          paidCount: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
          },
          pendingCount: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          processingCount: {
            $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] }
          },
          shippedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'shipped'] }, 1, 0] }
          },
          deliveredCount: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          },
          failedCount: {
            $sum: { $cond: [{ $in: ['$status', ['payment_failed', 'failed']] }, 1, 0] }
          },
          cancelledCount: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          refundedCount: {
            $sum: { $cond: [{ $in: ['$status', ['refunded', 'partially_refunded']] }, 1, 0] }
          }
        }
      }
    ]);

    if (!stats || stats.length === 0) {
      return {
        totalOrders: 0,
        totalSpent: 0,
        paidCount: 0,
        pendingCount: 0,
        processingCount: 0,
        shippedCount: 0,
        deliveredCount: 0,
        failedCount: 0,
        cancelledCount: 0,
        refundedCount: 0
      };
    }

    const { _id, ...rest } = stats[0];
    return rest;
  }

  /**
   * Group user orders by status (formatted for ngx-charts / chart kits: { name, value })
   */
  async getUserOrdersByStatus(userId) {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const result = await Order.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          value: '$count'
        }
      },
      { $sort: { value: -1 } }
    ]);

    return result;
  }

  /**
   * User spending over time (monthly)
   */
  async getUserSpendingTimeline(userId) {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const result = await Order.aggregate([
      {
        $match: {
          userId: userObjectId,
          status: { $nin: ['failed', 'payment_failed', 'cancelled'] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalAmount: { $sum: '$totalPrice' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          name: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: [
                  { $lt: ['$_id.month', 10] },
                  { $concat: ['0', { $toString: '$_id.month' }] },
                  { $toString: '$_id.month' }
                ]
              }
            ]
          },
          value: '$totalAmount',
          orders: '$orderCount'
        }
      }
    ]);

    return result;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ADMIN-LEVEL ANALYTICS (Scoped to specific admin's created products)
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Get all product ObjectIds owned by an admin
   */
  async getAdminProductIds(adminId) {
    const adminObjectId = new mongoose.Types.ObjectId(adminId);
    const products = await Product.find({ createdBy: adminObjectId }).select('_id');
    return products.map(p => p._id);
  }

  /**
   * Summary overview for an admin:
   * - Total products
   * - Low stock count & out of stock count
   * - Total inventory value
   * - Total items sold & Total revenue for admin's items
   */
  async getAdminOverview(adminId) {
    const adminObjectId = new mongoose.Types.ObjectId(adminId);

    // 1. Inventory & Products metrics
    const productStats = await Product.aggregate([
      { $match: { createdBy: adminObjectId } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          lowStockCount: {
            $sum: { $cond: [{ $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', 5] }] }, 1, 0] }
          },
          outOfStockCount: {
            $sum: { $cond: [{ $lte: ['$stock', 0] }, 1, 0] }
          },
          totalInventoryValue: {
            $sum: { $multiply: ['$price', '$stock'] }
          }
        }
      }
    ]);

    const prodData = productStats[0] || {
      totalProducts: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      totalInventoryValue: 0
    };

    // 2. Sales & Revenue metrics for admin's products
    const productIds = await this.getAdminProductIds(adminId);

    let salesData = {
      totalItemsSold: 0,
      totalRevenue: 0,
      totalOrdersCount: 0
    };

    if (productIds.length > 0) {
      const salesStats = await Order.aggregate([
        { $match: { status: { $nin: ['failed', 'payment_failed', 'cancelled'] } } },
        { $unwind: '$items' },
        { $match: { 'items.productId': { $in: productIds } } },
        {
          $group: {
            _id: null,
            totalItemsSold: { $sum: '$items.quantity' },
            totalRevenue: {
              $sum: { $multiply: ['$items.quantity', '$items.priceAtPurchase'] }
            },
            uniqueOrders: { $addToSet: '$_id' }
          }
        },
        {
          $project: {
            _id: 0,
            totalItemsSold: 1,
            totalRevenue: 1,
            totalOrdersCount: { $size: '$uniqueOrders' }
          }
        }
      ]);

      if (salesStats.length > 0) {
        salesData = salesStats[0];
      }
    }

    return {
      totalProducts: prodData.totalProducts,
      lowStockCount: prodData.lowStockCount,
      outOfStockCount: prodData.outOfStockCount,
      totalInventoryValue: prodData.totalInventoryValue,
      totalItemsSold: salesData.totalItemsSold,
      totalRevenue: salesData.totalRevenue,
      totalOrdersCount: salesData.totalOrdersCount
    };
  }

  /**
   * Top selling products for this admin
   */
  async getAdminTopProducts(adminId, limit = 10) {
    const productIds = await this.getAdminProductIds(adminId);
    if (productIds.length === 0) return [];

    const result = await Order.aggregate([
      { $match: { status: { $nin: ['failed', 'payment_failed', 'cancelled'] } } },
      { $unwind: '$items' },
      { $match: { 'items.productId': { $in: productIds } } },
      {
        $group: {
          _id: '$items.productId',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.priceAtPurchase'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: Number(limit) },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          _id: 1,
          productId: '$_id',
          name: '$product.name',
          category: '$product.category',
          price: '$product.price',
          stock: '$product.stock',
          image: '$product.image',
          value: '$totalSold', // for ngx-charts
          totalSold: 1,
          totalRevenue: 1
        }
      }
    ]);

    return result;
  }

  /**
   * Least selling products (or unsold) for this admin
   */
  async getAdminLeastProducts(adminId, limit = 10) {
    const adminObjectId = new mongoose.Types.ObjectId(adminId);
    const adminProducts = await Product.find({ createdBy: adminObjectId }).lean();
    if (adminProducts.length === 0) return [];

    const productIds = adminProducts.map(p => p._id);

    // Sales aggregation
    const salesMap = new Map();
    const sales = await Order.aggregate([
      { $match: { status: { $nin: ['failed', 'payment_failed', 'cancelled'] } } },
      { $unwind: '$items' },
      { $match: { 'items.productId': { $in: productIds } } },
      {
        $group: {
          _id: '$items.productId',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.priceAtPurchase'] } }
        }
      }
    ]);

    sales.forEach(s => {
      salesMap.set(s._id.toString(), {
        totalSold: s.totalSold,
        totalRevenue: s.totalRevenue
      });
    });

    // Merge all products with sales (defaulting to 0 for unsold)
    const allRanked = adminProducts.map(prod => {
      const sale = salesMap.get(prod._id.toString()) || { totalSold: 0, totalRevenue: 0 };
      return {
        _id: prod._id,
        productId: prod._id,
        name: prod.name,
        category: prod.category,
        price: prod.price,
        stock: prod.stock,
        image: prod.image,
        value: sale.totalSold, // for ngx-charts
        totalSold: sale.totalSold,
        totalRevenue: sale.totalRevenue
      };
    });

    // Sort ascending (least sold first)
    allRanked.sort((a, b) => a.totalSold - b.totalSold || a.stock - b.stock);

    return allRanked.slice(0, Number(limit));
  }

  /**
   * Low stock products (critical alert) for this admin
   */
  async getAdminLowStockProducts(adminId, threshold = 5) {
    const adminObjectId = new mongoose.Types.ObjectId(adminId);

    const products = await Product.find({
      createdBy: adminObjectId,
      stock: { $lte: Number(threshold) }
    })
      .sort({ stock: 1 })
      .lean();

    return products.map(p => ({
      _id: p._id,
      name: p.name,
      category: p.category,
      price: p.price,
      stock: p.stock,
      image: p.image,
      isOutOfStock: p.stock <= 0,
      value: p.stock // for ngx-charts
    }));
  }

  /**
   * Revenue timeline for this admin (monthly breakdown)
   */
  async getAdminRevenueTimeline(adminId) {
    const productIds = await this.getAdminProductIds(adminId);
    if (productIds.length === 0) return [];

    const result = await Order.aggregate([
      { $match: { status: { $nin: ['failed', 'payment_failed', 'cancelled'] } } },
      { $unwind: '$items' },
      { $match: { 'items.productId': { $in: productIds } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalRevenue: {
            $sum: { $multiply: ['$items.quantity', '$items.priceAtPurchase'] }
          },
          itemsSold: { $sum: '$items.quantity' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          name: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: [
                  { $lt: ['$_id.month', 10] },
                  { $concat: ['0', { $toString: '$_id.month' }] },
                  { $toString: '$_id.month' }
                ]
              }
            ]
          },
          value: '$totalRevenue',
          itemsSold: 1
        }
      }
    ]);

    return result;
  }

  /**
   * Payment method distribution for orders containing this admin's products
   */
  async getAdminPaymentStats(adminId) {
    const productIds = await this.getAdminProductIds(adminId);
    if (productIds.length === 0) return [];

    const result = await Order.aggregate([
      { $match: { status: { $nin: ['failed', 'payment_failed', 'cancelled'] } } },
      { $match: { 'items.productId': { $in: productIds } } },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          value: '$count'
        }
      },
      { $sort: { value: -1 } }
    ]);

    return result;
  }

  /**
   * Top customers for this admin
   */
  async getAdminTopCustomers(adminId, limit = 10) {
    const productIds = await this.getAdminProductIds(adminId);
    if (productIds.length === 0) return [];

    const result = await Order.aggregate([
      { $match: { status: { $nin: ['failed', 'payment_failed', 'cancelled'] } } },
      { $unwind: '$items' },
      { $match: { 'items.productId': { $in: productIds } } },
      {
        $group: {
          _id: '$userId',
          totalSpent: {
            $sum: { $multiply: ['$items.quantity', '$items.priceAtPurchase'] }
          },
          itemsPurchased: { $sum: '$items.quantity' },
          ordersCount: { $addToSet: '$_id' }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: Number(limit) },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          userId: '$_id',
          name: '$user.name',
          email: '$user.email',
          totalSpent: 1,
          itemsPurchased: 1,
          ordersCount: { $size: '$ordersCount' },
          value: '$totalSpent' // for ngx-charts
        }
      }
    ]);

    return result;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // GLOBAL & LOOKER STUDIO DATA EXPORT
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Export structured dataset for Looker Studio Community Connector (JSON Endpoint)
   */
  async getLookerExportData() {
    const [orders, products, users] = await Promise.all([
      Order.find()
        .populate('userId', 'name email role')
        .populate('items.productId', 'name category price stock createdBy')
        .lean(),
      Product.find().populate('createdBy', 'name email').lean(),
      User.find().select('name email role createdAt status').lean()
    ]);

    // Flatten orders for Looker Studio tabular schema
    const flattenedOrders = [];
    orders.forEach(order => {
      if (!order.items || order.items.length === 0) {
        flattenedOrders.push({
          orderId: order._id.toString(),
          orderDate: order.createdAt,
          orderStatus: order.status,
          paymentStatus: order.paymentStatus || 'pending',
          paymentMethod: order.paymentMethod,
          totalPrice: order.totalPrice,
          customerName: order.userId?.name || 'Unknown',
          customerEmail: order.userId?.email || 'N/A',
          productName: 'N/A',
          category: 'N/A',
          quantity: 0,
          itemPrice: 0,
          itemSubtotal: 0,
          shippingAddress: order.shippingAddress || 'N/A'
        });
      } else {
        order.items.forEach(item => {
          const product = item.productId;
          flattenedOrders.push({
            orderId: order._id.toString(),
            orderDate: order.createdAt,
            orderStatus: order.status,
            paymentStatus: order.paymentStatus || 'pending',
            paymentMethod: order.paymentMethod,
            totalPrice: order.totalPrice,
            customerName: order.userId?.name || 'Unknown',
            customerEmail: order.userId?.email || 'N/A',
            productName: product?.name || 'Product',
            category: product?.category || 'General',
            quantity: item.quantity,
            itemPrice: item.priceAtPurchase || 0,
            itemSubtotal: (item.quantity || 0) * (item.priceAtPurchase || 0),
            shippingAddress: order.shippingAddress || 'N/A'
          });
        });
      }
    });

    return {
      metadata: {
        exportedAt: new Date().toISOString(),
        totalOrders: orders.length,
        totalProducts: products.length,
        totalUsers: users.length
      },
      orders: flattenedOrders,
      products: products.map(p => ({
        id: p._id.toString(),
        name: p.name,
        category: p.category,
        price: p.price,
        stock: p.stock,
        adminOwner: p.createdBy?.name || 'Admin',
        createdAt: p.createdAt
      }))
    };
  }
}

module.exports = new AnalyticsService();
