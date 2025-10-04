// admin/admin.js
let merchantId = null;
let usersCache = [];

init();

async function init() {
  const u = await auth.user();
  if (!u) return (location.href = './index.html');

  // Load profile to get role + merchant scope
  const { data: profile, error } = await supa
    .from('profiles')
    .select('role, merchant_id, email')
    .eq('id', u.id)
    .single();

  if (error || profile?.role !== 'merchant_admin') {
    alert('Unauthorized'); return (location.href = './index.html');
  }
  merchantId = profile.merchant_id;

  // Show merchant name
  const { data: m } = await supa.from('merchants').select('name').eq('id', merchantId).single();
  document.getElementById('merchantName').textContent = m?.name || 'Merchant Admin';

  // Load panels
  await Promise.all([loadDashboard(), loadTags(), loadUsers(), loadScans()]);

  // Realtime: refresh on new scans
  supa.channel('scans-realtime')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scans' }, () => {
      loadDashboard(); loadScans(); loadUsers();
    })
    .subscribe();

  // Events
  document.getElementById('signout').onclick = async () => {
    await auth.signOut(); location.href = './index.html';
  };
  document.getElementById('createTag').addEventListener('submit', onCreateTag);
  document.getElementById('filterScans').addEventListener('click', () => loadScans());
  const userSearch = document.getElementById('userSearch');
  if (userSearch) userSearch.addEventListener('input', () => renderUsers(userSearch.value.trim()));
}

async function loadDashboard() {
  const today = new Date().toISOString().slice(0,10);
  // Scans today (scope via join to tags → same merchant)
  const { data: scans } = await supa
    .from('scans')
    .select('ts, user_id, tags!inner(merchant_id)')
    .gte('ts', `${today}T00:00:00Z`);
  const rows = (scans || []).filter(r => r.tags.merchant_id === merchantId);
  document.getElementById('kpi-scans').textContent = rows.length;
  document.getElementById('kpi-users').textContent = new Set(rows.map(r => r.user_id)).size;
}

async function loadTags() {
  const { data, error } = await supa
    .from('tags')
    .select('id, location_id, active')
    .eq('merchant_id', merchantId)
    .order('id');

  if (error) return alert(error.message);
  const tbody = document.querySelector('#tagsTable tbody');
  tbody.innerHTML = '';
  (data || []).forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${t.id}</td>
      <td class="center">${t.location_id ?? '-'}</td>
      <td class="center">${t.active ? 'active' : 'disabled'}</td>
      <td class="right">${t.active ? `<button data-id="${t.id}" class="danger">Disable</button>` : ''}</td>`;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('button[data-id]').forEach(btn => {
    btn.onclick = async () => {
      // Prefer Edge Function for production; for hackathon you can allow via RLS
      const { error } = await supa.from('tags').update({ active: false }).eq('id', btn.dataset.id);
      if (error) alert(error.message); else loadTags();
    };
  });
}

async function loadUsers() {
  const { data, error } = await supa
    .from('punchcards')
    .select('user_id, count, reward_every, last_scan_at')
    .eq('merchant_id', merchantId);

  if (error) return alert(error.message);
  const rows = data || [];

  // Fetch profile details for emails/phones
  const ids = [...new Set(rows.map(r => r.user_id))];
  let profileMap = new Map();
  if (ids.length) {
    // Try email + phone; fallback to email-only if column missing
    let profSel = 'id, email, phone';
    let profRes = await supa.from('profiles').select(profSel).in('id', ids);
    if (profRes.error) {
      profSel = 'id, email';
      profRes = await supa.from('profiles').select(profSel).in('id', ids);
    }
    (profRes.data || []).forEach(p => profileMap.set(p.id, p));
  }

  usersCache = rows.map(r => ({
    ...r,
    email: profileMap.get(r.user_id)?.email || '-',
    phone: profileMap.get(r.user_id)?.phone || '-'
  }));

  renderUsers(document.getElementById('userSearch')?.value?.trim() || '');
}

function renderUsers(query) {
  const tbody = document.querySelector('#usersTable tbody');
  if (!tbody) return;
  const q = (query || '').toLowerCase();
  const filtered = usersCache.filter(u => {
    if (!q) return true;
    return (
      String(u.user_id).toLowerCase().includes(q) ||
      String(u.email).toLowerCase().includes(q) ||
      String(u.phone).toLowerCase().includes(q)
    );
  });

  tbody.innerHTML = '';
  filtered.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.user_id}</td>
      <td class="center">${r.email}</td>
      <td class="center">${r.phone}</td>
      <td class="center">${r.count}</td>
      <td class="center">${r.reward_every}</td>
      <td class="right">${r.last_scan_at ?? '-'}</td>`;
    tbody.appendChild(tr);
  });
}

async function loadScans() {
  const from = document.getElementById('dateFrom').value;
  const to   = document.getElementById('dateTo').value;

  let query = supa
    .from('scans')
    .select('ts, user_id, tag_id, accepted, reason, tags!inner(merchant_id)')
    .order('ts', { ascending: false })
    .limit(200);

  if (from) query = query.gte('ts', `${from}T00:00:00Z`);
  if (to)   query = query.lte('ts', `${to}T23:59:59Z`);

  const { data, error } = await query;
  if (error) return alert(error.message);

  const rows = (data || []).filter(r => r.tags.merchant_id === merchantId);
  const tbody = document.querySelector('#scansTable tbody');
  tbody.innerHTML = '';
  rows.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${new Date(s.ts).toLocaleString()}</td>
      <td>${s.user_id}</td>
      <td>${s.tag_id}</td>
      <td class="center">${s.accepted ? 'accepted' : 'denied'}</td>
      <td class="right">${s.reason ?? '-'}</td>`;
    tbody.appendChild(tr);
  });
}

async function onCreateTag(e) {
  e.preventDefault();
  const id = document.getElementById('tagId').value.trim();
  const location_id = document.getElementById('locId').value.trim();
  if (!id) return;

  const { error } = await supa.from('tags').insert({
    id, merchant_id: merchantId, location_id, active: true
  });
  if (error) return alert(error.message);
  document.getElementById('tagId').value = '';
  loadTags();
}
