/*
 * Kasus uji mesin zakat.
 *
 * Jawaban bakunya dari nash dan tabel kitab fiqh — terutama batas-batas
 * pergantian tarif ternak dari surat Abu Bakar dan hadits Mu'adz, yang
 * paling rawan salah hitung. Kalau ada satu saja yang merah, hasil
 * kalkulator tidak boleh dipercaya.
 *
 * Jalankan di browser lewat tests.html, atau dari terminal:
 *
 *   node -e "['zakat/const','zakat/dagang','zakat/uang','zakat/penghasilan',
 *     'zakat/tani','zakat/ternak','zakat/rikaz','zakat/fitrah','zakat/solve',
 *     'dalil','tests'].forEach(m=>require('./js/'+m+'.js'));
 *     const h=Tests.jalankan();const g=h.filter(x=>!x.lulus);
 *     g.forEach(x=>console.log('GAGAL',x.nama,x.pesan));
 *     console.log((h.length-g.length)+'/'+h.length+' lulus')"
 */

(function (root) {
  'use strict';

  var KASUS = [];
  function kasus(nama, fn) { KASUS.push({ nama: nama, fn: fn }); }

  // ── Perkakas ─────────────────────────────────────────────────────
  var HARGA = { emas: 2000000, perak: 25000, beras: 15000 };
  var HARI_INI = new Date(2026, 7, 16).getTime();   // 16 Agustus 2026
  var HARI_MS = 24 * 60 * 60 * 1000;

  /** Bangun masukan lengkap dengan bawaan yang wajar, lalu timpa sebagian. */
  function masukan(t) {
    var dasar = {
      mode: 'murni',
      harga: HARGA,
      haul: { status: 'sudah' },
      hariIni: HARI_INI
    };
    for (var k in t) dasar[k] = t[k];
    return dasar;
  }

  function hitung(t) { return root.Zakat.hitung(masukan(t)); }

  function ambil(hasil, id) {
    for (var i = 0; i < hasil.kelompok.length; i++) {
      if (hasil.kelompok[i].id === id) return hasil.kelompok[i];
    }
    return null;
  }

  function sama(a, b, pesan) {
    if (a === b) return null;
    return (pesan || 'nilai') + ': dapat ' + JSON.stringify(a) +
      ', harusnya ' + JSON.stringify(b);
  }

  function memuat(teks, potongan, pesan) {
    if (String(teks).indexOf(potongan) >= 0) return null;
    return (pesan || 'teks') + ' tidak memuat "' + potongan + '" — isinya: ' + teks;
  }

  function adaCatatan(k, tipe, potongan) {
    var kena = (k.catatan || []).some(function (c) {
      return c.tipe === tipe && c.teks.toLowerCase().indexOf(potongan.toLowerCase()) >= 0;
    });
    return kena ? null : 'tidak ada catatan ' + tipe + ' yang menyebut "' + potongan + '"';
  }

  // ═══ SIMPANAN: uang, emas, perak, dagang ═══════════════════════

  kasus('Uang 170 jt (tepat nisab emas) → wajib 4.250.000', function () {
    var k = ambil(hitung({ uang: { jumlah: 170000000 } }), 'simpanan');
    return sama(k.status, 'wajib') || sama(k.zakat.rp, 4250000);
  });

  kasus('Uang 169.999.999 (sehelai di bawah nisab) → belum wajib', function () {
    var k = ambil(hitung({ uang: { jumlah: 169999999 } }), 'simpanan');
    return sama(k.status, 'belumNisab') || sama(k.zakat.rp, null);
  });

  kasus('Di bawah nisab emas tapi di atas nisab perak → ada catatan pendapat perak', function () {
    var k = ambil(hitung({ uang: { jumlah: 100000000 } }), 'simpanan');
    return sama(k.status, 'belumNisab') || adaCatatan(k, 'khilaf', 'perak');
  });

  kasus('Uang 200 jt, hutang jatuh tempo 40 jt → bersih 160 jt, belum nisab', function () {
    var k = ambil(hitung({ uang: { jumlah: 200000000 },
      hutang: { jatuhTempo: 40000000 } }), 'simpanan');
    return sama(k.status, 'belumNisab') || sama(k.dasar, 160000000) ||
      adaCatatan(k, 'khilaf', 'hutang');
  });

  kasus('Uang 200 jt, hutang 20 jt → wajib atas 180 jt = 4.500.000', function () {
    var k = ambil(hitung({ uang: { jumlah: 200000000 },
      hutang: { jatuhTempo: 20000000 } }), 'simpanan');
    return sama(k.status, 'wajib') || sama(k.zakat.rp, 4500000);
  });

  kasus('Emas simpan 85 gram → wajib 4.250.000', function () {
    var k = ambil(hitung({ emas: { gramSimpan: 85 } }), 'simpanan');
    return sama(k.status, 'wajib') || sama(k.zakat.rp, 4250000);
  });

  kasus('Emas simpan 84 gram → belum nisab', function () {
    var k = ambil(hitung({ emas: { gramSimpan: 84 } }), 'simpanan');
    return sama(k.status, 'belumNisab');
  });

  kasus('Perhiasan dipakai 50 gram (tanpa opsi) → tidak dihitung + catatan khilaf', function () {
    var k = ambil(hitung({ uang: { jumlah: 100000000 },
      emas: { gramPakai: 50 } }), 'simpanan');
    return sama(k.dasar, 100000000) || adaCatatan(k, 'khilaf', 'perhiasan');
  });

  kasus('Hanya perhiasan dipakai → kelompok tetap tampil dengan penjelasan', function () {
    var k = ambil(hitung({ emas: { gramPakai: 50 } }), 'simpanan');
    return k ? (sama(k.status, 'tidakWajib') || memuat(k.alasan, 'perhiasan')) :
      'kelompok simpanan hilang tanpa penjelasan';
  });

  kasus('Opsi zakati perhiasan dinyalakan → 50+50 gram = 200 jt, wajib 5 jt', function () {
    var k = ambil(hitung({ emas: { gramSimpan: 50, gramPakai: 50, zakatiPakai: true } }),
      'simpanan');
    return sama(k.status, 'wajib') || sama(k.zakat.rp, 5000000);
  });

  kasus('Perak 600 gram saja (Rp 15 jt) → wajib lewat nisab perak sendiri: 375.000', function () {
    var k = ambil(hitung({ perak: { gram: 600 } }), 'simpanan');
    return sama(k.status, 'wajib') || sama(k.zakat.rp, 375000) ||
      memuat(k.alasan, 'nisabnya sendiri');
  });

  kasus('Perak 500 gram saja → belum nisab', function () {
    var k = ambil(hitung({ perak: { gram: 500 } }), 'simpanan');
    return sama(k.status, 'belumNisab');
  });

  kasus('Piutang lancar 200 jt ikut dihitung → wajib 5 jt', function () {
    var k = ambil(hitung({ piutang: { lancar: 200000000 } }), 'simpanan');
    return sama(k.status, 'wajib') || sama(k.zakat.rp, 5000000);
  });

  // ═══ HAUL ══════════════════════════════════════════════════════

  kasus('Haul belum, sejak Jan 2026 → jatuh tempo sekitar Desember 2026', function () {
    var k = ambil(hitung({ uang: { jumlah: 200000000 },
      haul: { status: 'belum', sejak: '2026-01' } }), 'simpanan');
    var jatuh = new Date(2026, 0, 1).getTime() + 354 * HARI_MS;
    return sama(k.status, 'belumHaul') ||
      sama(k.kapan.tanggalMs, jatuh) ||
      memuat(k.kapan.teks, 'Desember 2026') ||
      sama(k.zakat.rp, 5000000, 'perkiraan zakat saat jatuh tempo');
  });

  kasus('Belum haul → tidak masuk total sekarang, masuk total nanti', function () {
    var h = hitung({ uang: { jumlah: 200000000 },
      haul: { status: 'belum', sejak: '2026-01' } });
    return sama(h.totalRp, 0, 'totalRp') || sama(h.totalRpNanti, 5000000, 'totalRpNanti');
  });

  kasus('Haul "tidak tahu" → dihitung wajib + catatan syarat haul', function () {
    var k = ambil(hitung({ uang: { jumlah: 170000000 },
      haul: { status: 'tidakTahu' } }), 'simpanan');
    return sama(k.status, 'wajib') || adaCatatan(k, 'info', 'satu tahun');
  });

  kasus('Haul belum tanpa tanggal → teks generik ±354 hari', function () {
    var k = ambil(hitung({ uang: { jumlah: 200000000 },
      haul: { status: 'belum' } }), 'simpanan');
    return sama(k.status, 'belumHaul') || memuat(k.kapan.teks, '354');
  });

  // ═══ PERDAGANGAN ═══════════════════════════════════════════════

  kasus('Dagang: 100+50+30 − 10 = 170 jt → wajib 4.250.000', function () {
    var k = ambil(hitung({ dagang: { nilaiBarang: 100000000, kasUsaha: 50000000,
      piutangLancar: 30000000, hutangJatuhTempo: 10000000 } }), 'simpanan');
    return sama(k.status, 'wajib') || sama(k.zakat.rp, 4250000);
  });

  kasus('Hutang usaha melebihi harta dagang → dagang 0, uang tetap dihitung', function () {
    var k = ambil(hitung({ uang: { jumlah: 170000000 },
      dagang: { nilaiBarang: 20000000, hutangJatuhTempo: 50000000 } }), 'simpanan');
    return sama(k.status, 'wajib') || sama(k.zakat.rp, 4250000);
  });

  kasus('Uang 100 jt + dagang bersih 70 jt digabung → mencapai nisab', function () {
    var k = ambil(hitung({ uang: { jumlah: 100000000 },
      dagang: { nilaiBarang: 70000000 } }), 'simpanan');
    return sama(k.status, 'wajib') || sama(k.zakat.rp, 4250000);
  });

  kasus('Gabungan uang+dagang masih di bawah nisab → belum wajib', function () {
    var k = ambil(hitung({ uang: { jumlah: 100000000 },
      dagang: { nilaiBarang: 100000000, hutangJatuhTempo: 40000000 } }), 'simpanan');
    return sama(k.status, 'belumNisab') || sama(k.dasar, 160000000);
  });

  // ═══ PENGHASILAN ═══════════════════════════════════════════════

  kasus('Mode murni: penghasilan → info, tanpa angka zakat tersendiri', function () {
    var k = ambil(hitung({ penghasilan: { perBulan: 20000000 } }), 'penghasilan');
    return sama(k.status, 'info') || sama(k.zakat.rp, null);
  });

  kasus('Mode murni: penghasilan tidak menambah total', function () {
    var h = hitung({ penghasilan: { perBulan: 20000000 } });
    return sama(h.totalRp, 0);
  });

  kasus('Mode Indonesia: 15 jt/bln + bonus 20 jt = 200 jt/thn → wajib 5 jt', function () {
    var k = ambil(hitung({ mode: 'indonesia',
      penghasilan: { perBulan: 15000000, bonusSetahun: 20000000 } }), 'penghasilan');
    return sama(k.status, 'wajib') || sama(k.zakat.rp, 5000000) ||
      sama(k.zakat.perBulanRp, 375000, 'zakat per bulan');
  });

  kasus('Mode Indonesia: 10 jt/bln (120 jt/thn) → belum nisab', function () {
    var k = ambil(hitung({ mode: 'indonesia',
      penghasilan: { perBulan: 10000000 } }), 'penghasilan');
    return sama(k.status, 'belumNisab') || sama(k.zakat.rp, null);
  });

  kasus('Mode Indonesia: tepat di nisab tahunan (170 jt) → wajib', function () {
    var k = ambil(hitung({ mode: 'indonesia',
      penghasilan: { perBulan: 10000000, bonusSetahun: 50000000 } }), 'penghasilan');
    return sama(k.status, 'wajib') || sama(k.zakat.rp, 4250000);
  });

  // ═══ PERTANIAN ═════════════════════════════════════════════════

  kasus('Gabah 652 kg → belum nisab (batas 653)', function () {
    var k = ambil(hitung({ tani: { kg: 652, bentuk: 'gabah', pengairan: 'hujan' } }), 'tani');
    return sama(k.status, 'belumNisab');
  });

  kasus('Gabah 653 kg tadah hujan → 10% = 65.3 kg', function () {
    var k = ambil(hitung({ tani: { kg: 653, bentuk: 'gabah', pengairan: 'hujan' } }), 'tani');
    return sama(k.status, 'wajib') || sama(k.zakat.natura, '65.3 kg gabah') ||
      sama(k.zakat.rp, null, 'gabah tidak dikonversi rupiah');
  });

  kasus('Gabah 653 kg irigasi berbiaya → 5% = 32.7 kg', function () {
    var k = ambil(hitung({ tani: { kg: 653, bentuk: 'gabah', pengairan: 'irigasi' } }), 'tani');
    return sama(k.zakat.natura, '32.7 kg gabah');
  });

  kasus('Beras 519 kg → belum nisab (batas 520)', function () {
    var k = ambil(hitung({ tani: { kg: 519, bentuk: 'beras', pengairan: 'hujan' } }), 'tani');
    return sama(k.status, 'belumNisab');
  });

  kasus('Beras 520 kg hujan → 52 kg, setara Rp 780.000', function () {
    var k = ambil(hitung({ tani: { kg: 520, bentuk: 'beras', pengairan: 'hujan' } }), 'tani');
    return sama(k.zakat.natura, '52 kg beras') || sama(k.zakat.rp, 780000);
  });

  kasus('Beras 1000 kg irigasi → 50 kg, setara Rp 750.000', function () {
    var k = ambil(hitung({ tani: { kg: 1000, bentuk: 'beras', pengairan: 'irigasi' } }), 'tani');
    return sama(k.zakat.natura, '50 kg beras') || sama(k.zakat.rp, 750000);
  });

  kasus('Pertanian tidak menunggu haul — wajib walau haul "belum"', function () {
    var k = ambil(hitung({ haul: { status: 'belum', sejak: '2026-06' },
      tani: { kg: 1000, bentuk: 'gabah', pengairan: 'hujan' } }), 'tani');
    return sama(k.status, 'wajib') || memuat(k.kapan.teks, 'panen');
  });

  // ═══ KAMBING (surat Abu Bakar) ═════════════════════════════════

  function kambing(ekor, t) {
    t = t || {};
    return ambil(hitung({ ternak: { kambing: { ekor: ekor,
      digembalakan: t.gembala !== false, untukDagang: !!t.dagang } },
      haul: t.haul || { status: 'sudah' } }), 'ternak-kambing');
  }

  kasus('Kambing 39 → belum nisab', function () {
    return sama(kambing(39).status, 'belumNisab');
  });
  kasus('Kambing 40 → 1 ekor', function () {
    var k = kambing(40);
    return sama(k.status, 'wajib') || sama(k.zakat.natura, '1 ekor kambing');
  });
  kasus('Kambing 120 → masih 1 ekor', function () {
    return sama(kambing(120).zakat.natura, '1 ekor kambing');
  });
  kasus('Kambing 121 → 2 ekor', function () {
    return sama(kambing(121).zakat.natura, '2 ekor kambing');
  });
  kasus('Kambing 200 → 2 ekor', function () {
    return sama(kambing(200).zakat.natura, '2 ekor kambing');
  });
  kasus('Kambing 201 → 3 ekor', function () {
    return sama(kambing(201).zakat.natura, '3 ekor kambing');
  });
  kasus('Kambing 399 → masih 3 ekor (tiap 100 setelah 300)', function () {
    return sama(kambing(399).zakat.natura, '3 ekor kambing');
  });
  kasus('Kambing 400 → 4 ekor', function () {
    return sama(kambing(400).zakat.natura, '4 ekor kambing');
  });
  kasus('Kambing 500 → 5 ekor', function () {
    return sama(kambing(500).zakat.natura, '5 ekor kambing');
  });

  // ═══ SAPI (hadits Mu'adz) ══════════════════════════════════════

  var sapi = root.ZakatTernak.zakatSapi;

  kasus('Sapi 30 → 1 tabi’', function () {
    var t = sapi(30);
    return memuat(t, '1 tabi’') || (t.indexOf('musinnah') < 0 ? null : 'tidak boleh ada musinnah: ' + t);
  });
  kasus('Sapi 39 → masih 1 tabi’', function () {
    return memuat(sapi(39), '1 tabi’');
  });
  kasus('Sapi 40 → 1 musinnah', function () {
    var t = sapi(40);
    return memuat(t, '1 musinnah') || (t.indexOf('tabi’') < 0 ? null : 'tidak boleh ada tabi’: ' + t);
  });
  kasus('Sapi 59 → masih 1 musinnah', function () {
    return memuat(sapi(59), '1 musinnah');
  });
  kasus('Sapi 60 → 2 tabi’', function () {
    return memuat(sapi(60), '2 tabi’');
  });
  kasus('Sapi 70 → 1 tabi’ + 1 musinnah', function () {
    var t = sapi(70);
    return memuat(t, '1 tabi’') || memuat(t, '1 musinnah');
  });
  kasus('Sapi 80 → 2 musinnah', function () {
    return memuat(sapi(80), '2 musinnah');
  });
  kasus('Sapi 90 → 3 tabi’', function () {
    return memuat(sapi(90), '3 tabi’');
  });
  kasus('Sapi 100 → 2 tabi’ + 1 musinnah', function () {
    var t = sapi(100);
    return memuat(t, '2 tabi’') || memuat(t, '1 musinnah');
  });
  kasus('Sapi 120 → 4 tabi’ ATAU 3 musinnah (dua-duanya sah)', function () {
    var t = sapi(120);
    return memuat(t, '4 tabi’') || memuat(t, '3 musinnah') || memuat(t, 'atau');
  });
  kasus('Sapi 29 → belum nisab', function () {
    var k = ambil(hitung({ ternak: { sapi: { ekor: 29, digembalakan: true } } }), 'ternak-sapi');
    return sama(k.status, 'belumNisab');
  });

  // ═══ UNTA (surat Abu Bakar) ════════════════════════════════════

  var unta = root.ZakatTernak.zakatUnta;

  kasus('Unta 5 → 1 ekor kambing', function () { return sama(unta(5), '1 ekor kambing'); });
  kasus('Unta 24 → 4 ekor kambing', function () { return sama(unta(24), '4 ekor kambing'); });
  kasus('Unta 25 → bintu makhadh', function () { return memuat(unta(25), 'bintu makhadh'); });
  kasus('Unta 35 → masih bintu makhadh', function () { return memuat(unta(35), 'bintu makhadh'); });
  kasus('Unta 36 → bintu labun', function () { return memuat(unta(36), '1 bintu labun'); });
  kasus('Unta 46 → hiqqah', function () { return memuat(unta(46), '1 hiqqah'); });
  kasus('Unta 61 → jadza’ah', function () { return memuat(unta(61), 'jadza’ah'); });
  kasus('Unta 76 → 2 bintu labun', function () { return memuat(unta(76), '2 bintu labun'); });
  kasus('Unta 91 → 2 hiqqah', function () { return memuat(unta(91), '2 hiqqah'); });
  kasus('Unta 120 → masih 2 hiqqah', function () { return memuat(unta(120), '2 hiqqah'); });
  kasus('Unta 121 → 3 bintu labun', function () { return memuat(unta(121), '3 bintu labun'); });
  kasus('Unta 130 → 2 bintu labun + 1 hiqqah', function () {
    var t = unta(130);
    return memuat(t, '2 bintu labun') || memuat(t, '1 hiqqah');
  });
  kasus('Unta 150 → 3 hiqqah', function () { return memuat(unta(150), '3 hiqqah'); });
  kasus('Unta 200 → 5 bintu labun ATAU 4 hiqqah', function () {
    var t = unta(200);
    return memuat(t, '5 bintu labun') || memuat(t, '4 hiqqah') || memuat(t, 'atau');
  });
  kasus('Unta 4 → belum nisab', function () {
    var k = ambil(hitung({ ternak: { unta: { ekor: 4, digembalakan: true } } }), 'ternak-unta');
    return sama(k.status, 'belumNisab');
  });

  // ═══ SYARAT TERNAK ═════════════════════════════════════════════

  kasus('Ternak dikandangkan → tidak wajib (jumhur) + catatan pendapat Maliki', function () {
    var k = kambing(50, { gembala: false });
    return sama(k.status, 'tidakWajib') || adaCatatan(k, 'khilaf', 'maliki');
  });

  kasus('Ternak untuk dagang → diarahkan ke zakat perdagangan', function () {
    var k = kambing(50, { dagang: true });
    return sama(k.status, 'info') || memuat(k.alasan, 'PERDAGANGAN');
  });

  kasus('Ternak belum haul → tarif tetap ditunjukkan, status belum haul', function () {
    var k = kambing(50, { haul: { status: 'belum', sejak: '2026-06' } });
    return sama(k.status, 'belumHaul') || sama(k.zakat.natura, '1 ekor kambing');
  });

  // ═══ RIKAZ ═════════════════════════════════════════════════════

  kasus('Rikaz 100 jt → seperlima = 20 jt, seketika', function () {
    var k = ambil(hitung({ rikaz: { nilai: 100000000 } }), 'rikaz');
    return sama(k.status, 'wajib') || sama(k.zakat.rp, 20000000) ||
      sama(k.kapan.tipe, 'segera');
  });

  kasus('Rikaz masuk total rupiah', function () {
    var h = hitung({ rikaz: { nilai: 100000000 } });
    return sama(h.totalRp, 20000000);
  });

  // ═══ FITRAH ════════════════════════════════════════════════════

  kasus('Fitrah 4 jiwa → 10 kg beras', function () {
    var h = hitung({ fitrah: { jiwa: 4 } });
    return sama(h.fitrah.zakat.natura, '10 kg beras') ||
      sama(h.fitrah.zakat.rp, null, 'mode murni tanpa konversi uang');
  });

  kasus('Fitrah mode Indonesia → konversi Rp 150.000 (4 × 2,5 kg × 15rb)', function () {
    var h = hitung({ mode: 'indonesia', fitrah: { jiwa: 4 } });
    return sama(h.fitrah.zakat.rp, 150000);
  });

  kasus('Fitrah 1 jiwa → 2.5 kg', function () {
    var h = hitung({ fitrah: { jiwa: 1 } });
    return sama(h.fitrah.zakat.kg, 2.5);
  });

  kasus('Fitrah tidak dijumlahkan ke total zakat mal', function () {
    var h = hitung({ mode: 'indonesia', uang: { jumlah: 170000000 }, fitrah: { jiwa: 4 } });
    return sama(h.totalRp, 4250000);
  });

  // ═══ GABUNGAN & MODE ═══════════════════════════════════════════

  kasus('Gabungan (Indonesia): uang 170 jt + rikaz 10 jt + gaji 200 jt/thn → 11,25 jt', function () {
    var h = hitung({ mode: 'indonesia', uang: { jumlah: 170000000 },
      rikaz: { nilai: 10000000 },
      penghasilan: { perBulan: 15000000, bonusSetahun: 20000000 } });
    return sama(h.totalRp, 4250000 + 2000000 + 5000000);
  });

  kasus('Kasus yang sama di mode murni → 6,25 jt (selisihnya = zakat penghasilan)', function () {
    var h = hitung({ mode: 'murni', uang: { jumlah: 170000000 },
      rikaz: { nilai: 10000000 },
      penghasilan: { perBulan: 15000000, bonusSetahun: 20000000 } });
    return sama(h.totalRp, 4250000 + 2000000);
  });

  kasus('Urutan waktu: "sekarang" tampil sebelum fitrah Ramadan', function () {
    var h = hitung({ uang: { jumlah: 170000000 }, fitrah: { jiwa: 2 } });
    if (h.timeline.length < 2) return 'timeline kurang dari 2 baris';
    return sama(h.timeline[0].id, 'simpanan') ||
      sama(h.timeline[h.timeline.length - 1].id, 'fitrah');
  });

  kasus('Masukan kosong → tidak ada kelompok, tidak ada kewajiban', function () {
    var h = hitung({});
    return sama(h.kelompok.length, 0) || sama(h.adaWajib, false) || sama(h.totalRp, 0);
  });

  kasus('Natura (tani) tidak dobel ke total rupiah', function () {
    var h = hitung({ uang: { jumlah: 170000000 },
      tani: { kg: 1000, bentuk: 'beras', pengairan: 'hujan' } });
    return sama(h.totalRp, 4250000) ||
      sama(h.natura.length, 1) || sama(h.natura[0].rp, 1500000);
  });

  kasus('Nilai 0 atau kosong tidak memunculkan kelompok', function () {
    var h = hitung({ uang: { jumlah: 0 }, rikaz: { nilai: 0 }, tani: { kg: 0 },
      penghasilan: { perBulan: 0 } });
    return sama(h.kelompok.length, 0);
  });

  // ═══ KETERKAITAN DALIL ═════════════════════════════════════════

  kasus('Setiap id dalil yang dirujuk mesin ada di js/dalil.js', function () {
    if (!root.Dalil) return null;   // dalil.js tidak ikut dimuat — uji dilewati
    var hilang = [];
    var h = hitung({ mode: 'indonesia', uang: { jumlah: 170000000 },
      emas: { gramSimpan: 10, gramPakai: 5 }, perak: { gram: 100 },
      dagang: { nilaiBarang: 10000000 }, penghasilan: { perBulan: 20000000 },
      tani: { kg: 1000, bentuk: 'gabah', pengairan: 'hujan' },
      ternak: { kambing: { ekor: 50, digembalakan: true },
        sapi: { ekor: 40, digembalakan: true }, unta: { ekor: 30, digembalakan: true } },
      rikaz: { nilai: 10000000 }, fitrah: { jiwa: 4 } });
    h.kelompok.concat([h.fitrah]).forEach(function (k) {
      (k.dalil || []).forEach(function (id) {
        if (!root.Dalil.DATA[id] && hilang.indexOf(id) < 0) hilang.push(id);
      });
    });
    return hilang.length ? 'dalil tidak ditemukan: ' + hilang.join(', ') : null;
  });

  kasus('Setiap segmen asnaf menunjuk ruas yang ada di QS At-Taubah 60', function () {
    if (!root.Dalil) return null;
    var ayat = root.Dalil.DATA['qs9-60'];
    if (!ayat || !ayat.segmen) return 'qs9-60 tidak punya segmen';
    var ids = ayat.segmen.map(function (s) { return s.id; });
    var hilang = root.ZakatConst.ASNAF.filter(function (a) {
      return ids.indexOf(a.segmen) < 0;
    }).map(function (a) { return a.id; });
    return hilang.length ? 'ruas tidak ada: ' + hilang.join(', ') : null;
  });

  // ── Pelaksana ────────────────────────────────────────────────────
  function jalankan() {
    return KASUS.map(function (k) {
      var pesan = null;
      try { pesan = k.fn(); }
      catch (e) { pesan = 'ERROR: ' + (e && e.message ? e.message : e); }
      return { nama: k.nama, lulus: pesan == null, pesan: pesan };
    });
  }

  root.Tests = { jalankan: jalankan };
})(typeof window !== 'undefined' ? window : globalThis);
