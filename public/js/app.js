/* ======================================================
   FreshCart — Main Application Controller
   ====================================================== */

(function () {
  'use strict';

  // ---- State ----
  let products = [];
  let categories = [];
  let cart = { items: [], itemCount: 0, subtotal: 0, deliveryFee: 0, tax: 0, total: 0 };
  let selectedCategory = 'all';
  let searchQuery = '';
  let currentView = 'home'; // home | checkout | confirmation | orders | login | signup | profile
  let currentUser = null;

  // ---- DOM refs ----
  const mainEl = document.getElementById('main-content');
  const cartBody = document.getElementById('cart-body');
  const cartFooter = document.getElementById('cart-footer');
  const cartBadge = document.getElementById('cart-badge');
  const cartSidebar = document.getElementById('cart-sidebar');
  const cartOverlay = document.getElementById('cart-overlay');
  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear');
  const navbar = document.getElementById('navbar');

  // ---- Init ----
  async function init() {
    setupEventListeners();
    await checkAuth();
    updateAuthButtons();
    renderHome(true); // skeleton
    await Promise.all([loadProducts(), loadCategories(), loadCart()]);
    renderHome();
  }

  // ---- Data loading ----
  async function loadProducts(params = {}) {
    try {
      const data = await API.getProducts(params);
      products = data.products;
    } catch (e) {
      showToast('Failed to load products', 'error');
    }
  }

  async function loadCategories() {
    try {
      const data = await API.getCategories();
      categories = data.categories;
    } catch (e) {
      console.error(e);
    }
  }

  async function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) {
      currentUser = null;
      return;
    }

    try {
      const data = await API.getProfile();
      currentUser = data.user;
    } catch (e) {
      // Token invalid, clear it
      localStorage.removeItem('authToken');
      currentUser = null;
    }
  }

  async function loadCart() {
    try {
      const data = await API.getCart();
      cart = data.cart;
      updateCartBadge();
    } catch (e) {
      console.error(e);
    }
  }

  // ---- Views ----
  function renderHome(skeleton = false) {
    currentView = 'home';

    const heroHtml = `
      <section class="hero">
        <div class="hero-content">
          <h1>Fresh Groceries,<br><span class="gradient-text">Delivered to Your Door</span></h1>
          <p>Handpicked produce, premium dairy, artisan bakery, and more — all at your fingertips.</p>
          <div class="hero-badges">
            <div class="hero-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              45-min delivery
            </div>
            <div class="hero-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Quality guaranteed
            </div>
            <div class="hero-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
              Free delivery $35+
            </div>
          </div>
        </div>
      </section>
    `;

    const categoriesHtml = `
      <section class="categories-section">
        <div class="categories-wrapper">
          <div class="categories-scroll" id="categories-scroll">
            <button class="category-pill ${selectedCategory === 'all' ? 'active' : ''}" data-category="all">
              <span class="cat-emoji">🏪</span> All
              <span class="cat-count">${skeleton ? '—' : products.length}</span>
            </button>
            ${categories.map(cat => `
              <button class="category-pill ${selectedCategory === cat.id ? 'active' : ''}" data-category="${cat.id}">
                <span class="cat-emoji">${cat.emoji}</span> ${cat.label}
                <span class="cat-count">${cat.count}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </section>
    `;

    const filteredProducts = getFilteredProducts();
    const productGridHtml = skeleton
      ? renderSkeletons(8)
      : filteredProducts.length > 0
        ? `<div class="product-grid">${filteredProducts.map(p => renderProductCard(p, getCartQty(p.id))).join('')}</div>`
        : `<div class="cart-empty" style="padding: 60px 20px;">
            <div class="cart-empty-icon">🔍</div>
            <h3>No products found</h3>
            <p>${searchQuery ? `No results for "${searchQuery}"` : 'No products in this category.'}</p>
          </div>`;

    const title = searchQuery
      ? `Results for "${searchQuery}"`
      : selectedCategory !== 'all'
        ? categories.find(c => c.id === selectedCategory)?.label || 'Products'
        : 'All Products';

    const productsHtml = `
      <section class="products-section">
        <div class="products-wrapper">
          <div class="section-header">
            <h2>${title}</h2>
            <span class="product-count">${skeleton ? '' : filteredProducts.length + ' items'}</span>
          </div>
          ${productGridHtml}
        </div>
      </section>
    `;

    mainEl.innerHTML = heroHtml + categoriesHtml + productsHtml;
  }

  function renderCheckout() {
    if (cart.items.length === 0) {
      showToast('Your cart is empty', 'error');
      return;
    }
    currentView = 'checkout';
    closeCart();
    mainEl.innerHTML = renderCheckoutPage(cart);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderConfirmation(order) {
    currentView = 'confirmation';
    mainEl.innerHTML = renderOrderConfirmation(order);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function renderOrders() {
    if (!currentUser) {
      showToast('Please login to view your orders', 'error');
      renderLogin();
      return;
    }
    currentView = 'orders';
    closeCart();
    try {
      const data = await API.getOrders();
      mainEl.innerHTML = renderOrdersPage(data.orders);
    } catch (e) {
      showToast('Failed to load orders', 'error');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderLogin() {
    currentView = 'login';
    closeCart();
    mainEl.innerHTML = renderLoginPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderSignup() {
    currentView = 'signup';
    closeCart();
    mainEl.innerHTML = renderSignupPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function renderProfile() {
    currentView = 'profile';
    closeCart();
    try {
      const data = await API.getProfile();
      mainEl.innerHTML = renderProfilePage(data.user);
    } catch (e) {
      showToast('Failed to load profile', 'error');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---- Helpers ----
  function getFilteredProducts() {
    let result = products;
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    return result;
  }

  function getCartQty(productId) {
    const item = cart.items.find(i => i.productId === productId);
    return item ? item.quantity : 0;
  }

  function updateCartBadge() {
    if (cart.itemCount > 0) {
      cartBadge.textContent = cart.itemCount;
      cartBadge.classList.remove('hidden');
    } else {
      cartBadge.classList.add('hidden');
    }
  }

  function updateCartSidebar() {
    cartBody.innerHTML = renderCartBody(cart);
    cartFooter.innerHTML = renderCartFooter(cart);
  }

  function updateAuthButtons() {
    const authButtonsEl = document.getElementById('auth-buttons');
    if (!authButtonsEl) return;

    if (currentUser) {
      authButtonsEl.innerHTML = `
        <div class="user-menu">
          <span class="user-greeting">Hi, ${currentUser.name.split(' ')[0]}</span>
          <button class="nav-btn profile-btn" data-action="go-profile" title="Profile">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </button>
          <button class="nav-btn logout-btn" data-action="logout" title="Logout">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      `;
    } else {
      authButtonsEl.innerHTML = `
        <button class="nav-btn login-btn" data-action="go-login" title="Login">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10,17 15,12 10,7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
          <span class="nav-btn-label">Login</span>
        </button>
        <button class="nav-btn signup-btn" data-action="go-signup" title="Sign Up">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
          <span class="nav-btn-label">Sign Up</span>
        </button>
      `;
    }
  }

  function openCart() {
    cartSidebar.classList.remove('hidden');
    cartOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    updateCartSidebar();
  }

  function closeCart() {
    cartSidebar.classList.add('hidden');
    cartOverlay.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function refreshProductGrid() {
    if (currentView !== 'home') return;
    const grid = document.querySelector('.product-grid');
    if (!grid) return;
    const filtered = getFilteredProducts();
    grid.innerHTML = filtered.map(p => renderProductCard(p, getCartQty(p.id))).join('');
  }

  // ---- Cart actions ----
  async function addToCart(productId) {
    try {
      const data = await API.addToCart(productId);
      cart = data.cart;
      updateCartBadge();
      refreshProductGrid();
      updateCartSidebar();
      const product = products.find(p => p.id === productId);
      showToast(`${product?.emoji || '🛒'} ${product?.name || 'Item'} added to cart`);
    } catch (e) {
      showToast(e.message, 'error');
    }
  }

  async function updateCartQty(productId, delta) {
    const item = cart.items.find(i => i.productId === productId);
    if (!item) return;
    const newQty = item.quantity + delta;
    try {
      if (newQty <= 0) {
        const data = await API.removeFromCart(productId);
        cart = data.cart;
        showToast('Item removed from cart', 'info');
      } else {
        const data = await API.updateCartItem(productId, newQty);
        cart = data.cart;
      }
      updateCartBadge();
      refreshProductGrid();
      updateCartSidebar();
    } catch (e) {
      showToast(e.message, 'error');
    }
  }

  async function removeFromCart(productId) {
    try {
      const data = await API.removeFromCart(productId);
      cart = data.cart;
      updateCartBadge();
      refreshProductGrid();
      updateCartSidebar();
      showToast('Item removed', 'info');
    } catch (e) {
      showToast(e.message, 'error');
    }
  }

  async function placeOrder() {
    if (!currentUser) {
      showToast('Please login to place an order', 'error');
      renderLogin();
      return;
    }
    const email = document.getElementById('checkout-email')?.value.trim();
    const phone = document.getElementById('checkout-phone')?.value.trim();
    const address = document.getElementById('checkout-address')?.value.trim();

    // Validation
    let valid = true;
    document.querySelectorAll('.form-error').forEach(el => el.remove());
    document.querySelectorAll('.form-group input.error, .form-group textarea.error').forEach(el => el.classList.remove('error'));

    function showFieldError(id, msg) {
      valid = false;
      const el = document.getElementById(id);
      if (el) {
        el.classList.add('error');
        const err = document.createElement('div');
        err.className = 'form-error';
        err.textContent = msg;
        el.parentNode.appendChild(err);
      }
    }

    if (!name) showFieldError('checkout-name', 'Name is required');
    if (!email) showFieldError('checkout-email', 'Email is required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) showFieldError('checkout-email', 'Enter a valid email');
    if (!address) showFieldError('checkout-address', 'Address is required');

    if (!valid) return;

    const btn = document.getElementById('place-order-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Placing order...'; }

    try {
      const data = await API.placeOrder({ name, email, phone, address });
      cart = { items: [], itemCount: 0, subtotal: 0, deliveryFee: 0, tax: 0, total: 0 };
      updateCartBadge();
      renderConfirmation(data.order);
      showToast('🎉 Order placed successfully!');
    } catch (e) {
      showToast(e.message, 'error');
      if (btn) { btn.disabled = false; btn.textContent = `Place Order — ${formatPrice(cart.total)}`; }
    }
  }

  async function login() {
    const email = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value.trim();

    if (!email || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    const btn = document.getElementById('login-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Logging in...'; }

    try {
      const data = await API.login({ email, password });
      localStorage.setItem('authToken', data.token);
      currentUser = data.user;
      updateAuthButtons();
      showToast('Welcome back!');
      renderHome();
    } catch (e) {
      showToast(e.message, 'error');
      if (btn) { btn.disabled = false; btn.textContent = 'Login'; }
    }
  }

  async function signup() {
    const name = document.getElementById('signup-name')?.value.trim();
    const email = document.getElementById('signup-email')?.value.trim();
    const password = document.getElementById('signup-password')?.value.trim();
    const phone = document.getElementById('signup-phone')?.value.trim();
    const address = document.getElementById('signup-address')?.value.trim();

    if (!name || !email || !password) {
      showToast('Please fill in required fields', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    const btn = document.getElementById('signup-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Creating account...'; }

    try {
      const data = await API.register({ name, email, password, phone, address });
      localStorage.setItem('authToken', data.token);
      currentUser = data.user;
      updateAuthButtons();
      showToast('Account created successfully!');
      renderHome();
    } catch (e) {
      showToast(e.message, 'error');
      if (btn) { btn.disabled = false; btn.textContent = 'Sign Up'; }
    }
  }

  async function updateProfile() {
    const name = document.getElementById('profile-name')?.value.trim();
    const phone = document.getElementById('profile-phone')?.value.trim();
    const address = document.getElementById('profile-address')?.value.trim();

    if (!name) {
      showToast('Name is required', 'error');
      return;
    }

    const btn = document.getElementById('profile-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Updating...'; }

    try {
      const data = await API.updateProfile({ name, phone, address });
      currentUser = data.user;
      showToast('Profile updated successfully!');
      renderProfile();
    } catch (e) {
      showToast(e.message, 'error');
      if (btn) { btn.disabled = false; btn.textContent = 'Update Profile'; }
    }
  }

  function logout() {
    localStorage.removeItem('authToken');
    currentUser = null;
    updateAuthButtons();
    showToast('Logged out successfully');
    renderHome();
  }

  // ---- Event listeners ----
  function setupEventListeners() {
    // Global click delegation
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;

      const action = target.dataset.action;
      const id = target.dataset.id;

      switch (action) {
        case 'add':          addToCart(id); break;
        case 'increase':     updateCartQty(id, 1); break;
        case 'decrease':     updateCartQty(id, -1); break;
        case 'cart-increase': updateCartQty(id, 1); break;
        case 'cart-decrease': updateCartQty(id, -1); break;
        case 'cart-remove':  removeFromCart(id); break;
        case 'close-cart':   closeCart(); break;
        case 'go-checkout':  renderCheckout(); break;
        case 'place-order':  placeOrder(); break;
        case 'login':        login(); break;
        case 'signup':       signup(); break;
        case 'update-profile': updateProfile(); break;
        case 'logout':       logout(); break;
        case 'go-login':     renderLogin(); break;
        case 'go-signup':    renderSignup(); break;
        case 'go-profile':   renderProfile(); break;
        case 'go-home':
          selectedCategory = 'all';
          searchQuery = '';
          searchInput.value = '';
          searchClear.classList.add('hidden');
          renderHome(true);
          loadProducts().then(() => renderHome());
          window.scrollTo({ top: 0, behavior: 'smooth' });
          break;
      }
    });

    // Category pills
    document.addEventListener('click', (e) => {
      const pill = e.target.closest('.category-pill');
      if (!pill) return;
      selectedCategory = pill.dataset.category;
      renderHome();
    });

    // Cart button
    document.getElementById('cart-btn').addEventListener('click', openCart);
    document.getElementById('cart-close').addEventListener('click', closeCart);
    document.getElementById('cart-overlay').addEventListener('click', closeCart);

    // Orders button
    document.getElementById('orders-btn').addEventListener('click', renderOrders);

    // Logo → home
    document.getElementById('logo-link').addEventListener('click', (e) => {
      e.preventDefault();
      selectedCategory = 'all';
      searchQuery = '';
      searchInput.value = '';
      searchClear.classList.add('hidden');
      renderHome(true);
      loadProducts().then(() => renderHome());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Search
    const debouncedSearch = debounce(() => {
      searchQuery = searchInput.value.trim();
      searchClear.classList.toggle('hidden', !searchQuery);
      if (currentView !== 'home') {
        currentView = 'home';
        renderHome();
      } else {
        renderHome();
      }
    }, 250);

    searchInput.addEventListener('input', debouncedSearch);
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      searchClear.classList.add('hidden');
      renderHome();
      searchInput.focus();
    });

    // Navbar scroll shadow
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });

    // Keyboard: Escape closes cart
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeCart();
    });
  }

  // ---- Start ----
  init();
})();
