/* ======================================================
   Cart View Component — FreshCart
   ====================================================== */

function renderCartBody(cart) {
  if (!cart || cart.items.length === 0) {
    return `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Browse our fresh selection and add items to get started.</p>
        <button class="shop-btn" data-action="close-cart">Start Shopping</button>
      </div>
    `;
  }

  return cart.items.map(item => `
    <div class="cart-item" data-cart-item="${item.productId}">
      <div class="cart-item-emoji">${item.product.emoji}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.product.name}</div>
        <div class="cart-item-price">${formatPrice(item.product.price)} / ${item.product.unit}</div>
        <div class="cart-item-qty qty-controls">
          <button class="qty-btn" data-action="cart-decrease" data-id="${item.productId}">−</button>
          <span class="qty-value">${item.quantity}</span>
          <button class="qty-btn" data-action="cart-increase" data-id="${item.productId}">+</button>
        </div>
      </div>
      <div class="cart-item-actions">
        <span class="cart-item-subtotal">${formatPrice(item.subtotal)}</span>
        <button class="cart-item-remove" data-action="cart-remove" data-id="${item.productId}">Remove</button>
      </div>
    </div>
  `).join('');
}

function renderCartFooter(cart) {
  if (!cart || cart.items.length === 0) return '';

  const deliveryText = cart.deliveryFee === 0
    ? '<span class="free-delivery">FREE</span>'
    : formatPrice(cart.deliveryFee);

  const deliveryNote = cart.deliveryFee > 0
    ? `<p class="delivery-note">Add ${formatPrice(35 - cart.subtotal)} more for free delivery</p>`
    : '<p class="delivery-note">🎉 You qualify for free delivery!</p>';

  return `
    <div class="cart-summary-row">
      <span>Subtotal (${cart.itemCount} items)</span>
      <span>${formatPrice(cart.subtotal)}</span>
    </div>
    <div class="cart-summary-row">
      <span>Delivery</span>
      <span>${deliveryText}</span>
    </div>
    <div class="cart-summary-row">
      <span>Tax</span>
      <span>${formatPrice(cart.tax)}</span>
    </div>
    ${deliveryNote}
    <div class="cart-summary-row total">
      <span>Total</span>
      <span>${formatPrice(cart.total)}</span>
    </div>
    <button class="checkout-btn" data-action="go-checkout">Proceed to Checkout</button>
  `;
}
