/*
 * Rikaz — harta karun temuan.
 *
 * Harta terpendam peninggalan masa pra-Islam yang ditemukan begitu saja.
 * Aturannya paling ringkas di antara semua jenis: seperlima (20%), tanpa
 * nisab, tanpa menunggu haul — ditunaikan seketika saat ditemukan.
 */

(function (root) {
  'use strict';

  var C = root.ZakatConst;

  function hitung(r) {
    if (!r || !(r.nilai > 0)) return null;

    return {
      id: 'rikaz',
      label: 'Harta temuan (rikaz)',
      ikon: 'i-gem',
      status: 'wajib',
      alasan: 'Rikaz dikenai seperlima (20%) seketika saat ditemukan — tanpa nisab, ' +
        'tanpa menunggu setahun.',
      dasar: r.nilai,
      nisab: { teks: 'tidak ada — berapa pun nilainya' },
      persenNisab: 100,
      zakat: { rp: Math.round(r.nilai * C.KADAR_RIKAZ), natura: null },
      kapan: { tipe: 'segera', teks: 'seketika saat ditemukan' },
      dalil: ['hr-rikaz'],
      catatan: [
        { tipe: 'khilaf', teks: 'Tanpa nisab adalah pendapat jumhur ulama. Dalam mazhab ' +
          'Syafi’i ada qaul yang mensyaratkan nisab. Hasil tambang yang diusahakan ' +
          '(ma’din) aturannya berbeda dan di luar cakupan kalkulator ini.' },
        { tipe: 'indonesia', teks: 'Di Indonesia, temuan benda purbakala/cagar budaya ' +
          'wajib dilaporkan kepada negara menurut UU Cagar Budaya — pastikan temuanmu ' +
          'bukan kategori itu sebelum menganggapnya milik pribadi.' }
      ],
      rincian: [{ label: 'Nilai temuan', nilai: r.nilai }]
    };
  }

  root.ZakatRikaz = { hitung: hitung };
})(typeof window !== 'undefined' ? window : globalThis);
