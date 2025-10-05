const form = document.getElementById('loginForm');
const errorDiv = document.getElementById('error');
const loginBtn = document.getElementById('loginBtn');

// On load: redirect only if actually authenticated
(async () => {
  try {
    const res = await fetch('/api/auth/session', { credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.authenticated === true) {
      location.replace('/dashboard.html'); // replace avoids back-button loop
    }
  } catch {
    // stay on login page
  }
})();

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    return showError('Please enter both email and password');
  }

  loginBtn.disabled = true;
  loginBtn.textContent = 'Signing in…';
  errorDiv.classList.remove('show');

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // keep the session cookie
      body: JSON.stringify({ email, password })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Login failed');

    location.replace('/dashboard.html');
  } catch (err) {
    showError(err.message || 'Login failed. Please check your credentials.');
    loginBtn.disabled = false;
    loginBtn.textContent = 'Sign In';
  }
});

function showError(message) {
  errorDiv.textContent = message;
  errorDiv.classList.add('show');
}
