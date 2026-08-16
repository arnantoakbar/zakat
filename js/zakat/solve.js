/*
 * Orkestrator.
 *
 * Menerima seluruh isian pemakai + harga acuan + mode dasar hukum, lalu
 * memanggil tiap modul dan merangkai hasilnya menjadi satu objek yang siap
 * ditampilkan: kelompok per jenis harta, total rupiah, zakat natura,
 * fitrah, dan urutan waktu pembayaran.
 *
 * Mesin ini murni — tidak menyentuh DOM, tidak menyimpan apa pun, tidak
 * memanggil jaringan. Menjalankannya dua kali dengan mode berbeda adalah
 * cara halaman hasil menunjukkan APA PERSISNYA yang berubah ketika aturan
 * Indonesia (fatwa MUI dsb.) dinyalakan di atas nash.
 *
 * Bentuk masukan:
 * {
 *   mode: 'murni' | 'indonesia',
 *   harga: { emas, perak, beras },          // Rp per gram / per kg
 *   uang: { jumlah },
 *   emas: { gramSimpan, gramPakai, zakatiPakai },
 *   perak: { gram },
 *   piutang: { lancar },
 *   dagang: { nilaiBarang, kasUsaha, piutangLancar, hutangJatuhTempo },
 *   penghasilan: { perBulan, bonusSetahun },
 *   tani: { kg, bentuk, pengairan },
 *   ternak: { kambing: {ekor, digembalakan, untukDagang}, sapi: {…}, unta: {…} },
 *   rikaz: { nilai },
 *   fitrah: { jiwa },
 *   hutang: { jatuhTempo },
 *   haul: { status: 'sudah'|'belum'|'tidakTahu', sejak: 'YYYY-MM' },
 *   hariIni: number (ms, untuk pengujian)
 * }
 */

(function (root) {
  'use strict';

  var URUTAN_WAKTU = { sekarang: 0, segera: 0, rutin: 1, tanggal: 2, panen: 3, ramadan: 4 };

  function hitung(input) {
    input = input || {};
    var mode = input.mode === 'indonesia' ? 'indonesia' : 'murni';
    var harga = input.harga || { emas: 0, perak: 0, beras: 0 };

    var kelompok = [];

    var dagang = root.ZakatDagang.hitung(input.dagang);
    var simpanan = root.ZakatUang.hitungSimpanan(input, harga, dagang);
    if (simpanan) kelompok.push(simpanan);

    var penghasilan = root.ZakatPenghasilan.hitung(input.penghasilan, harga, mode);
    if (penghasilan) kelompok.push(penghasilan);

    var tani = root.ZakatTani.hitung(input.tani, harga);
    if (tani) kelompok.push(tani);

    ['kambing', 'sapi', 'unta'].forEach(function (jenis) {
      if (input.ternak && input.ternak[jenis]) {
        var t = root.ZakatTernak.hitung(jenis, input.ternak[jenis], input);
        if (t) kelompok.push(t);
      }
    });

    var rikaz = root.ZakatRikaz.hitung(input.rikaz);
    if (rikaz) kelompok.push(rikaz);

    var fitrah = root.ZakatFitrah.hitung(input.fitrah, harga, mode);

    // ── Rangkuman ────────────────────────────────────────────────
    // Total rupiah hanya menjumlahkan kewajiban yang memang rupiah
    // (simpanan, penghasilan, rikaz). Zakat natura (kg panen, ekor ternak)
    // dan padanan rupiahnya TIDAK ikut dijumlahkan supaya tidak dobel.
    var totalRp = 0;
    var totalRpNanti = 0;   // yang menunggu haul — perkiraan saat jatuh tempo
    var natura = [];

    kelompok.forEach(function (k) {
      if (k.zakat && k.zakat.natura) {
        natura.push({ id: k.id, label: k.label, teks: k.zakat.natura,
          rp: k.zakat.rp, status: k.status });
      } else if (k.zakat && k.zakat.rp) {
        if (k.status === 'wajib') totalRp += k.zakat.rp;
        else if (k.status === 'belumHaul') totalRpNanti += k.zakat.rp;
      }
    });

    var timeline = [];
    kelompok.concat(fitrah ? [fitrah] : []).forEach(function (k) {
      if (!k.kapan || !(k.kapan.tipe in URUTAN_WAKTU)) return;
      if (k.status !== 'wajib' && k.status !== 'belumHaul') return;
      timeline.push({
        id: k.id, ikon: k.ikon, label: k.label,
        tipe: k.kapan.tipe, teks: k.kapan.teks,
        tanggalMs: k.kapan.tanggalMs || null,
        sisaHari: k.kapan.sisaHari != null ? k.kapan.sisaHari : null,
        jumlah: k.zakat.natura || (k.zakat.rp ? { rp: k.zakat.rp } : null),
        urut: URUTAN_WAKTU[k.kapan.tipe]
      });
    });
    timeline.sort(function (a, b) { return a.urut - b.urut; });

    var adaWajib = totalRp > 0 || natura.some(function (n) { return n.status === 'wajib'; }) ||
      !!fitrah;

    return {
      mode: mode,
      harga: harga,
      kelompok: kelompok,
      simpanan: simpanan,
      totalRp: totalRp,
      totalRpNanti: totalRpNanti,
      natura: natura,
      fitrah: fitrah,
      timeline: timeline,
      adaWajib: adaWajib,
      asnaf: root.ZakatConst.ASNAF
    };
  }

  root.Zakat = { hitung: hitung };
})(typeof window !== 'undefined' ? window : globalThis);
