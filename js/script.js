/* ==========================================
   app.js - Behavior for HIMATEKKOM site
   - mobile menu, theme, language
   - carousel seamless auto-slide
   - chatbot (desktop button + mobile banner)
   - AI Chatbot (Python backend via /api/chat)
   ========================================== */

(function () {
  // ---------- Helpers ----------
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const isMobile = () => window.innerWidth <= 720;

  // ---------- Theme (persist) ----------
  const doc = document.documentElement;
  const THEMESTORAGE = 'himatek_theme';
  function setTheme(t) {
    doc.setAttribute('data-theme', t);
    localStorage.setItem(THEMESTORAGE, t);
    const toggle = $('#theme-toggle');
    if (toggle) toggle.setAttribute('aria-pressed', t === 'dark');
  }
  const initTheme = () => {
    const saved = localStorage.getItem(THEMESTORAGE);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(saved || (prefersDark ? 'dark' : 'light'));
  };

  // ---------- Language (simple + persist) ----------
  const LANG_KEY = 'himatek_lang';
  let currentLang = localStorage.getItem(LANG_KEY) || 'id';
  const i18n = {
    id: {
      'nav-home':'Beranda','nav-proker':'Proker','nav-info':'Informasi','nav-daftar':'Pendaftaran','nav-about':'Tentang',
      'hero-title':'HIMATEKKOM GUNADARMA','hero-sub':'Himpunan Mahasiswa Teknik Komputer',
      'hero-desc':'Bersama membangun inovasi, teknologi, dan kolaborasi mahasiswa teknik komputer Universitas Gunadarma.',
      'cta-join':'Daftar Sekarang','cta-proker':'Lihat Proker','about-title':'Tentang Himpunan',
      'proker-title':'Program Kerja Unggulan','info-title':'Pengumuman Terbaru',
      'cta-join-title':'Ingin Jadi Bagian dari HIMATEKKOM?','cta-join-desc':'Ayo bergabung dan berkontribusi dalam dunia teknologi bersama kami.',
      'btn-all-proker':'Lihat Semua Proker'
    },
    en: {
      'nav-home':'Home','nav-proker':'Programs','nav-info':'Announcements','nav-daftar':'Register','nav-about':'About',
      'hero-title':'HIMATEKKOM GUNADARMA','hero-sub':'Computer Engineering Student Association',
      'hero-desc':'Together building innovation, technology, and collaboration among Gunadarma Computer Engineering students.',
      'cta-join':'Join Now','cta-proker':'See Programs','about-title':'About the Association',
      'proker-title':'Featured Programs','info-title':'Latest Announcements',
      'cta-join-title':'Want to Join HIMATEKKOM?','cta-join-desc':'Join us and contribute to the world of technology.',
      'btn-all-proker':'See All Programs'
    }
  };

  function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem(LANG_KEY, lang);
    $$('[data-key]').forEach(el => {
      const k = el.getAttribute('data-key');
      if (i18n[lang][k]) el.textContent = i18n[lang][k];
    });
    $$('.lang-btn').forEach(b => b.classList.toggle('active', b.id.endsWith(lang)));
    $$('#mobile-panel .btn').forEach(b => {
      b.classList.toggle('active', b.id === 'mobile-lang-' + lang);
    });
  }

  // ---------- Mobile Menu ----------
  function initBurger() {
    const burger = $('#hamburger');
    const panel = $('#mobile-panel');
    if (!burger || !panel) return;

    burger.addEventListener('click', () => {
      const open = panel.classList.toggle('open');
      burger.setAttribute('aria-expanded', open);
      panel.setAttribute('aria-hidden', !open);
    });

    panel.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => {
        panel.classList.remove('open');
        burger.setAttribute('aria-expanded', false);
        panel.setAttribute('aria-hidden', true);
      })
    );
  }

  // ---------- Carousel ----------
  function initCarousel() {
    const track = $('#carousel-track');
    if (!track) return;
    const items = Array.from(track.children);
    items.forEach(it => track.appendChild(it.cloneNode(true)));
    track.addEventListener('mouseenter', () => track.style.animationPlayState = 'paused');
    track.addEventListener('mouseleave', () => track.style.animationPlayState = 'running');
  }
 // ---------- Chatbot (Smart Rule-Based & Interactive) ----------
