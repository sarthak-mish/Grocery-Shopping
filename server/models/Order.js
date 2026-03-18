const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name:      { type: String, required: true },
  emoji:     { type: String, default: '🛒' },
  price:     { type: Number, required: true },
  unit:      { type: String, required: true },
  quantity:  { type: Number, required: true, min: 1 },
  subtotal:  { type: Number, required: true },
}, { _id: false });

const customerSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  email:   { type: String, required: true },
  phone:   { type: String, default: '' },
  address: { type: String, required: true },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId:           { type: String, required: true, unique: true, index: true },
  userId:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items:             [orderItemSchema],
  customer:          customerSchema,
  subtotal:          { type: Number, required: true },
  deliveryFee:       { type: Number, required: true },
  tax:               { type: Number, required: true },
  total:             { type: Number, required: true },
  status:            { type: String, default: 'confirmed', enum: ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] },
  estimatedDelivery: { type: Date },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform(_doc, ret) {
      ret.id = ret.orderId;
      ret.createdAt = ret.createdAt?.toISOString?.() || ret.createdAt;
      ret.estimatedDelivery = ret.estimatedDelivery?.toISOString?.() || ret.estimatedDelivery;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

// ---------- Statics ----------

orderSchema.statics.createOrder = async function (items, customer, summary, userId) {
  const order = await this.create({
    orderId: uuidv4().slice(0, 8).toUpperCase(),
    userId,
    items: items.map(i => ({
      productId: i.productId,
      name:      i.product.name,
      emoji:     i.product.emoji,
      price:     i.product.price,
      unit:      i.product.unit,
      quantity:  i.quantity,
      subtotal:  i.subtotal,
    })),
    customer: {
      name:    customer.name,
      email:   customer.email,
      phone:   customer.phone || '',
      address: customer.address,
    },
    subtotal:          summary.subtotal,
    deliveryFee:       summary.deliveryFee,
    tax:               summary.tax,
    total:             summary.total,
    status:            'confirmed',
    estimatedDelivery: new Date(Date.now() + 45 * 60 * 1000),
  });
  return order.toJSON();
};

orderSchema.statics.getAll = function () {
  return this.find().sort({ createdAt: -1 }).lean().then(docs =>
    docs.map(d => ({ ...d, id: d.orderId, _id: undefined, __v: undefined }))
  );
};

orderSchema.statics.getById = function (id) {
  return this.findOne({ orderId: id }).lean().then(d =>
    d ? { ...d, id: d.orderId, _id: undefined, __v: undefined } : null
  );
};

orderSchema.statics.getByUserId = function (userId) {
  return this.find({ userId }).sort({ createdAt: -1 }).lean().then(docs =>
    docs.map(d => ({ ...d, id: d.orderId, _id: undefined, __v: undefined }))
  );
};

module.exports = mongoose.model('Order', orderSchema);
