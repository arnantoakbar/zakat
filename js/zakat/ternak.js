/*
 * Zakat ternak: kambing/domba, sapi/kerbau, unta.
 *
 * Tabel kambing dan unta datang utuh dari surat zakat Abu Bakar (HR Bukhari)
 * — dokumen tertulis resmi pertama tentang tarif zakat. Tabel sapi datang
 * dari perintah Nabi صلى الله عليه وسلم kepada Mu'adz saat diutus ke Yaman:
 * tiap 30 ekor → 1 tabi', tiap 40 ekor → 1 musinnah.
 *
 * Syarat wajibnya (dan ini yang sering membuat ternak di Indonesia justru
 * TIDAK kena zakat ternak):
 *  1. Digembalakan bebas di padang sebagian besar tahun (sa'imah). Ternak
 *     yang dikandangkan dan dibeli pakannya tidak wajib zakat ternak
 *     menurut jumhur (Syafi'i & Hanafi); mazhab Maliki tetap mewajibkan —
 *     dicatat, tidak disembunyikan.
 *  2. Bukan untuk diperjualbelikan. Ternak dagang dizakati sebagai harta
 *     PERDAGANGAN (2,5% dari nilainya), bukan dengan tabel ekor.
 *  3. Sudah dimiliki satu haul.
 *
 * Untuk jumlah di atas tabel, kaidahnya dari hadits yang sama:
 * kambing >300 → tiap 100 ekor 1 kambing; sapi → kombinasi 30/40;
 * unta >120 → kombinasi 40 (bintu labun) / 50 (hiqqah). Kombinasi dicari
 * dengan memaksimalkan cakupan — cara ini menghasilkan tabel yang sama
 * persis dengan tabel kitab fiqh, dan diuji di tests.js.
 */

