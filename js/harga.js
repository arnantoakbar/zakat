/*
 * Harga acuan: emas & perak per gram, beras per kg.
 *
 * Nisab bergantung harga pasar hari ini — satu-satunya angka di situs ini
 * yang memang bukan angka syariat. Diambil dari dua API publik gratis tanpa
 * kunci (dipastikan CORS-nya terbuka):
 *
 *   api.gold-api.com/price/XAU + XAG  → harga emas & perak (USD per troy oz)
 *   open.er-api.com/v6/latest/USD     → kurs USD→IDR
 *
 * PRIVASI: kedua permintaan itu polos — tidak membawa satu pun angka harta
 * pemakai, tidak ada parameter, tidak ada cookie. Kalau jaringannya mati
 * atau API-nya tumbang, situs tetap berfungsi penuh memakai nilai bawaan
 * di bawah, dan semua kolom harga selalu bisa diubah tangan.
 */

(function (root) {
  'use strict';

  var GRAM_PER_OZ = 31.1034768;

  var BAWAAN = {
    emas: 2500000,
    perak: 37000,
    beras: 15000,
    sumber: 'default',
    keterangan: 'perkiraan Agustus 2026 — samakan dengan harga hari ini bila sempat'
  };

  function ambilJson(url, batasMs) {
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = ctrl && setTimeout(function () { ctrl.abort(); }, batasMs || 6000);
    return fetch(url, ctrl ? { signal: ctrl.signal } : {})
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .finally(function () { if (timer) clearTimeout(timer); });
  }

  /**
   * Memanggil balik SEKALI: dengan harga pasar bila berhasil, atau nilai
   * bawaan bila gagal/tanpa jaringan. Tidak pernah melempar error ke UI.
   */
  function muat(balik) {
    if (typeof fetch !== 'function') { balik(BAWAAN); return; }

    Promise.all([
      ambilJson('https://api.gold-api.com/price/XAU'),
      ambilJson('https://api.gold-api.com/price/XAG'),
      ambilJson('https://open.er-api.com/v6/latest/USD')
    ]).then(function (r) {
      var idr = r[2] && r[2].rates && r[2].rates.IDR;
      var xau = r[0] && r[0].price;
      var xag = r[1] && r[1].price;
      if (!idr || !xau || !xag) throw new Error('jawaban API tidak lengkap');

      balik({
        emas: Math.round(xau * idr / GRAM_PER_OZ),
        perak: Math.round(xag * idr / GRAM_PER_OZ),
        beras: BAWAAN.beras,
        sumber: 'live',
        keterangan: 'harga pasar dunia saat halaman dibuka (gold-api.com × kurs ' +
          'open.er-api.com) — boleh kamu ubah'
      });
    }).catch(function () {
      balik(BAWAAN);
    });
  }

  root.Harga = { muat: muat, BAWAAN: BAWAAN };
})(typeof window !== 'undefined' ? window : globalThis);
