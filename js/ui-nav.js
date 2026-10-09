/*
 * Perilaku navbar yang khas situs ini.
 *
 * 1. Tombol utama di navbar disembunyikan selama tombol yang sama di hero masih
 *    terlihat (data-cta-sentinel), supaya tidak ada dua ajakan yang kembar di
 *    layar; ia muncul lagi begitu hero digulir lewat.
 * 2. Kit menahan navbar selama ada fokus di dalamnya (benar untuk pemakai keyboard).
 *    Di layar sentuh, tombol yang baru diketuk tetap berfokus, sehingga navbar tidak
 *    menyingkir lagi saat menggulir. Jadi fokus dilepas setelah ketukan pointer
 *    (event.detail > 0); aktivasi lewat keyboard (detail 0) tetap menjaga fokus.
 * 3. Status tombol tema (aria-pressed) mengikuti tema yang BENAR-BENAR tampil,
 *    termasuk saat masih "auto" mengikuti perangkat. Pemilihan dan penyimpanan
 *    tema dikerjakan widget bawaan sistem (data-theme-toggle + data-theme-persist).
 */

(function () {
  'use strict';
  var nav = document.querySelector('.fl-nav');
  if (!nav) return;

  var sentinel = document.querySelector('[data-cta-sentinel]');
  if (sentinel && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      nav.toggleAttribute('data-sans-cta', e[0].isIntersecting);
    }).observe(sentinel);
  }

  nav.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (b && e.detail > 0) setTimeout(function () { b.blur(); }, 0);
  });

  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  function segarkan() {
    var t = document.documentElement.getAttribute('data-theme');
    var gelap = t === 'dark' || (t !== 'light' && mq.matches);
    Array.prototype.forEach.call(document.querySelectorAll('[data-theme-toggle]'), function (b) {
      b.setAttribute('aria-pressed', String(gelap));
    });
  }
  segarkan();
  window.addEventListener('load', segarkan);   // widget sistem menimpa aria-pressed saat inisialisasi
  mq.addEventListener('change', segarkan);
  document.addEventListener('flavida:theme', segarkan);
})();
