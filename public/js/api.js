/* ======================================================
   API Client — FreshCart
   ====================================================== */
const API = {
  base: '/api',

  async request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${this.base}${path}`, {
        headers,
        ...options,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      return data;
    } catch (err) {
      console.error(`API Error [${path}]:`, err);
      throw err;
    }
  },

  // Auth
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  async getProfile() {
    return this.request('/auth/profile');
  },

  async updateProfile(userData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  },

  // Products
  async getProducts(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/products${qs ? '?' + qs : ''}`);
  },

  async getCategories() {
    return this.request('/products/categories');
  },

  // Cart
  async getCart() {
    return this.request('/cart');
  },

  async addToCart(productId, quantity = 1) {
    return this.request('/cart/add', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
  },

  async updateCartItem(productId, quantity) {
    return this.request('/cart/update', {
      method: 'PUT',
      body: JSON.stringify({ productId, quantity }),
    });
  },

  async removeFromCart(productId) {
    return this.request(`/cart/remove/${productId}`, { method: 'DELETE' });
  },

  async clearCart() {
    return this.request('/cart/clear', { method: 'DELETE' });
  },

  // Orders
  async placeOrder(customer) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify({ customer }),
    });
  },

  async getOrders() {
    return this.request('/orders');
  },
};
