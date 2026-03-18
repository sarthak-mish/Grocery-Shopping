/* ======================================================
   Product Card Component — FreshCart
   ====================================================== */

function renderProductCard(product, cartQty = 0) {
  const badgeHtml = product.badge
    ? `<div class="card-badges"><span class="card-badge ${product.badge}">${product.badge}</span></div>`
    : '';

  const stockClass = product.inStock ? '' : ' out-of-stock';

  const actionHtml = cartQty > 0
    ? `
      <div class="qty-controls">
        <button class="qty-btn" data-action="decrease" data-id="${product.id}">−</button>
        <span class="qty-value">${cartQty}</span>
        <button class="qty-btn" data-action="increase" data-id="${product.id}">+</button>
      </div>
    `
    : `
      <button class="add-btn" data-action="add" data-id="${product.id}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add
      </button>
    `;

  return `
    <article class="product-card${stockClass}" data-product-id="${product.id}">
      ${badgeHtml}
      <div class="card-image ${product.category}">
        <span class="emoji-display">${product.emoji}</span>
      </div>
      <div class="card-body">
        <span class="card-category">${product.category}</span>
        <h3 class="card-name">${product.name}</h3>
        <p class="card-desc">${product.description}</p>
        <div class="card-rating">
          <span class="stars">${renderStars(product.rating)}</span>
          <span class="rating-value">${product.rating}</span>
        </div>
        <div class="card-footer">
          <span class="card-price">${formatPrice(product.price)} <span class="unit">/ ${product.unit}</span></span>
          ${actionHtml}
        </div>
      </div>
    </article>
  `;
}