(function (root) {
  'use strict';

  var C = root.ZakatConst;

  var JENIS = {
    kambing: { label: 'Kambing & domba', ikon: 'i-kambing', mulai: 40,
      dalil: ['hr-surat-abubakar', 'hr-haul'] },
    sapi:    { label: 'Sapi & kerbau',   ikon: 'i-sapi',    mulai: 30,
      dalil: ['hr-sapi', 'hr-haul'] },
    unta:    { label: 'Unta',            ikon: 'i-unta',    mulai: 5,
      dalil: ['hr-surat-abubakar', 'hr-haul'] }
  };

  /**
   * Cari semua kombinasi blokA/blokB yang cakupannya (a×A + b×B ≤ n)
   * paling besar. Mengembalikan daftar teks, mis. ["4 tabi’", "3 musinnah"].
   */
  function kombo(n, blokA, blokB) {
    var terbaik = -1;
    var hasil = [];
    for (var b = Math.floor(n / blokB.ukuran); b >= 0; b--) {
      var a = Math.floor((n - b * blokB.ukuran) / blokA.ukuran);
      var cakupan = a * blokA.ukuran + b * blokB.ukuran;
      if (cakupan > terbaik) { terbaik = cakupan; hasil = []; }
      if (cakupan === terbaik) {
        var bagian = [];
        if (a > 0) bagian.push(a + ' ' + blokA.nama);
        if (b > 0) bagian.push(b + ' ' + blokB.nama);
        if (bagian.length) hasil.push(bagian.join(' + '));
      }
    }
    // Buang kombinasi yang bagiannya sama persis (bisa muncul dua arah).
    return hasil.filter(function (t, i) { return hasil.indexOf(t) === i; });
  }

  function zakatKambing(n) {
    if (n <= 120) return '1 ekor kambing';
    if (n <= 200) return '2 ekor kambing';
    if (n <= 300) return '3 ekor kambing';
    return Math.floor(n / 100) + ' ekor kambing';
  }

  function zakatSapi(n) {
    return kombo(n,
      { ukuran: C.SAPI_TABI, nama: 'tabi’ (sapi umur 1 tahun)' },
      { ukuran: C.SAPI_MUSINNAH, nama: 'musinnah (sapi betina umur 2 tahun)' }
    ).join(' — atau — ');
  }

  function zakatUnta(n) {
    if (n <= 120) {
      var baris = null;
      C.UNTA_TABEL.forEach(function (b) { if (n >= b.min) baris = b; });
      return baris.zakat;
    }
    return kombo(n,
      { ukuran: C.UNTA_BLOK_BINTU_LABUN, nama: 'bintu labun (unta betina umur 2 tahun)' },
      { ukuran: C.UNTA_BLOK_HIQQAH, nama: 'hiqqah (unta betina umur 3 tahun)' }
    ).join(' — atau — ');
  }

  /**
   * @param {'kambing'|'sapi'|'unta'} jenisId
   * @param {{ekor:number, digembalakan:boolean, untukDagang:boolean}} d
   * @param {object} input — masukan lengkap (untuk haul & hariIni)
   */
  function hitung(jenisId, d, input) {
    var j = JENIS[jenisId];
    if (!j || !d || !(d.ekor > 0)) return null;

    var dasar = {
      id: 'ternak-' + jenisId,
      label: j.label,
      ikon: j.ikon,
      dasar: d.ekor,
      nisab: { teks: j.mulai + ' ekor' },
      persenNisab: Math.min(999, Math.round(d.ekor / j.mulai * 100)),
      dalil: j.dalil,
      rincian: [{ label: 'Jumlah ternak', nilai: d.ekor + ' ekor' }],
      catatan: []
    };

    if (d.untukDagang) {
      dasar.status = 'info';
      dasar.alasan = 'Ternak yang memang untuk diperjualbelikan dizakati sebagai harta ' +
        'PERDAGANGAN — 2,5% dari nilai jualnya setelah nisab dan haul — bukan dengan ' +
        'tabel ekor. Masukkan nilai jual ternakmu ke bagian "Perdagangan".';
      dasar.zakat = { rp: null, natura: null };
      dasar.kapan = { tipe: 'nanti', teks: 'lewat zakat perdagangan' };
      dasar.dalil = ['qs2-267'];
      return dasar;
    }

    if (!d.digembalakan) {
      dasar.status = 'tidakWajib';
      dasar.alasan = 'Ternak yang dikandangkan dan dibeli pakannya tidak wajib zakat ' +
        'ternak menurut jumhur ulama (di antaranya mazhab Syafi’i yang dipakai situs ini) ' +
        '— syarat dalam haditsnya: digembalakan bebas (sa’imah).';
      dasar.zakat = { rp: null, natura: null };
      dasar.kapan = { tipe: 'nanti', teks: '—' };
      dasar.catatan.push({ tipe: 'khilaf', teks: 'Mazhab Maliki tetap mewajibkan zakat ' +
        'ternak yang dikandangkan. Kalau mau mengikuti pendapat itu untuk kehati-hatian, ' +
        'tandai ternakmu sebagai digembalakan dan hitung ulang.' });
      dasar.catatan.push({ tipe: 'info', teks: 'Kalau ternak ini sebenarnya usaha ' +
        'penggemukan/jual-beli, ia masuk zakat perdagangan — pindahkan nilai jualnya ke ' +
        'bagian "Perdagangan".' });
      return dasar;
    }

    if (d.ekor < j.mulai) {
      dasar.status = 'belumNisab';
      dasar.alasan = 'Jumlah ' + j.label.toLowerCase() + 'mu ' + d.ekor + ' ekor, masih di ' +
        'bawah nisab ' + j.mulai + ' ekor. Belum wajib zakat ternak.';
      dasar.zakat = { rp: null, natura: null };
      dasar.kapan = { tipe: 'nanti', teks: 'saat jumlahnya mencapai ' + j.mulai + ' ekor' };
      return dasar;
    }

    var natura = jenisId === 'kambing' ? zakatKambing(d.ekor)
      : jenisId === 'sapi' ? zakatSapi(d.ekor)
      : zakatUnta(d.ekor);

    var haul = root.ZakatUang.nilaiHaul(input.haul, input.hariIni);

    if (!haul.terpenuhi) {
      dasar.status = 'belumHaul';
      dasar.alasan = 'Jumlahnya sudah melewati nisab, tapi kepemilikannya belum genap satu ' +
        'tahun hijriah. Zakatnya jatuh tempo ' + haul.teks + ': ' + natura + '.';
      dasar.zakat = { rp: null, natura: natura };
      dasar.kapan = { tipe: 'tanggal', teks: haul.teks, tanggalMs: haul.tanggalMs,
        sisaHari: haul.sisaHari };
      return dasar;
    }

    dasar.status = 'wajib';
    dasar.alasan = 'Ternakmu ' + d.ekor + ' ekor, digembalakan, dan sudah dimiliki setahun ' +
      '— kena zakat menurut tabel dalam hadits.';
    dasar.zakat = { rp: null, natura: natura };
    dasar.kapan = { tipe: 'sekarang', teks: 'sekarang — haulnya sudah genap' };
    if (!haul.pasti) {
      dasar.catatan.push({ tipe: 'info', teks: 'Dengan catatan ternak ini sudah kamu ' +
        'miliki satu tahun hijriah. Kalau belum, tunggu haulnya genap.' });
    }
    dasar.catatan.push({ tipe: 'info', teks: 'Hewan zakatnya yang sehat dan tidak cacat — ' +
      'bukan yang paling bagus, bukan pula yang buruk. Umurnya boleh lebih tua dari ' +
      'ketentuan, tidak boleh lebih muda.' });
    return dasar;
  }

  root.ZakatTernak = { hitung: hitung, zakatKambing: zakatKambing,
    zakatSapi: zakatSapi, zakatUnta: zakatUnta };
})(typeof window !== 'undefined' ? window : globalThis);
