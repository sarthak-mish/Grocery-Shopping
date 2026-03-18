const express = require('express');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

function getSessionId(req) {
  return req.headers['x-session-id'] || 'default-session';
}

// POST /api/orders — place an order
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { customer } = req.body;
    if (!customer || !customer.name || !customer.email || !customer.address) {
      return res.status(400).json({
        success: false,
        error: 'Customer name, email, and address are required',
      });
    }

    const sessionId = getSessionId(req);
    const cartSummary = await Cart.getSummary(sessionId);
    if (cartSummary.items.length === 0) {
      return res.status(400).json({ success: false, error: 'Cart is empty' });
    }

    // Reduce stock for each item
    for (const item of cartSummary.items) {
      const success = await Product.reduceStock(item.productId, item.quantity);
      if (!success) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for ${item.product.name}`,
        });
      }
    }

    const order = await Order.createOrder(cartSummary.items, customer, cartSummary, req.user._id);
    await Cart.clear(sessionId);

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/orders — list user's orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.getByUserId(req.user._id);
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/orders/:id — get single order
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.getById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/orders/:id/status — update order status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ success: false, error: `Status must be one of: ${allowed.join(', ')}` });
    }

    const order = await Order.updateStatus(req.params.id, status);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    // If cancelled, restore stock
    if (status === 'cancelled') {
      for (const item of order.items) {
        await Product.restoreStock(item.productId, item.quantity);
      }
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
