/* ======================================================
   Checkout & Confirmation Components — FreshCart
   ====================================================== */

function renderCheckoutPage(cart) {
  const summaryItemsHtml = cart.items.map(item => `
    <div class="summary-item">
      <span class="summary-item-emoji">${item.product.emoji}</span>
      <span class="summary-item-name">${item.product.name}</span>
      <span class="summary-item-qty">×${item.quantity}</span>
      <span class="summary-item-price">${formatPrice(item.subtotal)}</span>
    </div>
  `).join('');

  const deliveryText = cart.deliveryFee === 0
    ? '<span class="free-delivery">FREE</span>'
    : formatPrice(cart.deliveryFee);

  return `
    <div class="checkout-page">
      <div class="back-link" data-action="go-home">← Back to shopping</div>
      <h1>Checkout</h1>
      <p class="checkout-subtitle">Complete your order details below</p>

      <div class="checkout-grid">
        <div class="checkout-form">
          <div class="form-section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Delivery Information
          </div>

          <div class="form-group">
            <label for="checkout-name">Full Name *</label>
            <input type="text" id="checkout-name" placeholder="John Doe" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="checkout-email">Email *</label>
              <input type="email" id="checkout-email" placeholder="john@example.com" required />
            </div>
            <div class="form-group">
              <label for="checkout-phone">Phone</label>
              <input type="tel" id="checkout-phone" placeholder="+1 (555) 123-4567" />
            </div>
          </div>
          <div class="form-group">
            <label for="checkout-address">Delivery Address *</label>
            <textarea id="checkout-address" placeholder="123 Main St, Apt 4B, City, State, ZIP" required></textarea>
          </div>

          <button class="place-order-btn" id="place-order-btn" data-action="place-order">
            Place Order — ${formatPrice(cart.total)}
          </button>
        </div>

        <div class="order-summary">
          <h3>Order Summary</h3>
          <div class="summary-items">${summaryItemsHtml}</div>
          <div class="cart-summary-row">
            <span>Subtotal</span><span>${formatPrice(cart.subtotal)}</span>
          </div>
          <div class="cart-summary-row">
            <span>Delivery</span><span>${deliveryText}</span>
          </div>
          <div class="cart-summary-row">
            <span>Tax</span><span>${formatPrice(cart.tax)}</span>
          </div>
          <div class="cart-summary-row total">
            <span>Total</span><span>${formatPrice(cart.total)}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderOrderConfirmation(order) {
  const itemEmojis = order.items.map(i => i.emoji).join(' ');
  const eta = formatDate(order.estimatedDelivery);

  return `
    <div class="confirmation-page">
      <div class="confirmation-icon">✓</div>
      <h1>Order Placed!</h1>
      <p class="order-id">Order ID: <span>#${order.id}</span></p>

      <div class="confirmation-eta">
        🕐 Estimated delivery by ${eta}
      </div>

      <div class="confirmation-details">
        <h3>Order Summary</h3>
        ${order.items.map(i => `
          <div class="confirmation-row">
            <span>${i.emoji} ${i.name} ×${i.quantity}</span>
            <span>${formatPrice(i.subtotal)}</span>
          </div>
        `).join('')}
        <div class="confirmation-row">
          <span>Delivery</span>
          <span>${order.deliveryFee === 0 ? 'FREE' : formatPrice(order.deliveryFee)}</span>
        </div>
        <div class="confirmation-row">
          <span>Tax</span>
          <span>${formatPrice(order.tax)}</span>
        </div>
        <div class="confirmation-row total">
          <span>Total Paid</span>
          <span>${formatPrice(order.total)}</span>
        </div>
      </div>

      <button class="continue-btn" data-action="go-home">Continue Shopping</button>
    </div>
  `;
}

function renderOrdersPage(orders) {
  if (!orders || orders.length === 0) {
    return `
      <div class="orders-page">
        <div class="back-link" data-action="go-home">← Back to shopping</div>
        <h1>My Orders</h1>
        <div class="orders-empty">
          <div class="orders-empty-icon">📋</div>
          <h3>No orders yet</h3>
          <p>Your order history will appear here after your first purchase.</p>
        </div>
      </div>
    `;
  }

  const orderCardsHtml = orders.map(order => `
    <div class="order-card">
      <div class="order-card-header">
        <span class="order-card-id">#${order.id}</span>
        <span class="order-card-status">${order.status}</span>
      </div>
      <div class="order-card-items">
        ${order.items.map(i => `<span title="${i.name}">${i.emoji}</span>`).join('')}
      </div>
      <div class="order-card-footer">
        <span>${timeAgo(order.createdAt)}</span>
        <span class="order-card-total">${formatPrice(order.total)}</span>
      </div>
    </div>
  `).join('');

  return `
    <div class="orders-page">
      <div class="back-link" data-action="go-home">← Back to shopping</div>
      <h1>My Orders</h1>
      ${orderCardsHtml}
    </div>
  `;
}
