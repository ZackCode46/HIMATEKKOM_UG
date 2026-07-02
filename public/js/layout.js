/* layout.js — inject header & footer supaya tidak duplikat di tiap halaman */
(async function () {
  const headerEl = document.getElementById('site-header');
  const footerEl = document.getElementById('site-footer');

  async function inject(el, url) {
    if (!el) return;
    try {
      const res = await fetch(url);
      el.outerHTML = await res.text();
    } catch (err) {
      console.error('Gagal memuat', url, err);
    }
  }

  await Promise.all([
    inject(headerEl, '/partials/header.html'),
    inject(footerEl, '/partials/footer.html')
  ]);

  // tandai menu aktif berdasarkan halaman saat ini
  const current = document.body.dataset.page;
  if (current) {
    document.querySelectorAll(`[data-nav="${current}"]`).forEach((a) => a.classList.add('active'));
  }

  // beri tahu main.js supaya init ulang (karena header/footer baru saja disisipkan)
  document.dispatchEvent(new Event('layout:ready'));
})();
