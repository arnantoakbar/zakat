/*
 * Zakat fitrah.
 *
 * Berbeda dari semua zakat mal: bukan atas harta, tapi atas JIWA — wajib
 * bagi setiap muslim yang pada malam dan hari raya punya kelebihan bahan
 * makanan, untuk dirinya dan setiap orang yang dinafkahinya. Besarnya satu
 * sha' makanan pokok per jiwa (konversi baku BAZNAS: 2,5 kg beras), dan
 * WAJIB sampai di tangan penerima sebelum shalat Idulfitri.
 *
 * Menurut nash ia dibayar dengan makanan pokok. Membayar dengan uang
 * senilainya adalah pendapat mazhab Hanafi yang diadopsi praktik BAZNAS —
 * karena itu konversi rupiahnya hanya dihitung di mode "+ Hukum Indonesia".
 */

(function (root) {
  'use strict';

  var C = root.ZakatConst;

  /**
   * @param {{jiwa:number}|null} f
   * @param {{beras:number}} harga — Rp per kg
   * @param {'murni'|'indonesia'} mode
   */
  function hitung(f, harga, mode) {
    if (!f || !(f.jiwa > 0)) return null;

    var jiwa = Math.round(f.jiwa);
    var kg = Math.round(jiwa * C.FITRAH_KG_PER_JIWA * 10) / 10;
    var pakaiUang = mode === 'indonesia' && harga.beras > 0;
    var rp = pakaiUang ? Math.round(kg * harga.beras) : null;

    var catatan = [
      { tipe: 'info', teks: 'Wajib bagi yang punya kelebihan bahan makanan pada malam dan ' +
        'hari raya — untuk diri sendiri dan setiap orang yang kamu nafkahi (istri, anak, ' +
        'orang tua yang ditanggung). Bayi yang lahir sebelum matahari terbenam di akhir ' +
        'Ramadan ikut dihitung.' }
    ];
    if (pakaiUang) {
      catatan.push({ tipe: 'indonesia', teks: 'Konversi ke uang mengikuti pendapat mazhab ' +
        'Hanafi yang dipakai BAZNAS. Nominal resmi per daerah ditetapkan SK BAZNAS ' +
        'setempat tiap tahun — angka di sini memakai harga beras yang kamu isi, jadi ' +
        'samakan dengan harga beras yang biasa kamu makan.' });
    } else {
      catatan.push({ tipe: 'khilaf', teks: 'Menurut nash, fitrah dibayar dengan makanan ' +
        'pokok (di Indonesia: beras). Pendapat mazhab Hanafi membolehkan uang senilainya — ' +
        'nyalakan mode "+ Hukum Indonesia" untuk melihat konversinya.' });
    }

    return {
      id: 'fitrah',
      label: 'Zakat fitrah',
      ikon: 'i-users-round',
      status: 'wajib',
      alasan: jiwa + ' jiwa × 1 sha’ (2,5 kg beras) = ' + kg + ' kg. Ditunaikan di bulan ' +
        'Ramadan, wajib sampai ke penerima sebelum shalat Idulfitri.',
      dasar: jiwa,
      nisab: { teks: 'punya kelebihan makanan di malam & hari raya' },
      zakat: { rp: rp, natura: kg + ' kg beras', kg: kg },
      kapan: { tipe: 'ramadan', teks: 'di bulan Ramadan — paling utama 1–2 hari menjelang ' +
        'Idulfitri, dan wajib sebelum shalat Id' },
      dalil: ['hr-fitrah', 'hr-fitrah-waktu'],
      catatan: catatan,
      rincian: [{ label: 'Jiwa yang ditanggung', nilai: jiwa + ' orang' }]
    };
  }

  root.ZakatFitrah = { hitung: hitung };
})(typeof window !== 'undefined' ? window : globalThis);
