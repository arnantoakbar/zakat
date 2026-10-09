/*
 * Penampil dalil — dipakai halaman hasil dan halaman rujukan.
 *
 * Satu dalil = satu <figure class="fl-cite"> dari design system: teks Arab,
 * terjemahan, lalu baris sumber (chip derajat + rujukan + tautan). Aturannya
 * tetap seperti dulu: ayat/hadits TIDAK PERNAH dipenggal. Kalau `sorotId`
 * diberikan, ruas itu dibungkus <mark> (Arab dan terjemahannya) dan ruas lain
 * tetap tampil biasa — pembaca selalu melihat firman selengkapnya.
 */

(function (root) {
  'use strict';

  function ic(id) {
    return '<svg class="fl-icon" aria-hidden="true"><use href="#' + id + '"/></svg>';
  }
  function esc(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  }

  /** Arab/terjemah utuh; ruas `sorotId` (bila ada) diberi <mark>. */
  function teks(d, kunci, sorotId) {
    if (!d.segmen) return esc(kunci === 'arab' ? d.arab : d.terjemah);
    return d.segmen.map(function (s) {
      var t = esc(kunci === 'arab' ? s.arab : s.arti);
      return sorotId && s.id === sorotId ? '<mark>' + t + '</mark>' : t;
    }).join(' ');
  }

  function chipSumber(d) {
    if (d.jenis === 'quran') return '<span class="fl-src" data-src="official">Al-Qur’an</span>';
    var chip = d.derajat.split(' — ')[0];
    return '<span class="fl-grade" data-grade="' + d.grade + '">' +
      (d.grade === 'dhaif' ? ic('i-triangle-alert') : ic('i-check')) + ' ' + esc(chip) + '</span>';
  }

  /**
   * @param {string} id        kunci di Dalil.DATA
   * @param {string} [sorotId] id ruas yang disorot
   * @param {string} [dipakai] teks "Dipakai untuk: …"
   * @param {boolean} [tanpaId] jangan beri id (salinan kedua di halaman yang sama)
   */
  function cite(id, sorotId, dipakai, tanpaId) {
    var d = root.Dalil.ambil(id);
    if (!d) return '';
    var catatanDerajat = d.derajat && d.derajat.indexOf(' — ') > 0
      ? '<p class="fl-hint">' + esc(d.derajat.split(' — ')[1]) + '</p>' : '';
    return '<figure class="fl-cite"' + (tanpaId ? '' : ' id="dalil-' + id + '"') + '>' +
      '<p class="fl-arabic" lang="ar" dir="rtl">' + teks(d, 'arab', sorotId) + '</p>' +
      '<p class="fl-cite__tr">' + teks(d, 'terjemah', sorotId) + '</p>' +
      (d.ringkas ? '<p class="fl-hint">' + esc(d.ringkas) + '</p>' : '') +
      catatanDerajat +
      (dipakai ? '<p class="fl-hint"><b>Dipakai untuk:</b> ' + esc(dipakai) + '</p>' : '') +
      '<figcaption class="fl-cite__src">' + chipSumber(d) +
      '<span>' + esc(d.rujukan) + (d.perawi ? ' · ' + esc(d.perawi) : '') + '</span>' +
      '<a href="' + d.tautan.url + '" target="_blank" rel="noopener noreferrer">' +
      esc(d.tautan.label) + ' ' + ic('i-arrow-up-right') + '</a></figcaption></figure>';
  }

  /** Aturan Indonesia — callout hijau (tone "tip"), selalu bertautan ke pasalnya. */
  function hukum(id) {
    var h = root.HukumID.ambil(id);
    if (!h) return '';
    return '<div class="fl-callout" data-tone="tip" id="hukum-' + id + '">' +
      '<span class="fl-callout__icon">' + ic('i-landmark') + '</span><div>' +
      '<h3>' + esc(h.rujukan) + '</h3><p>' + esc(h.teks) + '</p>' +
      '<p><b>' + esc(h.ringkas) + '</b></p>' +
      '<p><a class="fl-link" href="' + h.tautan.url + '" target="_blank" rel="noopener noreferrer">' +
      esc(h.tautan.label) + ' ' + ic('i-arrow-up-right') + '</a></p></div></div>';
  }

  root.UIDalil = { cite: cite, hukum: hukum, chip: function (id) { var d = root.Dalil.ambil(id); return d ? chipSumber(d) : ''; }, ic: ic, esc: esc };
})(typeof window !== 'undefined' ? window : globalThis);
