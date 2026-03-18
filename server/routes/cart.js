const express = require('express');
const Cart = require('../models/Cart');
const router = express.Router();

// Session ID helper — uses a cookie-like x-session-id header, or defaults
function getSessionId(req) {
  return req.headers['x-session-id'] || 'default-session';
}

// GET /api/cart — get current cart with summary
router.get('/', async (req, res) => {
  try {
    const cart = await Cart.getSummary(getSessionId(req));
    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/cart/add — add item to cart
router.post('/add', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId) return res.status(400).json({ success: false, error: 'productId is required' });

    const result = await Cart.addItem(getSessionId(req), productId, quantity || 1);
    if (result.error) return res.status(400).json({ success: false, error: result.error });
    res.json({ success: true, cart: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/cart/update — update item quantity
router.put('/update', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId || quantity === undefined) {
      return res.status(400).json({ success: false, error: 'productId and quantity are required' });
    }

    const result = await Cart.updateQuantity(getSessionId(req), productId, quantity);
    if (result.error) return res.status(400).json({ success: false, error: result.error });
    res.json({ success: true, cart: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/cart/remove/:productId — remove item
router.delete('/remove/:productId', async (req, res) => {
  try {
    const result = await Cart.removeItem(getSessionId(req), req.params.productId);
    if (result.error) return res.status(404).json({ success: false, error: result.error });
    res.json({ success: true, cart: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/cart/clear — clear cart
router.delete('/clear', async (req, res) => {
  try {
    const result = await Cart.clear(getSessionId(req));
    res.json({ success: true, cart: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
