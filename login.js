/* ── ShopPanel: login.js ── */
const BASE_URL = 'http://localhost:8081/api';

// Redirect to dashboard if already logged in
if (sessionStorage.getItem('shopanel_user')) {
  window.location.href = 'index.html';
}

// ── Restore remembered email ──
const remembered = localStorage.getItem('shopanel_email');
if (remembered) {
  document.getElementById('loginEmail').value = remembered;
  document.getElementById('rememberMe').checked = true;
}

// ── Toggle password visibility ──
document.getElementById('eyeBtn').addEventListener('click', () => {
  const inp = document.getElementById('loginPassword');
  const svg = document.getElementById('eyeSvg');
  const show = inp.type === 'password';
  inp.type = show ? 'text' : 'password';
  svg.innerHTML = show
    ? `<path d="M17.94 17.94A10 10 0 0 1 12 20C5 20 1 12 1 12a18 18 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9 9 0 0 1 12 4c7 0 11 8 11 8a18 18 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>`
    : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
});

// ── Alert helpers ──
function showAlert(msg, type = 'error') {
  const el = document.getElementById('loginAlert');
  el.textContent = msg;
  el.className = `alert ${type}`;
  el.style.display = 'block';
}
function hideAlert() { document.getElementById('loginAlert').style.display = 'none'; }

// ── Inline validation ──
function validateForm() {
  let ok = true;
  const email = document.getElementById('loginEmail').value.trim();
  const pwd   = document.getElementById('loginPassword').value;

  if (!email) {
    document.getElementById('emailErr').textContent = 'Email is required.';
    ok = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById('emailErr').textContent = 'Enter a valid email.';
    ok = false;
  } else {
    document.getElementById('emailErr').textContent = '';
  }

  if (!pwd) {
    document.getElementById('pwdErr').textContent = 'Password is required.';
    ok = false;
  } else if (pwd.length < 3) {
    document.getElementById('pwdErr').textContent = 'Password too short.';
    ok = false;
  } else {
    document.getElementById('pwdErr').textContent = '';
  }
  return ok;
}

['loginEmail','loginPassword'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => {
    document.getElementById(id === 'loginEmail' ? 'emailErr' : 'pwdErr').textContent = '';
    hideAlert();
  });
});

// ── Loading state ──
function setLoading(on) {
  const btn = document.getElementById('signinBtn');
  btn.disabled = on;
  btn.querySelector('.btn-label').style.display = on ? 'none' : 'inline';
  document.getElementById('spinEl').style.display  = on ? 'inline-flex' : 'none';
}

// ── Form submit ──
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert();
  if (!validateForm()) return;

  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const remember = document.getElementById('rememberMe').checked;

  setLoading(true);

  try {
    /*
     * NOTE: Your backend has no /api/auth/login endpoint yet.
     * This code first tries POST /api/auth/login (ideal, JWT-style).
     * If that 404s, it falls back to matching against GET /api/users/all.
     *
     * TO ADD A PROPER LOGIN ENDPOINT:
     * POST /api/auth/login  { email, password }  → return User object
     */
    let user = null;

    // ── Try dedicated login endpoint ──
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) user = await res.json();
    } catch (_) { /* endpoint not present */ }

    // ── Fallback: match from users list ──
    if (!user) {
      const res = await fetch(`${BASE_URL}/users/all`);
      if (!res.ok) throw new Error('Server unreachable');
      const users = await res.json();
      user = users.find(
        u => u.email?.toLowerCase() === email.toLowerCase() && u.password === password
      );
    }

    if (!user) {
      setLoading(false);
      showAlert('Invalid email or password. Please try again.');
      document.getElementById('loginPassword').value = '';
      return;
    }

    // ── Store session ──
    if (remember) localStorage.setItem('shopanel_email', email);
    else           localStorage.removeItem('shopanel_email');

    sessionStorage.setItem('shopanel_user', JSON.stringify({
      id: user.id, name: user.name, email: user.email
    }));

    showAlert(`Welcome, ${user.name || 'Admin'}! Redirecting…`, 'success');
    setTimeout(() => { window.location.href = 'index.html'; }, 900);

  } catch (err) {
    console.error(err);
    showAlert('Could not connect to server. Is your backend running?');
    setLoading(false);
  }
});