function initChatbot() {
  const chatBtn = $('#chatbot-btn');
  const chatPanel = $('#chat-panel');
  const chatClose = $('#chat-close');
  const chatSend = $('#chat-send');
  const chatInput = $('#chat-input');
  const chatBody = $('#chat-body');
  const chatBanner = $('#chat-banner');
  const bannerOpen = $('#chat-banner-open');

  // Fungsi helper buka/tutup panel
  const openPanel = () => chatPanel.classList.add('open');
  const closePanel = () => chatPanel.classList.remove('open');

  if (chatBtn) chatBtn.addEventListener('click', openPanel);
  if (chatClose) chatClose.addEventListener('click', closePanel);
  if (bannerOpen) bannerOpen.addEventListener('click', openPanel);

  // Responsif mobile
  const refreshChatUI = () => {
    if (isMobile()) {
      chatBtn.style.display = 'none';
      chatBanner.style.display = 'flex';
    } else {
      chatBtn.style.display = 'flex';
      chatBanner.style.display = 'none';
    }
  };
  window.addEventListener('resize', refreshChatUI);
  refreshChatUI();

  // === Fungsi kirim pesan ===
  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Tambahkan pesan user ke UI
    const userMsg = document.createElement('div');
    userMsg.className = 'msg user';
    userMsg.textContent = text;
    chatBody.appendChild(userMsg);

    // Kosongkan input
    chatInput.value = '';
    chatBody.scrollTop = chatBody.scrollHeight;

    // Tampilkan loading dari bot
    const botMsg = document.createElement('div');
    botMsg.className = 'msg bot';
    botMsg.textContent = 'Menjawab...';
    chatBody.appendChild(botMsg);
    chatBody.scrollTop = chatBody.scrollHeight;

    try {
      // Kirim pesan ke server Flask
      const res = await fetch('http://127.0.0.1:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      botMsg.textContent = data.reply || '(Tidak ada jawaban)';

      // Jika bot menampilkan pilihan, tampilkan tombol interaktif
      if (data.reply.toLowerCase().includes("pilihan") || data.reply.toLowerCase().includes("ketik")) {
        appendChatOptions();
      }
    } catch (err) {
      console.warn('Gagal terhubung ke server Flask. Menggunakan fallback lokal.');
      botMsg.textContent = getFallbackReply(text);

      if (text.toLowerCase().includes("halo") || text.toLowerCase().includes("hai")) {
        appendChatOptions();
      }
    }

    chatBody.scrollTop = chatBody.scrollHeight;
  }

  // === Template tombol pilihan ===
  function appendChatOptions() {
  const options = [
    { text: "Info", icon: "📄" },
    { text: "Daftar", icon: "📝" },
    { text: "Proker", icon: "🎯" },
    { text: "Tentang", icon: "ℹ️" },
    { text: "Struktur", icon: "👥" },
    { text: "Kontak", icon: "📞" }
  ];

  const optionBox = document.createElement('div');
  optionBox.className = 'chat-options';

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'chat-option-btn';
    btn.innerHTML = `${opt.icon} ${opt.text}`;
    btn.addEventListener('click', () => {
      chatInput.value = opt.text.toLowerCase();
      chatSend.click();
    });
    optionBox.appendChild(btn);
  });

  chatBody.appendChild(optionBox);
  chatBody.scrollTop = chatBody.scrollHeight;
}

  // === Fallback lokal kalau server mati ===
  function getFallbackReply(msg) {
    msg = msg.toLowerCase().trim();

    if (["halo", "hai", "hello", "helo"].includes(msg)) {
      return (
        "Iya, halo juga! 😊\n" +
        "Ada yang bisa aku bantu?\n" +
        "Ketik salah satu pilihan berikut:\n" +
        "• daftar\n• info\n• proker\n• tentang\n• struktur\n• kontak"
      );
    }

    const rules = [
      { key: 'daftar', reply: 'Untuk mendaftar, buka menu "Pendaftaran".' },
      { key: 'proker', reply: 'Lihat program kerja kami di halaman Proker.' },
      { key: 'info', reply: 'Kunjungi halaman Informasi untuk pengumuman terbaru.' },
      { key: 'tentang', reply: 'HIMATEKKOM adalah Himpunan Mahasiswa Teknik Komputer Universitas Gunadarma.' },
      { key: 'struktur', reply: 'Kamu bisa melihat struktur kepengurusan kami di halaman Struktur.' },
      { key: 'kontak', reply: 'Kamu dapat menghubungi kami lewat WhatsApp: https://wa.me/083156960998' },
      { key: 'media partner', reply: 'Hubungi kami melalui Instagram @himatekkom.ug atau WhatsApp: https://wa.me/083156960998' }
    ];

    for (const rule of rules) {
      if (msg.includes(rule.key)) return rule.reply;
    }

    return (
      "Maaf, saya belum memahami pertanyaan kamu. 😅\n" +
      "Silakan pilih salah satu topik berikut:\n" +
      "• daftar\n• info\n• proker\n• tentang\n• struktur\n• kontak"
    );
  }

  // === Event listener ===
  chatSend.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  });
}

  // ---------- Sticky Navbar ----------
  function initStickyNavbar() {
    const nav = $('.navbar');
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    });
  }

  // ---------- CTA Smooth Scroll ----------
  function initCTA() {
    const btn = $('#cta-proker');
    if (!btn) return;
    btn.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector('#proker');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // ---------- Initialize ----------
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    applyLanguage(currentLang);
    initBurger();
    initCarousel();
    initChatbot();
    initStickyNavbar();
    initCTA();

    // theme toggle
    const themeToggle = $('#theme-toggle');
    if (themeToggle) themeToggle.addEventListener('click', () => {
      const next = doc.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      setTheme(next);
    });

    // language buttons
    $$('.lang-btn').forEach(b => b.addEventListener('click', () => {
      const lang = b.id.endsWith('en') ? 'en' : 'id';
      applyLanguage(lang);
    }));
    // mobile lang buttons
    const mobileId = $('#mobile-lang-id'), mobileEn = $('#mobile-lang-en');
    if (mobileId) mobileId.addEventListener('click', () => applyLanguage('id'));
    if (mobileEn) mobileEn.addEventListener('click', () => applyLanguage('en'));
  });
})();
