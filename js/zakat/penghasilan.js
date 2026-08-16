/*
 * Zakat penghasilan (profesi).
 *
 * Ini satu-satunya jenis di kalkulator ini yang TIDAK punya nash tersendiri.
 * Dasarnya keumuman QS Al-Baqarah 267 ("nafkahkanlah sebagian hasil
 * usahamu") yang di-qiyas-kan ke zakat emas oleh ulama kontemporer, dan di
 * Indonesia ditetapkan lewat Fatwa MUI No. 3 Tahun 2003: nisab setara 85
 * gram emas per tahun, kadar 2,5%, boleh ditunaikan tiap menerima
 * penghasilan.
 *
 * Karena itu ia diperlakukan berbeda menurut mode:
 *  - Mode "Qur'an & Sunnah": tidak dihitung sebagai zakat tersendiri.
 *    Gaji yang mengendap menjadi tabungan ikut zakat simpanan biasa
 *    (nisab + haul). Ini dijelaskan terus terang, bukan disembunyikan.
 *  - Mode "+ Hukum Indonesia": dihitung menurut fatwa di atas.
 */

(function (root) {
  'use strict';

  var C = root.ZakatConst;

  /**
   * @param {{perBulan:number, bonusSetahun:number}|null} p
   * @param {{emas:number}} harga
   * @param {'murni'|'indonesia'} mode
   */
  function hitung(p, harga, mode) {
    if (!p) return null;
    var perBulan = p.perBulan || 0;
    var bonus = p.bonusSetahun || 0;
    if (perBulan + bonus <= 0) return null;

    var setahun = perBulan * 12 + bonus;
    var nisabTahun = Math.round(C.NISAB_EMAS_GRAM * harga.emas);

    if (mode !== 'indonesia') {
      return {
        id: 'penghasilan',
        label: 'Penghasilan & gaji',
        ikon: 'i-gaji',
        status: 'info',
        alasan: 'Dalam Al-Qur’an dan hadits sahih tidak ada zakat tersendiri atas gaji. ' +
          'Yang diatur nash adalah zakat atas SIMPANAN: gaji yang mengendap menjadi tabungan ' +
          'ikut dihitung di kelompok "Uang, emas, perak & dagang" setelah mencapai nisab dan ' +
          'tersimpan satu tahun.',
        dasar: setahun,
        nisab: { rp: nisabTahun, teks: 'setara 85 gram emas setahun' },
        zakat: { rp: null, natura: null },
        kapan: { tipe: 'nanti', teks: 'lewat zakat simpanan, saat nisab dan haulnya terpenuhi' },
        dalil: ['qs2-267'],
        catatan: [{ tipe: 'indonesia', teks: 'Ulama kontemporer dan Fatwa MUI No. 3 Tahun ' +
          '2003 menetapkan zakat penghasilan lewat qiyas. Nyalakan mode "+ Hukum Indonesia" ' +
          'untuk melihat perhitungannya dan membandingkan angkanya sendiri.' }],
        rincian: []
      };
    }

    var wajib = setahun >= nisabTahun;
    var zakatTahun = Math.round(setahun * C.KADAR_SIMPANAN);
    var zakatBulan = Math.round(perBulan * C.KADAR_SIMPANAN);

    var rincian = [];
    if (perBulan) rincian.push({ label: 'Penghasilan per bulan', nilai: perBulan });
    if (bonus) rincian.push({ label: 'Bonus & THR setahun', nilai: bonus });

    var catatan = [
      { tipe: 'indonesia', teks: 'Dasar: Fatwa MUI No. 3 Tahun 2003 tentang zakat ' +
        'penghasilan — qiyas ulama kontemporer, bukan nash langsung. Dihitung dari ' +
        'penghasilan kotor; sebagian ulama menghitung setelah dikurangi kebutuhan pokok, ' +
        'dan itu juga dibolehkan fatwa.' },
      { tipe: 'info', teks: 'Supaya tidak dobel: penghasilan yang sudah dizakati saat ' +
        'diterima tidak perlu dizakati lagi tahun itu. Sisanya yang mengendap jadi tabungan ' +
        'tetap masuk zakat simpanan pada haul TAHUN BERIKUTNYA.' }
    ];

    return {
      id: 'penghasilan',
      label: 'Penghasilan & gaji',
      ikon: 'i-gaji',
      status: wajib ? 'wajib' : 'belumNisab',
      alasan: wajib
        ? 'Penghasilanmu setahun (' + setahun.toLocaleString('id-ID') + ' rupiah) melewati ' +
          'nisab setara 85 gram emas, jadi menurut Fatwa MUI kena zakat 2,5%.'
        : 'Penghasilanmu setahun masih di bawah nisab setara 85 gram emas, jadi menurut ' +
          'Fatwa MUI belum wajib zakat penghasilan.',
      dasar: setahun,
      nisab: { rp: nisabTahun, teks: 'setara 85 gram emas setahun' },
      persenNisab: nisabTahun ? Math.min(999, Math.round(setahun / nisabTahun * 100)) : 0,
      zakat: wajib
        ? { rp: zakatTahun, natura: null, perBulanRp: zakatBulan }
        : { rp: null, natura: null },
      kapan: wajib
        ? { tipe: 'rutin', teks: 'tiap menerima gaji (' + zakatBulan.toLocaleString('id-ID') +
            ' rupiah/bulan) atau sekali setahun' }
        : { tipe: 'nanti', teks: 'saat penghasilan setahunmu mencapai nisab' },
      dalil: ['qs2-267'],
      hukumId: ['mui-3-2003'],
      catatan: catatan,
      rincian: rincian
    };
  }

  root.ZakatPenghasilan = { hitung: hitung };
})(typeof window !== 'undefined' ? window : globalThis);
