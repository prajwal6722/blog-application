/* ─────────────────────────────────────────────
   ShopPanel — app.js
   All API calls wired to the Spring Boot backend
───────────────────────────────────────────── */

const BASE_URL = 'http://localhost:8081/api';

// ── Navigation ────────────────────────────────
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    const target = btn.dataset.section;
    document.getElementById(target).classList.add('active');
    loadSection(target);
  });
});

function loadSection(section) {
  if (section === 'users')    fetchUsers();
  if (section === 'products') fetchProducts();
  if (section === 'orders')   fetchOrders();
}

// ── Toast ─────────────────────────────────────
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3200);
}

// ── Modal helpers ─────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
  backdrop.addEventListener('click', e => {
    if (e.target === backdrop) backdrop.classList.remove('open');
  });
});

// ── Generic fetch wrapper ─────────────────────
async function apiRequest(url, options = {}) {
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (res.status === 204 || options.method === 'DELETE') return null;
    return await res.json();
  } catch (err) {
    console.error(err);
    throw err;
  }
}

/* ══════════════════════════════════════════════
   USERS
══════════════════════════════════════════════ */

async function fetchUsers() {
  const grid = document.getElementById('usersGrid');
  grid.innerHTML = skeletons(3);
  try {
    const users = await apiRequest(`${BASE_URL}/users/all`);
    renderUsers(users);
  } catch {
    grid.innerHTML = errorState('Could not load users');
  }
}

function renderUsers(users) {
  const grid = document.getElementById('usersGrid');
  if (!users || users.length === 0) {
    grid.innerHTML = emptyState('👤', 'No users registered yet');
    return;
  }
  grid.innerHTML = users.map(u => `
    <div class="card">
      <span class="card-id">#${u.id}</span>
      <div class="card-title">${esc(u.name)}</div>
      <div class="card-meta">
        <span>📧 <strong>${esc(u.email)}</strong></span>
        ${u.phone ? `<span>📞 <strong>${esc(u.phone)}</strong></span>` : ''}
      </div>
      <div class="card-footer">
        <button class="btn-danger" onclick="deleteUser(${u.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

async function deleteUser(id) {
  if (!confirm(`Delete user #${id}?`)) return;
  try {
    await apiRequest(`${BASE_URL}/users/delete/${id}`, { method: 'DELETE' });
    showToast('User deleted successfully');
    fetchUsers();
  } catch {
    showToast('Failed to delete user', 'error');
  }
}

document.getElementById('userForm').addEventListener('submit', async e => {
  e.preventDefault();
  const payload = {
    name:     document.getElementById('userName').value.trim(),
    email:    document.getElementById('userEmail').value.trim(),
    password: document.getElementById('userPassword').value,
    phone:    document.getElementById('userPhone').value.trim()
  };
  try {
    await apiRequest(`${BASE_URL}/users/`, { method: 'POST', body: JSON.stringify(payload) });
    showToast('User registered!');
    closeModal('userModal');
    e.target.reset();
    fetchUsers();
  } catch {
    showToast('Failed to register user', 'error');
  }
});


/* ══════════════════════════════════════════════
   PRODUCTS
══════════════════════════════════════════════ */

async function fetchProducts() {
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = skeletons(3);
  try {
    const products = await apiRequest(`${BASE_URL}/products/all`);
    renderProducts(products);
  } catch {
    grid.innerHTML = errorState('Could not load products');
  }
}

function renderProducts(products) {
  const grid = document.getElementById('productsGrid');
  if (!products || products.length === 0) {
    grid.innerHTML = emptyState('📦', 'No products in catalogue');
    return;
  }
  grid.innerHTML = products.map(p => `
    <div class="card">
      <span class="card-id">#${p.id}</span>
      <div class="card-title">${esc(p.name)}</div>
      <div class="card-meta">
        ${p.description ? `<span>${esc(p.description)}</span>` : ''}
        <span>💰 <strong>₹${p.price}</strong></span>
        ${p.stock !== undefined ? `<span>📊 Stock: <strong>${p.stock}</strong></span>` : ''}
      </div>
      <div class="card-footer">
        <span class="badge">In Stock</span>
      </div>
    </div>
  `).join('');
}

document.getElementById('productForm').addEventListener('submit', async e => {
  e.preventDefault();
  const payload = {
    name:        document.getElementById('productName').value.trim(),
    description: document.getElementById('productDescription').value.trim(),
    price:       parseFloat(document.getElementById('productPrice').value),
    stock:       parseInt(document.getElementById('productStock').value) || 0
  };
  try {
    await apiRequest(`${BASE_URL}/products/add`, { method: 'POST', body: JSON.stringify(payload) });
    showToast('Product added!');
    closeModal('productModal');
    e.target.reset();
    fetchProducts();
  } catch {
    showToast('Failed to add product', 'error');
  }
});


/* ══════════════════════════════════════════════
   ORDERS
══════════════════════════════════════════════ */

async function fetchOrders() {
  const grid = document.getElementById('ordersGrid');
  grid.innerHTML = skeletons(3);
  try {
    const orders = await apiRequest(`${BASE_URL}/orders/all`);
    renderOrders(orders);
  } catch {
    grid.innerHTML = errorState('Could not load orders');
  }
}

function renderOrders(orders) {
  const grid = document.getElementById('ordersGrid');
  if (!orders || orders.length === 0) {
    grid.innerHTML = emptyState('🧾', 'No orders placed yet');
    return;
  }
  grid.innerHTML = orders.map(o => `
    <div class="card">
      <span class="card-id">Order #${o.id}</span>
      <div class="card-title">₹${o.totalAmount}</div>
      <div class="card-meta">
        <span>👤 User ID: <strong>${o.userId ?? (o.user?.id ?? '—')}</strong></span>
        <span>📦 Product ID: <strong>${o.productId ?? (o.product?.id ?? '—')}</strong></span>
        <span>🔢 Qty: <strong>${o.quantity}</strong></span>
      </div>
      <div class="card-footer">
        <button class="btn-danger" onclick="deleteOrder(${o.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

async function deleteOrder(id) {
  if (!confirm(`Delete order #${id}?`)) return;
  try {
    await apiRequest(`${BASE_URL}/orders/delete/${id}`, { method: 'DELETE' });
    showToast('Order deleted');
    fetchOrders();
  } catch {
    showToast('Failed to delete order', 'error');
  }
}

document.getElementById('orderForm').addEventListener('submit', async e => {
  e.preventDefault();
  const payload = {
    userId:      parseInt(document.getElementById('orderUserId').value),
    productId:   parseInt(document.getElementById('orderProductId').value),
    quantity:    parseInt(document.getElementById('orderQuantity').value),
    totalAmount: parseFloat(document.getElementById('orderTotal').value)
  };
  try {
    await apiRequest(`${BASE_URL}/orders/add`, { method: 'POST', body: JSON.stringify(payload) });
    showToast('Order placed!');
    closeModal('orderModal');
    e.target.reset();
    fetchOrders();
  } catch {
    showToast('Failed to place order', 'error');
  }
});


/* ══════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════ */

function skeletons(n) {
  return Array.from({ length: n }, () => `<div class="skeleton-card"></div>`).join('');
}

function emptyState(icon, msg) {
  return `<div class="empty"><span class="empty-icon">${icon}</span>${msg}</div>`;
}

function errorState(msg) {
  return `<div class="empty"><span class="empty-icon">⚠️</span>${msg}</div>`;
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Initial load ──────────────────────────────
fetchUsers();