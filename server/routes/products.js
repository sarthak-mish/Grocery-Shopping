const express = require('express');
const Product = require('../models/Product');
const router = express.Router();

// GET /api/products — list all, optionally filter by category or search
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let results;

    if (search) {
      results = await Product.search(search);
    } else if (category && category !== 'all') {
      results = await Product.getByCategory(category);
    } else {
      results = await Product.getAll();
    }

    res.json({ success: true, count: results.length, products: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/products/categories — list all categories with meta
router.get('/categories', async (_req, res) => {
  try {
    const categories = await Product.getCategories();
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/products/:id — single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.getById(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/products/:id/stock — update stock level (inventory management)
router.put('/:id/stock', async (req, res) => {
  try {
    const { stock } = req.body;
    if (stock === undefined || stock < 0) {
      return res.status(400).json({ success: false, error: 'Valid stock value is required' });
    }
    const product = await Product.findOneAndUpdate(
      { productId: req.params.id },
      { stock, inStock: stock > 0 },
      { new: true },
    );
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/products/:id/stock — get current stock level
router.get('/:id/stock', async (req, res) => {
  try {
    const product = await Product.findOne({ productId: req.params.id }).select('productId name stock inStock');
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, productId: product.productId, name: product.name, stock: product.stock, inStock: product.inStock });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
