const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true, index: true },
  name:        { type: String, required: true },
  category:    { type: String, required: true, index: true },
  price:       { type: Number, required: true, min: 0 },
  unit:        { type: String, required: true },
  emoji:       { type: String, default: '🛒' },
  description: { type: String, default: '' },
  inStock:     { type: Boolean, default: true },
  stock:       { type: Number, default: 100 },
  rating:      { type: Number, default: 0, min: 0, max: 5 },
  badge:       { type: String, default: null },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform(_doc, ret) {
      ret.id = ret.productId;      // keep "id" field for frontend compat
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

// ---------- Text index for search ----------
productSchema.index({ name: 'text', description: 'text', category: 'text' });

// ---------- Static helpers ----------

productSchema.statics.getAll = function () {
  return this.find().sort({ category: 1, name: 1 }).lean().then(docs => docs.map(mapDoc));
};

productSchema.statics.getById = function (id) {
  return this.findOne({ productId: id }).lean().then(doc => doc ? mapDoc(doc) : null);
};

productSchema.statics.getByCategory = function (category) {
  return this.find({ category }).sort({ name: 1 }).lean().then(docs => docs.map(mapDoc));
};

productSchema.statics.search = function (query) {
  const regex = new RegExp(query, 'i');
  return this.find({
    $or: [
      { name: regex },
      { description: regex },
      { category: regex },
    ],
  }).lean().then(docs => docs.map(mapDoc));
};

productSchema.statics.getCategories = async function () {
  const cats = await this.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  const meta = {
    fruits:     { emoji: '🍎', label: 'Fruits' },
    vegetables: { emoji: '🥦', label: 'Vegetables' },
    dairy:      { emoji: '🥛', label: 'Dairy' },
    bakery:     { emoji: '🍞', label: 'Bakery' },
    beverages:  { emoji: '☕', label: 'Beverages' },
    snacks:     { emoji: '🍪', label: 'Snacks' },
  };
  return cats.map(c => ({ id: c._id, ...(meta[c._id] || {}), count: c.count }));
};

// Check and reduce stock for an order (returns true/false)
productSchema.statics.reduceStock = async function (productId, qty) {
  const result = await this.findOneAndUpdate(
    { productId, stock: { $gte: qty } },
    { $inc: { stock: -qty } },
    { new: true },
  );
  if (result && result.stock === 0) {
    await this.updateOne({ productId }, { inStock: false });
  }
  return !!result;
};

// Restore stock when order is cancelled
productSchema.statics.restoreStock = async function (productId, qty) {
  await this.findOneAndUpdate(
    { productId },
    { $inc: { stock: qty }, $set: { inStock: true } },
  );
};

// ---- helper to map lean docs to frontend-compatible shape ----
function mapDoc(doc) {
  return {
    id: doc.productId,
    productId: doc.productId,
    name: doc.name,
    category: doc.category,
    price: doc.price,
    unit: doc.unit,
    emoji: doc.emoji,
    description: doc.description,
    inStock: doc.inStock,
    stock: doc.stock,
    rating: doc.rating,
    badge: doc.badge,
  };
}

module.exports = mongoose.model('Product', productSchema);
