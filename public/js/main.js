/* main.js — fungsi yang dipakai di semua halaman publik */
(function () {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const doc = document.documentElement;

  // ---------- Tema (gelap/terang), tersimpan di browser ----------
  const THEME_KEY = 'himatek_theme';
  function setTheme(t) {
    doc.setAttribute('data-theme', t);
    localStorage.setItem(THEME_KEY, t);
    const toggle = $('#theme-toggle');
    if (toggle) toggle.setAttribute('aria-pressed', t === 'dark');
  }
  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(saved || (prefersDark ? 'dark' : 'light'));
    const toggle = $('#theme-toggle');
    if (toggle) toggle.addEventListener('click', () => {
      setTheme(doc.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  }

  // ---------- Menu mobile ----------
  function initBurger() {
    const burger = $('#hamburger');
    const panel = $('#mobile-panel');
    if (!burger || !panel) return;
    burger.addEventListener('click', () => {
      const open = panel.classList.toggle('open');
      burger.setAttribute('aria-expanded', open);
      panel.setAttribute('aria-hidden', !open);
    });
    $$('a', panel).forEach((a) =>
      a.addEventListener('click', () => {
        panel.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        panel.setAttribute('aria-hidden', 'true');
      })
    );
  }

  // ---------- Tahun footer ----------
  function initYear() {
    const el = $('#year');
    if (el) el.textContent = new Date().getFullYear();
  }

  // ---------- Reveal saat scroll ----------
  function initReveal() {
    const els = $$('.reveal');
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => obs.observe(el));
  }

  // ---------- Chatbot ----------
  function initChatbot() {
    const chatBtn = $('#chatbot-btn');
    const chatPanel = $('#chat-panel');
    const chatClose = $('#chat-close');
    const chatSend = $('#chat-send');
    const chatInput = $('#chat-input');
    const chatBody = $('#chat-body');
    const bannerOpen = $('#chat-banner-open');
    if (!chatBtn || !chatPanel) return;

    const openPanel = () => chatPanel.classList.add('open');
    const closePanel = () => chatPanel.classList.remove('open');
    chatBtn.addEventListener('click', openPanel);
    if (chatClose) chatClose.addEventListener('click', closePanel);
    if (bannerOpen) bannerOpen.addEventListener('click', openPanel);

    const RULES = [
      { key: 'daftar', reply: 'Untuk mendaftar, buka menu "Pendaftaran" di navbar ya!' },
      { key: 'proker', reply: 'Program kerja HIMATEKKOM bisa kamu lihat di halaman Proker.' },
      { key: 'info', reply: 'Kunjungi halaman Informasi untuk pengumuman terbaru.' },
      { key: 'tentang', reply: 'HIMATEKKOM adalah Himpunan Mahasiswa Teknik Komputer Universitas Gunadarma.' },
      { key: 'struktur', reply: 'Struktur kepengurusan bisa dilihat di menu Struktur pada navbar.' },
      { key: 'kontak', reply: 'Hubungi kami lewat WhatsApp: https://wa.me/083156960998' }
    ];
    function fallbackReply(msg) {
      msg = msg.toLowerCase().trim();
      if (['halo', 'hai', 'hello', 'helo'].includes(msg)) {
        return 'Halo juga! 😊 Ada yang bisa aku bantu? Ketik salah satu: daftar, info, proker, tentang, struktur, atau kontak.';
      }
      for (const r of RULES) if (msg.includes(r.key)) return r.reply;
      return 'Maaf, aku belum paham pertanyaan itu. Coba ketik: daftar, info, proker, tentang, struktur, atau kontak.';
    }

    function addMsg(text, who) {
      const div = document.createElement('div');
      div.className = 'msg ' + who;
      div.textContent = text;
      chatBody.appendChild(div);
      chatBody.scrollTop = chatBody.scrollHeight;
    }

    function send() {
      const text = chatInput.value.trim();
      if (!text) return;
      addMsg(text, 'user');
      chatInput.value = '';
      setTimeout(() => addMsg(fallbackReply(text), 'bot'), 300);
    }

    chatSend.addEventListener('click', send);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); send(); }
    });
  }

  // ---------- Akun (login/avatar) ----------
  async function initAuthArea() {
    const area = $('#auth-area');
    if (!area) return null;
    let user = null;
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      user = data.user;
    } catch {}

    const mobileProfile = $('#mobile-profile-link');
    const mobileLogin = $('#mobile-login-link');

    if (!user) {
      area.innerHTML = `
        <div class="auth-buttons">
          <a href="/login.html" class="btn secondary small">Masuk</a>
          <a href="/register.html" class="btn small">Daftar</a>
        </div>`;
      if (mobileProfile) mobileProfile.style.display = 'none';
      if (mobileLogin) { mobileLogin.style.display = ''; mobileLogin.textContent = 'Masuk / Daftar'; mobileLogin.href = '/login.html'; }
      return null;
    }

    area.innerHTML = `
      <div class="avatar-wrap" id="avatar-wrap">
        <button class="avatar-btn" id="avatar-btn"><img src="${user.avatar}" alt="${user.name}"></button>
        <div class="dropdown-menu avatar-menu" id="avatar-menu">
          <div class="who">
            <div class="name">${user.name}</div>
            <div class="email">${user.email}</div>
            ${user.role === 'admin' ? '<span class="role-pill">Admin</span>' : ''}
          </div>
          <a href="/profil.html">👤 Profil Saya</a>
          <a href="/tanya.html">💬 Tanya Jawab</a>
          ${user.role === 'admin' ? '<a href="/admin/">🛠 Panel Admin</a>' : ''}
          <a href="#" id="logout-link">↩ Keluar</a>
        </div>
      </div>`;

    const wrap = $('#avatar-wrap');
    $('#avatar-btn').addEventListener('click', () => wrap.classList.toggle('open'));
    document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) wrap.classList.remove('open'); });
    $('#logout-link').addEventListener('click', async (e) => {
      e.preventDefault();
      await fetch('/api/auth/logout', { method: 'POST' });
      location.href = '/';
    });

    if (mobileProfile) mobileProfile.style.display = '';
    if (mobileLogin) { mobileLogin.textContent = 'Keluar'; mobileLogin.href = '#'; mobileLogin.onclick = async (e) => { e.preventDefault(); await fetch('/api/auth/logout', { method: 'POST' }); location.href = '/'; }; }

    return user;
  }

  // ---------- Notifikasi info terbaru ----------
  const NOTIF_KEY = 'himatek_last_seen_info';
  async function initNotif() {
    const btn = $('#notif-btn');
    const wrap = $('#notif-wrap');
    const dot = $('#notif-dot');
    const list = $('#notif-list');
    if (!btn) return;

    let items = [];
    try {
      const res = await fetch('/api/informasi');
      items = (await res.json()).sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)).slice(0, 8);
    } catch {}

    const lastSeen = localStorage.getItem(NOTIF_KEY);
    const lastSeenTime = lastSeen ? new Date(lastSeen).getTime() : 0;
    const hasUnread = items.some((i) => new Date(i.tanggal).getTime() > lastSeenTime);
    if (dot) dot.hidden = !hasUnread;

    if (!items.length) {
      list.innerHTML = '<div class="empty-state" style="padding:20px">Belum ada informasi.</div>';
    } else {
      list.innerHTML = items.map((i) => {
        const unread = new Date(i.tanggal).getTime() > lastSeenTime;
        return `<a class="notif-item ${unread ? 'unread' : ''}" href="/informasi.html">
          <div class="t">${window.HIMA.escapeHtml(i.judul)}</div>
          <div class="d">${window.HIMA.formatDate(i.tanggal)}</div>
        </a>`;
      }).join('');
    }

    btn.addEventListener('click', () => wrap.classList.toggle('open'));
    document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) wrap.classList.remove('open'); });

    const markBtn = $('#notif-mark-read');
    if (markBtn) markBtn.addEventListener('click', () => {
      localStorage.setItem(NOTIF_KEY, new Date().toISOString());
      if (dot) dot.hidden = true;
      $$('.notif-item', list).forEach((el) => el.classList.remove('unread'));
    });
  }

  // layout:ready ditembak oleh layout.js setelah header & footer selesai disisipkan,
  // supaya elemen seperti #theme-toggle, #hamburger, #chatbot-btn sudah ada di DOM.
  document.addEventListener('layout:ready', () => {
    initTheme();
    initBurger();
    initYear();
    initReveal();
    initChatbot();
    initAuthArea();
    initNotif();
  });

  // dipakai halaman lain untuk render placeholder gambar jadi inisial berwarna
  window.HIMA = {
    escapeHtml(str) {
      return String(str ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      }[c]));
    },
    formatDate(iso) {
      try {
        return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      } catch { return ''; }
    },
    thumbOrPlaceholder(src, label) {
      if (src) return `<img class="thumb" src="${src}" alt="">`;
      const initial = (label || '?').trim().charAt(0).toUpperCase();
      return `<div class="thumb placeholder">${initial}</div>`;
    }
  };
})();
