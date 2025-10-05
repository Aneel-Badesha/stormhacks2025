const API_BASE = 'http://localhost:5000/api';
let currentCompanyId = null;
let currentCompanyName = '';
let allUsers = [];

// Initialize - check auth and load company
async function init() {
  try {
    const res = await fetch('/api/auth/session', {
      credentials: 'include'
    });

    const data = await res.json().catch(() => ({ authenticated: false }));
    
    // Check if actually authenticated
    if (!res.ok || !data.authenticated || !data.company) {
      location.replace('/');
      return;
    }

    currentCompanyId = data.company.id;
    currentCompanyName = data.company.name;
    document.getElementById('companyName').textContent = `🎯 ${data.company.name}`;

    // Load data
    loadData();
  } catch (err) {
    console.error('Auth error:', err);
    location.replace('/');
  }
}

// Logout function
window.logout = async () => {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  } catch (_) {
    // ignore network errors on logout
  }
  location.replace('/');
};

// Alternative logout (commented out)
// window.logout = async () => {
//   await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
//     .then(res => res.json())
//     .then(data => {
//       if (data.success) {
//         window.location.replace(data.redirect);
//       }
//     });
// };

// Load stats and users for current company
async function loadData() {
  if (!currentCompanyId) return;
  
  try {
    // Load stats
    const statsRes = await fetch('/api/stats', {
      credentials: 'include'
    });
    const stats = await statsRes.json();
    
    document.getElementById('totalUsers').textContent = stats.total_users;
    document.getElementById('totalScans').textContent = stats.total_scans;
    document.getElementById('closeToReward').textContent = stats.close_to_reward;
    
    // Load users
    const usersRes = await fetch('/api/users', {
      credentials: 'include'
    });
    allUsers = await usersRes.json();
    
    renderUsers(allUsers);
  } catch (err) {
    console.error('Error loading data:', err);
  }
}

// Render users table
function renderUsers(users) {
  const tbody = document.getElementById('usersBody');
  
  if (!users || users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No users found</td></tr>';
    return;
  }
  
  tbody.innerHTML = users.map(u => {
    const progress = (u.score / u.target_score) * 100;
    const isComplete = u.score >= u.target_score;
    const isClose = u.score >= u.target_score * 0.8;
    
    let badge = '';
    if (isComplete) badge = '<span class="badge badge-success">Reward Ready!</span>';
    else if (isClose) badge = '<span class="badge badge-warning">Almost there</span>';
    else badge = '<span class="badge badge-info">In Progress</span>';
    
    const lastScan = u.last_scan_at 
      ? new Date(u.last_scan_at).toLocaleString()
      : 'Never';
    
    return `
      <tr>
        <td><strong>${u.full_name || 'Unknown'}</strong></td>
        <td>${u.email}</td>
        <td>${u.phone || '-'}</td>
        <td>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
          </div>
        </td>
        <td>${u.score} / ${u.target_score} ${badge}</td>
        <td>${lastScan}</td>
        <td>
          <button onclick="addScan(${u.id})">+1 Scan</button>
          <button class="secondary" onclick="resetReward(${u.id})">Reset</button>
        </td>
      </tr>
    `;
  }).join('');
}

// Search users
document.getElementById('searchUsers').addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  const filtered = allUsers.filter(u => 
    (u.full_name || '').toLowerCase().includes(query) ||
    u.email.toLowerCase().includes(query) ||
    (u.phone || '').toLowerCase().includes(query)
  );
  renderUsers(filtered);
});

// Add a scan (increment punch count)
window.addScan = async (userId) => {
  try {
    const res = await fetch('/api/rewards/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ user_id: userId })
    });

    if (!res.ok) {
      throw new Error('Failed to add scan');
    }

    loadData();
  } catch (err) {
    alert('Error adding scan: ' + err.message);
  }
};

// Reset reward (redeem and deduct target_score)
window.resetReward = async (userId) => {
  if (!confirm('Reset this user\'s reward score?')) return;
  
  try {
    const res = await fetch('/api/rewards/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ user_id: userId })
    });

    if (!res.ok) throw new Error('Failed to reset reward');

    await loadData();
  } catch (err) {
    alert('Error resetting reward: ' + (err.message || 'Unknown error'));
  }
};


// Simulate a random scan
window.simulateScan = async () => {
  if (!Array.isArray(allUsers) || allUsers.length === 0) {
    alert('No users to scan!');
    return;
  }

  const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
  const userId = randomUser.id ?? randomUser.user_id; // fallback just in case

  if (!userId) {
    console.error('No user id on row:', randomUser);
    alert('Could not determine user id.');
    return;
  }

  await addScan(userId); // addScan already calls loadData()
};

// Initialize on page load
init();
