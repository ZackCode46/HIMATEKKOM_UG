(function () {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  const loginView = $('#login-view');
  const dashView = $('#dashboard-view');

  // ---------------- Skema tiap koleksi (CRUD generik) ----------------
  const SCHEMAS = {
    informasi: {
      title: 'Informasi & Pengumuman',
      desc: 'Kelola berita dan pengumuman yang tampil di website.',
      endpoint: '/api/informasi',
      columns: ['judul', 'kategori', 'tanggal'],
      fields: [
        { name: 'judul', label: 'Judul', type: 'text', required: true, full: true },
        { name: 'kategori', label: 'Kategori', type: 'select', options: ['pengumuman', 'kegiatan', 'prestasi'], required: true },
        { name: 'featured', label: 'Tampilkan sebagai unggulan', type: 'checkbox' },
        { name: 'ringkasan', label: 'Ringkasan Singkat', type: 'textarea', required: true, full: true },
        { name: 'konten', label: 'Isi Lengkap', type: 'textarea', full: true },
        { name: 'gambar', label: 'Gambar (opsional)', type: 'image', full: true }
      ]
    },
    proker: {
      title: 'Program Kerja',
      desc: 'Kelola daftar program kerja HIMATEKKOM.',
      endpoint: '/api/proker',
      columns: ['judul', 'tag'],
      fields: [
        { name: 'judul', label: 'Judul Program Kerja', type: 'text', required: true, full: true },
        { name: 'tag', label: 'Kategori/Tag', type: 'text', placeholder: 'contoh: seminar, workshop' },
        { name: 'deskripsi', label: 'Deskripsi', type: 'textarea', required: true, full: true },
        { name: 'gambar', label: 'Gambar (opsional)', type: 'image', full: true }
      ]
    },
    pengurus: {
      title: 'Struktur Pengurus',
      desc: 'Kelola daftar pengurus per divisi.',
      endpoint: '/api/pengurus',
      columns: ['nama', 'jabatan', 'divisi'],
      fields: [
        { name: 'nama', label: 'Nama Lengkap', type: 'text', required: true, full: true },
        { name: 'jabatan', label: 'Jabatan', type: 'text', required: true },
        { name: 'divisi', label: 'Divisi', type: 'select', options: ['BPH', 'Humas', 'Media Kreatif', 'PSDM', 'Organisasi'], required: true },
        { name: 'urutan', label: 'Urutan Tampil (angka kecil = di depan)', type: 'number' },
        { name: 'foto', label: 'Foto (opsional)', type: 'image', full: true }
      ]
    }
  };

  let currentTab = 'informasi';
  let currentData = [];
  let editingId = null;

  // ---------------- Auth ----------------
  async function checkSession() {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (data.user && data.user.role === 'admin') showDashboard();
    else showLogin();
  }

  function showLogin() {
    loginView.style.display = 'flex';
    dashView.style.display = 'none';
  }
  function showDashboard() {
    loginView.style.display = 'none';
    dashView.style.display = 'flex';
    loadTab('informasi');
  }

  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#login-btn');
    btn.disabled = true; btn.textContent = 'Memproses...';
    $('#login-alert').innerHTML = '';
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: $('#email').value, password: $('#password').value })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login gagal');
      if (data.user.role !== 'admin') {
        await fetch('/api/auth/logout', { method: 'POST' });
        throw new Error('Akun ini bukan akun admin.');
      }
      showDashboard();
    } catch (err) {
      $('#login-alert').innerHTML = `<div class="alert error">${err.message}</div>`;
    } finally {
      btn.disabled = false; btn.textContent = 'Masuk';
    }
  });

  $('#logout-btn').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    showLogin();
  });

  // ---------------- Tabs ----------------
  $$('.admin-sidebar .tab[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.admin-sidebar .tab').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      loadTab(btn.dataset.tab);
    });
  });

  async function refreshCounts() {
    for (const key of Object.keys(SCHEMAS)) {
      try {
        const res = await fetch(SCHEMAS[key].endpoint);
        const data = await res.json();
        const el = $('#count-' + key);
        if (el) el.textContent = data.length;
      } catch {}
    }
    try {
      const res = await fetch('/api/pertanyaan?all=1');
      const data = await res.json();
      const pending = data.filter((d) => d.status === 'menunggu').length;
      const el = $('#count-pertanyaan');
      if (el) el.textContent = pending;
    } catch {}
  }

  async function loadTab(tab) {
    currentTab = tab;
    if (tab === 'pertanyaan') return loadPertanyaan();

    const schema = SCHEMAS[tab];
    $('#panel-title').textContent = schema.title;
    $('#panel-desc').textContent = schema.desc;
    $('#add-btn').style.display = 'inline-flex';
    $('#add-btn').textContent = '+ Tambah Data';
    $('#add-btn').onclick = () => openModal(null);

    $('#table-head').innerHTML = schema.columns.map((c) => `<th>${c}</th>`).join('') + '<th>Gambar</th><th>Aksi</th>';
    $('#table-body').innerHTML = `<tr><td colspan="${schema.columns.length + 2}">Memuat...</td></tr>`;

    const res = await fetch(schema.endpoint);
    currentData = await res.json();
    renderTable();
    refreshCounts();
  }

  function renderTable() {
    const schema = SCHEMAS[currentTab];
    const body = $('#table-body');
    if (!currentData.length) {
      body.innerHTML = `<tr><td colspan="${schema.columns.length + 2}" class="empty-state">Belum ada data. Klik "Tambah Data" untuk mulai.</td></tr>`;
      return;
    }
    const imgField = schema.fields.find((f) => f.type === 'image')?.name;
    body.innerHTML = currentData.map((item) => {
      const cells = schema.columns.map((c) => `<td>${escapeHtml(String(item[c] ?? ''))}</td>`).join('');
      const img = imgField && item[imgField] ? `<img class="thumb-sm" src="${item[imgField]}">` : '<div class="thumb-sm"></div>';
      return `<tr data-id="${item.id}">
        ${cells}
        <td>${img}</td>
        <td class="actions">
          <button class="btn secondary small" data-edit="${item.id}">Edit</button>
          <button class="btn danger small" data-del="${item.id}">Hapus</button>
        </td>
      </tr>`;
    }).join('');

    $$('[data-edit]', body).forEach((btn) => btn.addEventListener('click', () => openModal(Number(btn.dataset.edit))));
    $$('[data-del]', body).forEach((btn) => btn.addEventListener('click', () => deleteItem(Number(btn.dataset.del))));
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ---------------- Modal form (tambah/edit konten) ----------------
  const modal = $('#form-modal');

  $('#modal-close-btn').addEventListener('click', closeModal);
  $('#cancel-btn').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  function closeModal() { modal.classList.remove('open'); editingId = null; }

  function openModal(id) {
    const schema = SCHEMAS[currentTab];
    editingId = id;
    const item = id ? currentData.find((d) => d.id === id) : {};
    $('#modal-title').textContent = id ? 'Edit Data' : 'Tambah Data';
    $('#modal-alert').innerHTML = '';

    $('#modal-fields').innerHTML = schema.fields.map((f) => {
      const val = item[f.name] ?? '';
      const fullClass = f.full ? 'field full' : 'field';
      if (f.type === 'textarea') {
        return `<div class="${fullClass}"><label>${f.label}</label><textarea name="${f.name}" ${f.required ? 'required' : ''}>${escapeHtml(String(val))}</textarea></div>`;
      }
      if (f.type === 'select') {
        const opts = f.options.map((o) => `<option value="${o}" ${o === val ? 'selected' : ''}>${o}</option>`).join('');
        return `<div class="${fullClass}"><label>${f.label}</label><select name="${f.name}" ${f.required ? 'required' : ''}><option value="">Pilih...</option>${opts}</select></div>`;
      }
      if (f.type === 'checkbox') {
        return `<div class="${fullClass}"><label style="display:flex;align-items:center;gap:8px;font-weight:600"><input type="checkbox" name="${f.name}" ${val ? 'checked' : ''} style="width:auto"> ${f.label}</label></div>`;
      }
      if (f.type === 'image') {
        return `<div class="${fullClass}">
          <label>${f.label}</label>
          <input type="file" name="${f.name}__file" accept="image/*">
          <input type="hidden" name="${f.name}" value="${escapeHtml(String(val))}">
          ${val ? `<img src="${val}" style="margin-top:8px;height:80px;border-radius:8px;object-fit:cover">` : ''}
        </div>`;
      }
      return `<div class="${fullClass}"><label>${f.label}</label><input type="${f.type}" name="${f.name}" value="${escapeHtml(String(val))}" placeholder="${f.placeholder || ''}" ${f.required ? 'required' : ''}></div>`;
    }).join('');

    $('#data-form').onsubmit = handleContentFormSubmit;
    modal.classList.add('open');
  }

  async function handleContentFormSubmit(e) {
    e.preventDefault();
    const schema = SCHEMAS[currentTab];
    const saveBtn = $('#save-btn');
    saveBtn.disabled = true; saveBtn.textContent = 'Menyimpan...';
    $('#modal-alert').innerHTML = '';

    try {
      const form = e.target;
      const payload = {};

      for (const f of schema.fields) {
        if (f.type === 'image') {
          const fileInput = form.querySelector(`[name="${f.name}__file"]`);
          const hiddenInput = form.querySelector(`[name="${f.name}"]`);
          if (fileInput.files && fileInput.files[0]) {
            const uploadForm = new FormData();
            uploadForm.append('image', fileInput.files[0]);
            const upRes = await fetch('/api/upload', { method: 'POST', body: uploadForm });
            const upData = await upRes.json();
            if (!upRes.ok) throw new Error(upData.error || 'Gagal upload gambar');
            payload[f.name] = upData.url;
          } else {
            payload[f.name] = hiddenInput.value;
          }
        } else if (f.type === 'checkbox') {
          payload[f.name] = form.querySelector(`[name="${f.name}"]`).checked;
        } else {
          payload[f.name] = form.querySelector(`[name="${f.name}"]`).value;
        }
      }

      const url = editingId ? `${schema.endpoint}/${editingId}` : schema.endpoint;
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan data');

      closeModal();
      loadTab(currentTab);
    } catch (err) {
      $('#modal-alert').innerHTML = `<div class="alert error">${err.message}</div>`;
    } finally {
      saveBtn.disabled = false; saveBtn.textContent = 'Simpan';
    }
  }

  async function deleteItem(id) {
    if (!confirm('Yakin ingin menghapus data ini? Tindakan ini tidak bisa dibatalkan.')) return;
    const schema = SCHEMAS[currentTab];
    const res = await fetch(`${schema.endpoint}/${id}`, { method: 'DELETE' });
    if (res.ok) loadTab(currentTab);
    else alert('Gagal menghapus data.');
  }

  // ---------------- Tab Pertanyaan (Q&A) ----------------
  let currentQuestions = [];

  async function loadPertanyaan() {
    $('#panel-title').textContent = 'Pertanyaan dari Pengguna';
    $('#panel-desc').textContent = 'Jawab pertanyaan yang masuk dari visitor/anggota. Jawaban akan otomatis tampil di halaman Tanya Jawab publik.';
    $('#add-btn').style.display = 'none';

    $('#table-head').innerHTML = '<th>Penanya</th><th>Pertanyaan</th><th>Status</th><th>Tanggal</th><th>Aksi</th>';
    $('#table-body').innerHTML = '<tr><td colspan="5">Memuat...</td></tr>';

    const res = await fetch('/api/pertanyaan?all=1');
    currentQuestions = await res.json();
    renderPertanyaanTable();
    refreshCounts();
  }

  function renderPertanyaanTable() {
    const body = $('#table-body');
    if (!currentQuestions.length) {
      body.innerHTML = '<tr><td colspan="5" class="empty-state">Belum ada pertanyaan masuk.</td></tr>';
      return;
    }
    body.innerHTML = currentQuestions.map((q) => `
      <tr data-id="${q.id}">
        <td>${escapeHtml(q.namaPenanya)}<br><span style="color:var(--muted);font-size:.76rem">${escapeHtml(q.emailPenanya || '')}</span></td>
        <td style="max-width:280px">${escapeHtml(q.pertanyaan)}</td>
        <td>${q.status === 'dijawab' ? '<span style="color:#16a34a;font-weight:700">Dijawab</span>' : '<span style="color:#b45309;font-weight:700">Menunggu</span>'}</td>
        <td>${new Date(q.createdAt).toLocaleDateString('id-ID')}</td>
        <td class="actions">
          <button class="btn secondary small" data-reply="${q.id}">${q.status === 'dijawab' ? 'Edit Jawaban' : 'Jawab'}</button>
          <button class="btn danger small" data-delq="${q.id}">Hapus</button>
        </td>
      </tr>`).join('');

    $$('[data-reply]', body).forEach((btn) => btn.addEventListener('click', () => openReplyModal(Number(btn.dataset.reply))));
    $$('[data-delq]', body).forEach((btn) => btn.addEventListener('click', () => deletePertanyaan(Number(btn.dataset.delq))));
  }

  function openReplyModal(id) {
    const q = currentQuestions.find((d) => d.id === id);
    $('#modal-title').textContent = 'Jawab Pertanyaan';
    $('#modal-alert').innerHTML = '';
    $('#modal-fields').innerHTML = `
      <div class="field full"><label>Dari</label><input type="text" value="${escapeHtml(q.namaPenanya)} (${escapeHtml(q.emailPenanya || '-')})" disabled></div>
      <div class="field full"><label>Pertanyaan</label><textarea disabled>${escapeHtml(q.pertanyaan)}</textarea></div>
      <div class="field full"><label>Jawaban Kamu</label><textarea name="jawaban" required>${escapeHtml(q.jawaban || '')}</textarea></div>
    `;
    $('#data-form').onsubmit = async (e) => {
      e.preventDefault();
      const saveBtn = $('#save-btn');
      saveBtn.disabled = true; saveBtn.textContent = 'Menyimpan...';
      try {
        const jawaban = e.target.querySelector('[name="jawaban"]').value;
        const res = await fetch(`/api/pertanyaan/${id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jawaban })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal menyimpan jawaban');
        closeModal();
        loadPertanyaan();
      } catch (err) {
        $('#modal-alert').innerHTML = `<div class="alert error">${err.message}</div>`;
      } finally {
        saveBtn.disabled = false; saveBtn.textContent = 'Simpan';
      }
    };
    modal.classList.add('open');
  }

  async function deletePertanyaan(id) {
    if (!confirm('Hapus pertanyaan ini?')) return;
    const res = await fetch(`/api/pertanyaan/${id}`, { method: 'DELETE' });
    if (res.ok) loadPertanyaan();
    else alert('Gagal menghapus.');
  }

  checkSession();
})();
