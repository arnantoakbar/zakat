/*
 * Kelompok simpanan: uang + emas + perak + piutang + harta dagang.
 *
 * Kelimanya dijadikan SATU kelompok karena aturannya sama — nisab setara
 * 85 gram emas, kadar 2,5%, ditunaikan setelah tersimpan satu tahun hijriah
 * (haul) — dan karena dalam fiqh nilainya memang saling digabung untuk
 * mencapai nisab. Menggabungkan uang kertas ke nisab emas adalah qiyas yang
 * dipakai BAZNAS/Kemenag; pendapat yang memakai nisab perak (lebih rendah,
 * lebih berhati-hati) ditampilkan sebagai catatan dengan angkanya sekalian,
 * bukan disembunyikan.
 *
 * Posisi yang diambil pada titik khilaf (dijelaskan di rujukan.html):
 *  - Hutang jatuh tempo dekat MENGURANGI harta zakat (jumhur, praktik
 *    BAZNAS). Pendapat mazhab Syafi'i qaul jadid — hutang tidak menghalangi
 *    zakat — dicatat di hasil.
 *  - Perhiasan emas yang dipakai sewajarnya TIDAK wajib dizakati (Syafi'i,
 *    mazhab mayoritas Indonesia). Yang mau lebih berhati-hati (pendapat
 *    Hanafi) bisa mencentang opsi ikut menzakatinya.
 *  - Piutang yang masih diharapkan kembali ikut dihitung; piutang macet
 *    tidak.
 */

