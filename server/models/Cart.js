const mongoose = require('mongoose');
const Product = require('./Product');

const cartItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  quantity:  { type: Number, required: true, min: 1, default: 1 },
}, { _id: false });

const cartSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  items:     [cartItemSchema],
  updatedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

// ---------- Helpers ----------

async function getOrCreateCart(sessionId) {
  let cart = await Cart.findOne({ sessionId });
  if (!cart) {
    cart = await Cart.create({ sessionId, items: [] });
  }
  return cart;
}

async function buildSummary(cart) {
  const populatedItems = [];
  for (const item of cart.items) {
    const product = await Product.getById(item.productId);
    if (product) {
      populatedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        product,
        subtotal: +(product.price * item.quantity).toFixed(2),
      });
    }
  }
  const subtotal = +populatedItems.reduce((s, i) => s + i.subtotal, 0).toFixed(2);
  const itemCount = populatedItems.reduce((s, i) => s + i.quantity, 0);
  const deliveryFee = subtotal > 35 ? 0 : 4.99;
  const tax = +(subtotal * 0.08).toFixed(2);
  const total = +(subtotal + deliveryFee + tax).toFixed(2);
  return { items: populatedItems, itemCount, subtotal, deliveryFee, tax, total };
}

// ---------- Static methods (same public API as before) ----------

cartSchema.statics.getSummary = async function (sessionId) {
  const cart = await getOrCreateCart(sessionId);
  return buildSummary(cart);
};

cartSchema.statics.addItem = async function (sessionId, productId, quantity = 1) {
  const product = await Product.getById(productId);
  if (!product) return { error: 'Product not found' };
  if (!product.inStock) return { error: 'Product is out of stock' };

  const cart = await getOrCreateCart(sessionId);
  const existing = cart.items.find(i => i.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.items.push({ productId, quantity });
  }
  await cart.save();
  return buildSummary(cart);
};

cartSchema.statics.updateQuantity = async function (sessionId, productId, quantity) {
  const cart = await getOrCreateCart(sessionId);
  const idx = cart.items.findIndex(i => i.productId === productId);
  if (idx === -1) return { error: 'Item not in cart' };

  if (quantity <= 0) {
    cart.items.splice(idx, 1);
  } else {
    cart.items[idx].quantity = quantity;
  }
  await cart.save();
  return buildSummary(cart);
};

cartSchema.statics.removeItem = async function (sessionId, productId) {
  const cart = await getOrCreateCart(sessionId);
  const idx = cart.items.findIndex(i => i.productId === productId);
  if (idx === -1) return { error: 'Item not in cart' };
  cart.items.splice(idx, 1);
  await cart.save();
  return buildSummary(cart);
};

cartSchema.statics.clear = async function (sessionId) {
  const cart = await getOrCreateCart(sessionId);
  cart.items = [];
  await cart.save();
  return buildSummary(cart);
};

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
