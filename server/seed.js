/**
 * Seed script — populates the MongoDB with initial product data.
 *
 * Usage:
 *   node server/seed.js          — seeds only if products collection is empty
 *   node server/seed.js --force  — drops existing products and re-seeds
 */

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Product = require('./models/Product');
const productsData = require('./data/products.json');

async function seed() {
  await connectDB();

  const force = process.argv.includes('--force');
  const existing = await Product.countDocuments();

  if (existing > 0 && !force) {
    console.log(`\n  ℹ️  Database already has ${existing} products. Use --force to re-seed.\n`);
    process.exit(0);
  }

  if (force && existing > 0) {
    await Product.deleteMany({});
    console.log(`  🗑️  Cleared ${existing} existing products.`);
  }

  // Map JSON "id" field → "productId" for the Mongoose schema
  const docs = productsData.map(p => ({
    productId:   p.id,
    name:        p.name,
    category:    p.category,
    price:       p.price,
    unit:        p.unit,
    emoji:       p.emoji,
    description: p.description,
    inStock:     p.inStock,
    stock:       p.inStock ? 100 : 0,
    rating:      p.rating,
    badge:       p.badge,
  }));

  const inserted = await Product.insertMany(docs);
  console.log(`  🌱  Seeded ${inserted.length} products into grocery-app database.\n`);

  // Print summary by category
  const categories = await Product.getCategories();
  categories.forEach(c => {
    console.log(`     ${c.emoji}  ${c.label}: ${c.count} products`);
  });
  console.log('');

  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