(function (root) {
  'use strict';

  var C = root.ZakatConst;
  var HARI_MS = 24 * 60 * 60 * 1000;

  var NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  /** 'YYYY-MM' atau 'YYYY-MM-DD' → milidetik, atau null kalau tidak valid. */
  function parseSejak(s) {
    if (!s) return null;
    var m = String(s).match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
    if (!m) return null;
    return new Date(+m[1], +m[2] - 1, +(m[3] || 1)).getTime();
  }

  /**
   * Menentukan keadaan haul untuk kelompok yang mensyaratkannya.
   * `tidakTahu` diperlakukan seperti `sudah` — kebanyakan orang yang bertanya
   * memang sudah lama menyimpan hartanya, dan memilih membayar lebih awal
   * tidak merugikan siapa pun (ta'jil dibolehkan) — lalu syarat haulnya
   * dijelaskan lewat catatan, bukan disembunyikan.
   */
  function nilaiHaul(haul, hariIni) {
    haul = haul || { status: 'tidakTahu' };
    var kini = hariIni || Date.now();

    if (haul.status === 'belum') {
      var mulai = parseSejak(haul.sejak);
      if (mulai) {
        var jatuh = mulai + C.HAUL_HARI * HARI_MS;
        var d = new Date(jatuh);
        return {
          terpenuhi: false,
          tanggalMs: jatuh,
          sisaHari: Math.max(0, Math.ceil((jatuh - kini) / HARI_MS)),
          teks: 'sekitar ' + NAMA_BULAN[d.getMonth()] + ' ' + d.getFullYear()
        };
      }
      return { terpenuhi: false, tanggalMs: null, sisaHari: null,
        teks: 'saat simpananmu genap satu tahun hijriah (±354 hari) di atas nisab' };
    }

    return {
      terpenuhi: true,
      pasti: haul.status === 'sudah',
      teks: 'sekarang'
    };
  }

  /**
   * @param {object} input  — bentuk masukan lengkap (lihat solve.js)
   * @param {{emas:number, perak:number}} harga — Rp per gram
   * @param {null|{bersih:number, rincian:Array, catatan:Array}} dagang
   */
  function hitungSimpanan(input, harga, dagang) {
    var rincian = [];
    var catatan = [];

    var uang = input.uang && input.uang.jumlah > 0 ? input.uang.jumlah : 0;
    if (uang) rincian.push({ id: 'uang', label: 'Uang tunai, tabungan & deposito', nilai: uang });

    // Emas yang disimpan (batangan, koin, perhiasan yang tidak dipakai)
    // selalu dizakati. Perhiasan yang dipakai sewajarnya mengikuti pilihan.
    var e = input.emas || {};
    var gramEmas = (e.gramSimpan || 0) + (e.zakatiPakai ? (e.gramPakai || 0) : 0);
    if (gramEmas > 0) {
      rincian.push({ id: 'emas', label: 'Emas ' + gramEmas + ' gram',
        nilai: Math.round(gramEmas * harga.emas) });
    }
    if ((e.gramPakai || 0) > 0 && !e.zakatiPakai) {
      catatan.push({ tipe: 'khilaf', teks: 'Perhiasan emas ' + e.gramPakai + ' gram yang ' +
        'kamu pakai sehari-hari tidak ikut dihitung — menurut mazhab Syafi’i perhiasan ' +
        'yang dipakai sewajarnya tidak wajib dizakati. Mazhab Hanafi mewajibkannya; kalau ' +
        'mau lebih berhati-hati, centang opsinya di isian emas.' });
    }

    var gramPerak = input.perak && input.perak.gram > 0 ? input.perak.gram : 0;
    if (gramPerak) {
      rincian.push({ id: 'perak', label: 'Perak ' + gramPerak + ' gram',
        nilai: Math.round(gramPerak * harga.perak) });
    }

    var piutang = input.piutang && input.piutang.lancar > 0 ? input.piutang.lancar : 0;
    if (piutang) {
      rincian.push({ id: 'piutang', label: 'Piutang yang diharapkan kembali', nilai: piutang });
      catatan.push({ tipe: 'info', teks: 'Piutang yang macet atau kecil harapan kembalinya ' +
        'tidak perlu dihitung. Kalau suatu saat dibayar, zakati satu tahun saja saat menerimanya.' });
    }

    var adaDagang = !!(dagang && dagang.bersih >= 0 && dagang.rincian.length);
    if (adaDagang) {
      rincian.push({ id: 'dagang', label: 'Harta perdagangan (bersih)', nilai: dagang.bersih });
      catatan = catatan.concat(dagang.catatan);
    }

    if (!rincian.length) {
      // Satu-satunya isian adalah perhiasan yang dipakai: jangan menghilang
      // tanpa penjelasan — tampilkan kelompoknya dengan alasannya.
      if ((e.gramPakai || 0) > 0) {
        return {
          id: 'simpanan', label: 'Uang, emas, perak & dagang', ikon: 'i-wallet',
          status: 'tidakWajib',
          alasan: 'Satu-satunya isianmu adalah perhiasan yang dipakai sehari-hari. ' +
            'Menurut mazhab Syafi’i perhiasan yang dipakai sewajarnya tidak wajib ' +
            'dizakati, jadi tidak ada yang dihitung. Mazhab Hanafi mewajibkannya — ' +
            'centang opsinya di isian emas kalau mau ikut yang lebih berhati-hati.',
          dasar: 0, bruto: 0, hutang: 0,
          nisab: { rp: Math.round(C.NISAB_EMAS_GRAM * harga.emas),
            teks: 'setara 85 gram emas',
            perakRp: Math.round(C.NISAB_PERAK_GRAM * harga.perak) },
          persenNisab: 0,
          zakat: { rp: null, natura: null },
          kapan: { tipe: 'nanti', teks: '—' },
          dalil: ['hr-nisab-emas'],
          catatan: catatan, rincian: []
        };
      }
      return null;
    }

    var bruto = 0;
    rincian.forEach(function (r) { bruto += r.nilai; });

    var hutang = input.hutang && input.hutang.jatuhTempo > 0 ? input.hutang.jatuhTempo : 0;
    var bersih = Math.max(0, bruto - hutang);
    if (hutang) {
      catatan.push({ tipe: 'khilaf', teks: 'Hutang yang jatuh tempo dalam waktu dekat ' +
        'mengurangi harta yang dizakati (pendapat jumhur ulama, dipakai BAZNAS). Cicilan ' +
        'jangka panjang cukup dikurangkan sebesar yang harus dibayar tahun ini. Sebagian ' +
        'ulama Syafi’iyah berpendapat hutang tidak mengurangi sama sekali — kalau mau ' +
        'lebih berhati-hati, kosongkan isian hutangnya.' });
    }

    var nisabRp = Math.round(C.NISAB_EMAS_GRAM * harga.emas);
    var nisabPerakRp = Math.round(C.NISAB_PERAK_GRAM * harga.perak);
    var haul = nilaiHaul(input.haul, input.hariIni);

    // Perak punya nisab sendiri: 595 gram. Orang yang peraknya sudah sampai
    // nisab tetap wajib zakat meskipun NILAI rupiah seluruh hartanya belum
    // menyentuh nisab emas — nisab logam dihitung dari beratnya, bukan dari
    // kursnya ke logam lain.
    var perakSampaiNisab = gramPerak >= C.NISAB_PERAK_GRAM && bersih > 0;
    var capaiNisab = bersih >= nisabRp || perakSampaiNisab;

    var status, alasan, zakatRp = null, kapan;

    if (!capaiNisab) {
      status = 'belumNisab';
      alasan = 'Simpanan bersihmu belum mencapai nisab (setara 85 gram emas). ' +
        'Belum wajib zakat — kalau mau tetap bersedekah, itu sunnah yang dianjurkan.';
      kapan = { tipe: 'nanti', teks: 'saat simpananmu mencapai nisab dan tersimpan satu tahun' };
      if (bersih >= nisabPerakRp && gramPerak === 0) {
        catatan.push({ tipe: 'khilaf', teks: 'Catatan: dengan nisab PERAK (595 gram, ' +
          'pendapat yang lebih berhati-hati dan lebih menguntungkan penerima), hartamu ' +
          'SUDAH melewati nisab. Situs ini memakai nisab emas mengikuti praktik ' +
          'BAZNAS/Kemenag; kalau hatimu condong ke pendapat perak, zakatnya ' +
          Math.round(bersih * C.KADAR_SIMPANAN).toLocaleString('id-ID') + ' rupiah.' });
      }
    } else if (!haul.terpenuhi) {
      status = 'belumHaul';
      zakatRp = Math.round(bersih * C.KADAR_SIMPANAN);
      alasan = 'Simpananmu sudah melewati nisab, tapi belum genap satu tahun hijriah. ' +
        'Zakatnya jatuh tempo ' + haul.teks + '.';
      kapan = { tipe: 'tanggal', teks: haul.teks, tanggalMs: haul.tanggalMs,
        sisaHari: haul.sisaHari };
      catatan.push({ tipe: 'info', teks: 'Boleh dibayar lebih awal sebelum haulnya genap ' +
        '(ta’jil) — Rasulullah صلى الله عليه وسلم mengizinkannya untuk paman beliau, Abbas.' });
    } else {
      status = 'wajib';
      zakatRp = Math.round(bersih * C.KADAR_SIMPANAN);
      alasan = (bersih >= nisabRp
        ? 'Simpanan bersihmu sudah melewati nisab'
        : 'Perakmu sudah mencapai nisabnya sendiri (595 gram), jadi simpananmu wajib dizakati') +
        (haul.pasti ? ' dan sudah tersimpan lebih dari satu tahun.' : '.');
      kapan = { tipe: 'sekarang', teks: 'sekarang — tunaikan segera, jangan ditunda' };
      if (!haul.pasti) {
        catatan.push({ tipe: 'info', teks: 'Syarat wajibnya: harta ini sudah kamu simpan ' +
          'satu tahun hijriah (±354 hari) di atas nisab. Kalau belum genap, angka di atas ' +
          'menjadi perkiraan zakatmu saat haulnya sampai — dan membayarnya lebih awal ' +
          'dibolehkan (ta’jil).' });
      }
    }

    return {
      id: 'simpanan',
      label: 'Uang, emas, perak & dagang',
      ikon: 'i-wallet',
      status: status,
      alasan: alasan,
      dasar: bersih,
      bruto: bruto,
      hutang: hutang,
      nisab: { rp: nisabRp, teks: 'setara 85 gram emas', perakRp: nisabPerakRp },
      persenNisab: perakSampaiNisab ? Math.max(100, Math.min(999, Math.round(bersih / nisabRp * 100)))
        : nisabRp ? Math.min(999, Math.round(bersih / nisabRp * 100)) : 0,
      zakat: { rp: zakatRp, natura: null },
      kapan: kapan,
      dalil: ['qs9-103', 'hr-nisab-emas', 'hr-haul', 'qs9-34']
        .concat(adaDagang ? ['qs2-267', 'hr-dagang'] : []),
      catatan: catatan,
      rincian: rincian
    };
  }

  root.ZakatUang = { hitungSimpanan: hitungSimpanan, nilaiHaul: nilaiHaul };
})(typeof window !== 'undefined' ? window : globalThis);
