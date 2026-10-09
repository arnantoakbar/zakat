/*
 * Langkah selanjutnya untuk muzakki.
 *
 * Tahu angkanya baru setengah jalan. Bagian ini menerjemahkan hasil
 * hitungan menjadi daftar periksa yang menyesuaikan isi hasilnya: apa yang
 * harus dilakukan, kapan, dan lewat mana. Butir yang bersandar pada aturan
 * negara ditandai `hukumId` dan hanya muncul saat mode "+ Hukum Indonesia".
 *
 * ─────────────────────────────────────────────────────────────────────
 * CATATAN UNTUK PEMILIK SITUS
 * Tautan lembaga bisa berubah sewaktu-waktu. Periksa berkala.
 * ─────────────────────────────────────────────────────────────────────
 */

(function (root) {
  'use strict';

  /**
   * @param {object} hasil — keluaran Zakat.hitung()
   * @returns {Array<{ikon, judul, teks, dalil?, hukumId?, tautan?, modeSaja?}>}
   */
  function susun(hasil) {
    var langkah = [];
    var adaRupiah = hasil.totalRp > 0;
    var adaNatura = hasil.natura.some(function (n) { return n.status === 'wajib'; });
    var adaNanti = hasil.totalRpNanti > 0 ||
      hasil.timeline.some(function (t) { return t.tipe === 'tanggal'; });

    // 1 — niat: syarat sah semua ibadah
    if (adaRupiah || adaNatura || hasil.fitrah) {
      langkah.push({
        ikon: 'i-heart',
        judul: 'Niatkan sebagai zakat',
        teks: 'Zakat itu ibadah, dan ibadah butuh niat. Cukup di dalam hati saat ' +
          'menyerahkan atau mentransfer: "ini zakat hartaku yang wajib". Tanpa niat, ' +
          'uang yang sama jatuhnya sedekah biasa — kewajiban zakatmu belum gugur.'
      });
    }

    // 2 — bayar sekarang, jangan ditunda
    if (adaRupiah || adaNatura) {
      langkah.push({
        ikon: 'i-arrow-right',
        judul: 'Tunaikan sesuai waktunya, jangan ditunda',
        teks: 'Yang haulnya sudah genap ditunaikan sekarang; menundanya tanpa uzur ' +
          'terlarang, sedangkan mendahulukannya sebelum jatuh tempo justru boleh ' +
          '(ta’jil) — lihat urutan waktunya di atas.',
        dalil: ['hr-tajil']
      });
    }

    // 3 — ke mana menyalurkan
    if (adaRupiah || adaNatura || hasil.fitrah) {
      langkah.push({
        ikon: 'i-hand-heart',
        judul: 'Salurkan lewat amil, atau langsung ke yang berhak',
        teks: 'Dua-duanya sah. Lewat lembaga amil (BAZNAS/LAZ) zakatmu dikelola dan ' +
          'tersalur ke delapan golongan; langsung pun boleh — pastikan penerimanya ' +
          'memang fakir/miskin atau golongan lain dalam ayat, dan dahulukan yang ' +
          'terdekat di sekitarmu. Tidak wajib dibagi rata ke semua golongan.',
        dalil: ['qs9-60', 'hr-muadz']
      });

      langkah.push({
        ikon: 'i-book-open',
        judul: 'Pakai lembaga resmi yang berizin',
        teks: 'Di Indonesia, pengelolaan zakat diatur undang-undang: BAZNAS dibentuk ' +
          'negara, LAZ harus berizin. Salurkan lewat yang resmi supaya amanah dan ' +
          'tercatat.',
        hukumId: ['uu23-def', 'pp14-2014'],
        tautan: { label: 'baznas.go.id', url: 'https://baznas.go.id' },
        modeSaja: 'indonesia'
      });

      langkah.push({
        ikon: 'i-receipt',
        judul: 'Minta Bukti Setor Zakat, kurangkan dari pajak',
        teks: 'BAZNAS/LAZ wajib memberimu Bukti Setor Zakat (BSZ). Simpan — zakat ' +
          'yang dibayar lewat jalur resmi mengurangi penghasilan kena pajak saat ' +
          'lapor SPT tahunan.',
        hukumId: ['uu23-22', 'uu23-23'],
        modeSaja: 'indonesia'
      });
    }

    // 4 — natura: hewan / hasil panen
    if (adaNatura) {
      langkah.push({
        ikon: 'i-paw-print',
        judul: 'Zakat ternak & panen ditunaikan dari barangnya',
        teks: 'Serahkan hewan yang sehat dan umurnya sesuai ketentuan — bukan yang ' +
          'paling jelek, tidak harus yang terbaik. Hasil panen dikeluarkan dari ' +
          'panen itu juga. Kalau kesulitan menyerahkannya sendiri, amil setempat ' +
          'bisa menjemput dan membantu menilai hewannya.',
        dalil: ['hr-surat-abubakar']
      });
    }

    // 5 — fitrah
    if (hasil.fitrah) {
      langkah.push({
        ikon: 'i-users-round',
        judul: 'Zakat fitrah: lunas sebelum shalat Id',
        teks: 'Tunaikan di Ramadan — paling utama satu-dua hari menjelang Idulfitri, ' +
          'lewat masjid atau amil setempat. Lewat dari shalat Id, ia jatuh jadi ' +
          'sedekah biasa dan kewajibanmu belum tertunaikan.',
        dalil: ['hr-fitrah-waktu']
      });
    }

    // 6 — yang belum jatuh tempo: pasang pengingat
    if (adaNanti) {
      langkah.push({
        ikon: 'i-calendar-check',
        judul: 'Catat tanggal haulmu',
        teks: 'Sebagian hartamu baru jatuh tempo nanti. Pasang pengingat di ' +
          'kalender HP-mu sekarang — haul dihitung dengan tahun hijriah (±354 hari), ' +
          'jadi tanggalnya maju ±11 hari tiap tahun masehi.'
      });
    }

    // 7 — tahun depan berulang
    if (adaRupiah || adaNatura) {
      langkah.push({
        ikon: 'i-rotate-ccw',
        judul: 'Zakat simpanan berulang tiap tahun',
        teks: 'Selama simpananmu masih di atas nisab, tahun depan ia wajib dizakati ' +
          'lagi 2,5% — hitung ulang saja di sini dengan harga emas terbaru.'
      });
    }

    // 8 — selalu: verifikasi ke ahlinya
    langkah.push({
      ikon: 'i-triangle-alert',
      judul: 'Ragu? Tanyakan — ini alat bantu, bukan fatwa',
      teks: 'Untuk keadaan khusus (harta campur riba, hutang-piutang rumit, saham, ' +
        'warisan yang belum dibagi), bawalah angka dari sini sebagai bahan awal ke ' +
        'amil atau ustadz yang kamu percaya. UU-nya pun menyediakan jalur itu: ' +
        'muzaki yang tidak dapat menghitung sendiri dibantu BAZNAS.',
      hukumId: ['uu23-21']
    });

    return langkah;
  }

  root.Advice = { susun: susun };
})(typeof window !== 'undefined' ? window : globalThis);
