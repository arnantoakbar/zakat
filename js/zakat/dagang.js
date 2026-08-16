/*
 * Harta perdagangan ('urudh tijarah).
 *
 * Yang dihitung adalah harta yang BERPUTAR dalam usaha: nilai barang
 * dagangan (dengan harga jual hari ini), kas usaha, dan piutang yang masih
 * diharapkan kembali — dikurangi hutang usaha yang jatuh tempo dalam waktu
 * dekat. Aset tetap seperti etalase, kendaraan operasional, dan bangunan
 * toko TIDAK dizakati, karena ia alat kerja, bukan barang dagangan.
 *
 * Hasil bersihnya tidak berdiri sendiri: ia digabung dengan uang, emas, dan
 * perak menjadi satu kelompok simpanan (lihat uang.js), karena nisab dan
 * kadarnya sama — 85 gram emas, 2,5%, setelah haul.
 */

(function (root) {
  'use strict';

  /**
   * @param {{nilaiBarang:number, kasUsaha:number, piutangLancar:number,
   *          hutangJatuhTempo:number}|null} d
   * @returns {null | {bersih:number, rincian:Array, catatan:Array}}
   */
  function hitung(d) {
    if (!d) return null;
    var barang  = d.nilaiBarang || 0;
    var kas     = d.kasUsaha || 0;
    var piutang = d.piutangLancar || 0;
    var hutang  = d.hutangJatuhTempo || 0;
    if (barang + kas + piutang <= 0) return null;

    var bruto  = barang + kas + piutang;
    var bersih = Math.max(0, bruto - hutang);

    var rincian = [];
    if (barang)  rincian.push({ label: 'Barang dagangan (harga jual hari ini)', nilai: barang });
    if (kas)     rincian.push({ label: 'Kas usaha', nilai: kas });
    if (piutang) rincian.push({ label: 'Piutang usaha yang lancar', nilai: piutang });
    if (hutang)  rincian.push({ label: 'Hutang usaha jatuh tempo', nilai: -hutang });

    var catatan = [];
    if (hutang >= bruto) {
      catatan.push({ tipe: 'info', teks: 'Hutang usahamu melebihi harta dagangnya, ' +
        'jadi tidak ada yang tersisa untuk dizakati dari usaha ini.' });
    }

    return { bersih: bersih, rincian: rincian, catatan: catatan };
  }

  root.ZakatDagang = { hitung: hitung };
})(typeof window !== 'undefined' ? window : globalThis);
