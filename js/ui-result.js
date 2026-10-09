/*
 * Halaman hasil — hitung.html.
 *
 * Mesin dijalankan DUA KALI setiap render: sekali mode "Qur'an & Sunnah",
 * sekali mode "+ Hukum Indonesia". Yang ditampilkan mengikuti saklar; yang
 * satunya dipakai menghitung bagian "Apa yang berubah", supaya pemakai
 * melihat persis apa yang ditambahkan fatwa/aturan negara di atas nash —
 * angkanya, bukan sekadar teksnya.
 *
 * Alurnya jujur dan sederhana: rincian harta → dikurangi hutang → harta
 * bersih → kadar digambar sebagai kotak "1 dari 40" (bahasa haditsnya
 * sendiri: rub'ul 'usyr) → mengalir ke delapan golongan penerima. Semua
 * dalil yang dipakai dikumpulkan sekali di bagian "Dalil", tanpa pengulangan.
 */

(function (root) {
  'use strict';

  var D = root.UIDalil, ic = D.ic, esc = D.esc;
  var doc = document;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var S, rp;

  var STATUS = {
    wajib: 'Wajib zakat', belumNisab: 'Belum nisab', belumHaul: 'Menunggu haul',
    tidakWajib: 'Tidak wajib', info: 'Penjelasan'
  };
  function status(st) { return '<span class="zk-status" data-s="' + st + '">' + STATUS[st] + '</span>'; }

  var CATATAN = {
    khilaf: { tone: 'warn', judul: 'Ulama berbeda pendapat', ikon: 'i-scale' },
    info: { tone: 'note', judul: 'Perlu diketahui', ikon: 'i-info' },
    indonesia: { tone: 'tip', judul: 'Aturan Indonesia', ikon: 'i-landmark' }
  };

  // ── Potongan kecil ───────────────────────────────────────────────
  function waffleSel(total, judul) {
    return '<div class="zk-waffle" data-total="' + total + '" data-judul="' + esc(judul) + '"></div>';
  }

  function kadarWaffle(k) {
    if (k.status !== 'wajib' && k.status !== 'belumHaul') return '';
    var total = 0, ket = '';
    if (k.id === 'simpanan' || k.id === 'penghasilan') {
      total = 40; ket = 'itulah 2,5% (rub’ul ‘usyr, seperempat dari sepersepuluh). 39 bagian lainnya tetap milikmu, sudah dibersihkan.';
    } else if (k.id === 'tani') {
      total = k.pengairan === 'irigasi' ? 20 : 10;
      ket = k.pengairan === 'irigasi' ? 'itulah 5% untuk pengairan berbiaya.' : 'itulah 10% untuk pengairan alami.';
    } else if (k.id === 'rikaz') {
      total = 5; ket = 'itulah 20% (al-khumus) untuk harta temuan.';
    }
    if (!total) return '';
    return '<div class="zk-kadar">' + waffleSel(total, 'Satu bagian dari ' + total) +
      '<p class="fl-hint"><b>1 dari ' + total + ' bagian</b>, ' + ket + '</p></div>';
  }

  function meter(k) {
    if (k.persenNisab == null || !k.nisab || k.id === 'rikaz') return '';
    var p = Math.min(100, k.persenNisab);
    return '<div class="zk-meter"><div class="zk-meter__row"><span>' +
      (k.persenNisab >= 100 ? 'Sudah melewati nisab' : 'Baru ' + k.persenNisab + '% dari nisab') + '</span>' +
      '<span>nisab: ' + (k.nisab.rp ? rp(k.nisab.rp) : esc(k.nisab.teks)) + '</span></div>' +
      '<div class="fl-progress" role="progressbar" aria-label="Posisi terhadap nisab" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + p + '" style="--value:' + p + '%"><i></i></div></div>';
  }

  function catatan(k) {
    return (k.catatan || []).map(function (c) {
      var t = CATATAN[c.tipe] || CATATAN.info;
      return '<div class="fl-callout" data-tone="' + t.tone + '"><span class="fl-callout__icon">' + ic(t.ikon) +
        '</span><div><h3>' + t.judul + '</h3><p>' + esc(c.teks) + '</p></div></div>';
    }).join('');
  }

  function dasarChips(k) {
    var a = (k.dalil || []).map(function (id) {
      var d = root.Dalil.ambil(id);
      return d ? '<a class="fl-tag fl-tag--lower" href="#dalil-' + id + '">' + esc(d.rujukan) + '</a>' : '';
    });
    var b = (k.hukumId || []).map(function (id) {
      var x = root.HukumID.ambil(id);
      return x ? '<a class="fl-tag fl-tag--lower fl-tag--amber" href="#hukum-' + id + '">' + esc(x.rujukan) + '</a>' : '';
    });
    var semua = a.concat(b).join('');
    return semua ? '<p class="zk-dasar"><b>Dasar:</b> ' + semua + '</p>' : '';
  }

  // ── Ringkasan ────────────────────────────────────────────────────
  function ringkasan(h) {
    var chips = [];
    if (h.totalRpNanti) chips.push('menunggu haul: ' + rp(h.totalRpNanti));
    h.natura.forEach(function (n) { if (n.status === 'wajib') chips.push(n.label + ': ' + n.teks); });
    if (h.fitrah) chips.push('fitrah: ' + (h.fitrah.zakat.rp ? rp(h.fitrah.zakat.rp) : h.fitrah.zakat.natura));

    return '<h2 class="zk-title">Hasil simulasi</h2>' +
      '<div class="zk-bar">' +
      '<div class="fl-seg" role="radiogroup" aria-label="Dasar hukum">' +
      '<label class="fl-seg__item"><input type="radio" name="mode" value="murni"' + (S.mode === 'murni' ? ' checked' : '') + '><span>Qur’an &amp; Sunnah</span></label>' +
      '<label class="fl-seg__item"><input type="radio" name="mode" value="indonesia"' + (S.mode === 'indonesia' ? ' checked' : '') + '><span>+ Hukum Indonesia</span></label></div>' +
      '<span class="fl-fresh"' + (S.harga.sumber === 'live' ? '' : ' data-age="stale"') + '>emas ' + rp(h.harga.emas) + '/gram · nisab ' + rp(85 * h.harga.emas) + '</span></div>' +
      '<div class="fl-card fl-card--dark zk-total"><p class="zk-total__label">Total zakat mal yang wajib ditunaikan sekarang</p>' +
      '<p class="zk-total__angka" id="total-angka">' + rp(h.totalRp) + '</p>' +
      '<p class="zk-total__sub">' + (h.adaWajib
        ? 'Dasar: ' + (h.mode === 'indonesia' ? 'Qur’an &amp; Sunnah + Hukum Indonesia' : 'Qur’an &amp; Sunnah') +
          '. Zakat dalam bentuk barang (panen, ternak) dan fitrah dihitung terpisah.'
        : 'Tidak ada kewajiban zakat dari isianmu saat ini. Rinciannya di bawah, termasuk kapan ia mulai wajib.') + '</p>' +
      (chips.length ? '<div class="zk-chips">' + chips.map(function (c) {
        return '<span class="fl-tag fl-tag--on-dark fl-tag--lower">' + esc(c) + '</span>'; }).join('') + '</div>' : '') +
      '</div>' +
      '<div class="zk-actions">' +
      '<button class="fl-btn fl-btn--dark fl-btn--sm" type="button" data-aksi="png">' + ic('i-image') + ' Simpan PNG</button>' +
      '<button class="fl-btn fl-btn--ghost fl-btn--sm" type="button" data-aksi="pdf">' + ic('i-file-down') + ' Simpan PDF</button>' +
      '<button class="fl-btn fl-btn--ghost fl-btn--sm" type="button" data-aksi="ubah">' + ic('i-pencil') + ' Ubah isian</button></div>';
  }

  // ── Rincian per jenis harta ──────────────────────────────────────
  function grup(k) {
    var angka = k.zakat && k.zakat.natura
      ? '<span class="zk-sum__n zk-sum__n--natura">' + esc(k.zakat.natura) + '</span>'
      : k.zakat && k.zakat.rp ? '<span class="zk-sum__n">' + rp(k.zakat.rp) + '</span>'
      : '<span class="zk-sum__n zk-sum__n--kosong">–</span>';
    var rincian = (k.rincian || []).map(function (r) {
      return '<div><dt>' + esc(r.label) + '</dt><dd>' + (typeof r.nilai === 'number'
        ? (r.nilai < 0 ? '− ' + rp(-r.nilai) : rp(r.nilai)) : esc(r.nilai)) + '</dd></div>';
    }).join('');
    return '<details class="fl-accordion zk-grup" data-kel="' + k.id + '"' + (S.ui.buka[k.id] ? ' open' : '') + '>' +
      '<summary><span class="zk-sum"><span class="fl-card__icon">' + ic(k.ikon) + '</span>' +
      '<span class="zk-sum__t"><b>' + esc(k.label) + '</b>' + status(k.status) + '</span>' + angka + '</span></summary>' +
      '<div class="zk-body"><p class="zk-alasan">' + esc(k.alasan) + '</p>' +
      (k.kapan && k.kapan.teks !== '—' ? '<p class="zk-kapan"><b>Kapan:</b> ' + esc(k.kapan.teks) + '</p>' : '') +
      (rincian ? '<dl class="fl-kv">' + rincian + '</dl>' : '') +
      meter(k) + kadarWaffle(k) + catatan(k) + dasarChips(k) + '</div></details>';
  }

  function rincianHtml(h) {
    return '<h2 class="zk-title">Setiap angka ada alasannya</h2>' +
      '<p class="zk-ket">Ketuk satu jenis harta untuk melihat hitungan, perbedaan pendapat ulama bila ada, dan dasarnya.</p>' +
      h.kelompok.concat(h.fitrah ? [h.fitrah] : []).map(grup).join('');
  }

  // ── Aliran: harta → zakat → penerima ─────────────────────────────
  function tahapHarta(h) {
    var sp = h.simpanan;
    if (!sp || !sp.rincian.length) {
      return '<p class="zk-ket">Isianmu tidak memuat simpanan. Zakat tiap jenis harta dihitung sendiri-sendiri di bagian rincian.</p>';
    }
    var jumlah = sp.rincian.reduce(function (a, r) { return a + Math.max(0, r.nilai); }, 0) || 1;
    var seg = sp.rincian.map(function (r, i) {
      return '<i style="--w:' + (r.nilai / jumlah * 100).toFixed(2) + ';--c:var(--chart-' + (i % 8 + 1) + ')"></i>';
    }).join('');
    var legenda = sp.rincian.map(function (r, i) {
      return '<li><i style="--c:var(--chart-' + (i % 8 + 1) + ')"></i>' + esc(r.label) + '</li>';
    }).join('');
    var baris = sp.rincian.map(function (r) {
      return '<div><dt>' + esc(r.label) + '</dt><dd>' + rp(r.nilai) + '</dd></div>';
    }).join('');
    if (sp.hutang) baris += '<div><dt>Hutang jatuh tempo</dt><dd>− ' + rp(sp.hutang) + '</dd></div>';
    baris += '<div class="is-total"><dt>Harta bersih yang dinilai</dt><dd>' + rp(sp.dasar) + '</dd></div>';
    return '<div class="fl-stackbar" role="img" aria-label="Komposisi hartamu: ' +
      esc(sp.rincian.map(function (r) { return r.label + ' ' + Math.round(r.nilai / jumlah * 100) + ' persen'; }).join(', ')) +
      '">' + seg + '</div><ul class="fl-legend">' + legenda + '</ul><dl class="fl-kv">' + baris + '</dl>' + meter(sp);
  }

  function tahapZakat(h) {
    var sp = h.simpanan, baris = '';
    if (sp && (sp.status === 'wajib' || sp.status === 'belumHaul')) {
      baris += '<div><dt>2,5% dari simpanan' + (sp.status === 'belumHaul' ? ' (saat haul genap)' : '') +
        '</dt><dd>' + rp(sp.zakat.rp) + '</dd></div>';
    }
    h.kelompok.forEach(function (k) {
      if (k.id === 'simpanan' || (k.status !== 'wajib' && k.status !== 'belumHaul')) return;
      baris += '<div><dt>' + esc(k.label) + '</dt><dd>' + (k.zakat.natura ? esc(k.zakat.natura) : rp(k.zakat.rp)) + '</dd></div>';
    });
    if (h.fitrah) baris += '<div><dt>Zakat fitrah (jelang Idulfitri)</dt><dd>' +
      (h.fitrah.zakat.rp ? rp(h.fitrah.zakat.rp) : esc(h.fitrah.zakat.natura)) + '</dd></div>';
    return '<dl class="fl-kv">' + baris + '</dl>' +
      (sp && (sp.status === 'wajib' || sp.status === 'belumHaul')
        ? '<div class="zk-kadar">' + waffleSel(40, 'Satu bagian dari 40') + '<p class="fl-hint"><b>1 dari 40 bagian</b> adalah zakatnya. ' +
          '39 bagian lainnya <b>tetap milikmu dan menjadi bersih</b> karena zakatnya ditunaikan (QS At-Taubah 103).</p></div>' : '');
  }

  function tahapAsnaf(h) {
    var pilihan = h.asnaf.map(function (a) {
      return '<label class="fl-seg__item"><input type="radio" name="asnaf" value="' + a.id + '"' +
        (S.ui.asnaf === a.id ? ' checked' : '') + '><span>' + esc(a.label) + '</span></label>';
    }).join('');
    return '<div class="zk-pilih" role="radiogroup" aria-label="Delapan golongan penerima zakat">' + pilihan + '</div>' +
      '<p class="zk-asnaf-ket fl-hint" id="asnaf-ket" aria-live="polite">' + asnafKet() + '</p>' +
      '<div id="ayat-asnaf">' + ayatAsnaf() + '</div>';
  }
  function asnafKet() {
    var a = root.ZakatConst.ASNAF.filter(function (x) { return x.id === S.ui.asnaf; })[0];
    return a ? '<b>' + esc(a.label) + ':</b> ' + esc(a.arti)
      : 'Pilih satu golongan untuk melihat ruasnya disorot di dalam ayat. Kamu tidak wajib membagi ke semua golongan: menyerahkan ke amil atau langsung ke fakir-miskin di sekitarmu sudah sah.';
  }
  function ayatAsnaf() {
    var a = root.ZakatConst.ASNAF.filter(function (x) { return x.id === S.ui.asnaf; })[0];
    return D.cite('qs9-60', a ? a.segmen : null, null, true);
  }

  function aliranHtml(h) {
    var adaZakat = h.timeline.length > 0;
    return '<h2 class="zk-title">Bagaimana hartamu mengalir</h2>' +
      '<ol class="zk-alir"><li><h3>Hartamu dikumpulkan dan dibersihkan dari hutang</h3>' + tahapHarta(h) + '</li>' +
      (adaZakat
        ? '<li><h3>Bagian yang dikeluarkan sebagai zakat</h3>' + tahapZakat(h) + '</li>' +
          '<li><h3>Mengalir ke delapan golongan penerima</h3>' + tahapAsnaf(h) + '</li>'
        : '<li><h3>Belum ada zakat yang perlu dialirkan</h3><p class="zk-ket">Dari isianmu belum ada yang wajib atau jatuh tempo. Lihat rincian di atas untuk tahu kapan ia mulai wajib.</p></li>') +
      '</ol>';
  }

  // ── Waktu bayar ──────────────────────────────────────────────────
  function waktuLabel(t) {
    switch (t.tipe) {
      case 'sekarang': return 'Sekarang';
      case 'segera': return 'Seketika saat ditemukan';
      case 'rutin': return 'Tiap bulan atau sekali setahun';
      case 'tanggal': return t.teks + (t.sisaHari ? ' · ±' + t.sisaHari + ' hari lagi' : '');
      case 'panen': return 'Pada hari panen';
      case 'ramadan': return 'Di bulan Ramadan';
    }
    return '';
  }

  function waktuHtml(h) {
    if (!h.timeline.length) {
      return '<h2 class="zk-title">Kapan membayarnya</h2><p class="zk-ket">Belum ada pembayaran yang jatuh tempo dari isianmu.</p>';
    }
    var item = h.timeline.map(function (t) {
      var jumlah = t.jumlah ? '<p><b>' + (t.jumlah.rp ? rp(t.jumlah.rp) : esc(t.jumlah)) + '</b></p>' : '';
      var ket = t.tipe === 'tanggal' ? 'Haulnya genap, zakat jatuh tempo.' : esc(t.teks);
      return '<li' + (t.tipe === 'sekarang' || t.tipe === 'segera' ? ' class="is-now"' : '') + '>' +
        '<span class="fl-timeline__dot"></span><time>' + esc(waktuLabel(t)) + '</time>' +
        '<h3>' + esc(t.label) + '</h3><p>' + ket + '</p>' + jumlah + '</li>';
    }).join('');
    return '<h2 class="zk-title">Kapan membayarnya</h2>' +
      '<p class="zk-ket">Membayar lebih awal dari jatuh temponya boleh (ta’jil). Menundanya tanpa uzur yang tidak.</p>' +
      '<ol class="fl-timeline">' + item + '</ol>';
  }

  // ── Dalil: dikumpulkan sekali, tanpa pengulangan ─────────────────
  function kumpulDalil(h, langkah) {
    var dipakai = {}, urut = [], hukum = {}, urutHukum = [];
    function tambah(id, untuk) {
      if (!dipakai[id]) { dipakai[id] = []; urut.push(id); }
      if (untuk && dipakai[id].indexOf(untuk) < 0) dipakai[id].push(untuk);
    }
    function tambahHukum(id) { if (!hukum[id]) { hukum[id] = 1; urutHukum.push(id); } }
    h.kelompok.concat(h.fitrah ? [h.fitrah] : []).forEach(function (k) {
      (k.dalil || []).forEach(function (id) { tambah(id, k.label); });
      (k.hukumId || []).forEach(tambahHukum);
    });
    if (h.timeline.length) { tambah('qs9-60', 'Penerima zakat'); tambah('hr-muadz', 'Aliran zakat'); }
    if (h.timeline.some(function (t) { return t.tipe === 'tanggal'; })) tambah('hr-tajil', 'Membayar lebih awal');
    langkah.forEach(function (a) {
      (a.dalil || []).forEach(function (id) { tambah(id, 'Langkah selanjutnya'); });
      (a.hukumId || []).forEach(tambahHukum);
    });
    return { dalil: dipakai, urut: urut, hukum: urutHukum };
  }

  function dalilItem(id, untuk) {
    var d = root.Dalil.ambil(id);
    if (!d) return '';
    var kunci = 'dalil-' + id;
    return '<details class="fl-accordion zk-dalil" id="dalil-' + id + '" data-kel="' + kunci + '"' + (S.ui.buka[kunci] ? ' open' : '') + '>' +
      '<summary><span class="zk-sum"><span class="zk-sum__t"><b>' + esc(d.rujukan) + '</b>' +
      '<span class="zk-sum__ket">' + esc(untuk) + '</span></span>' +
      '<span class="zk-sum__n">' + D.chip(id) + '</span></span></summary>' +
      '<div class="zk-body">' + D.cite(id, null, null, true) + '</div></details>';
  }

  function dalilHtml(kum, mode) {
    var daftar = kum.urut.map(function (id) { return dalilItem(id, kum.dalil[id].join(', ')); }).join('');
    var hukum = mode === 'indonesia' && kum.hukum.length
      ? '<h3 class="zk-h3">Aturan Indonesia yang dipakai</h3><div class="zk-hukum">' + kum.hukum.map(D.hukum).join('') + '</div>' : '';
    return '<h2 class="zk-title">Dalil untuk hasil ini</h2>' +
      '<p class="zk-ket">Ketuk satu dalil untuk membacanya utuh: teks Arab, terjemahan, derajat, dan tautan ke sumbernya supaya bisa kamu periksa sendiri. Seluruh dalil situs ini ada di <a class="fl-link" href="rujukan.html">halaman rujukan</a>.</p>' +
      '<p><button class="fl-btn fl-btn--sm fl-btn--ghost" type="button" data-aksi="dalil-semua">Buka atau tutup semua dalil</button></p>' +
      '<div class="zk-cites">' + daftar + '</div>' + hukum;
  }

  // ── Perbandingan dua mode ────────────────────────────────────────
  function bedaHtml(murni, indo) {
    var baris = [], pengI = null;
    indo.kelompok.forEach(function (k) { if (k.id === 'penghasilan') pengI = k; });
    if (pengI && pengI.status === 'wajib') {
      baris.push('<div><dt>Zakat penghasilan dihitung (Fatwa MUI 3/2003: qiyas, bukan nash langsung)</dt><dd>+ ' + rp(pengI.zakat.rp) + '/tahun</dd></div>');
    } else if (pengI) {
      baris.push('<div><dt>Zakat penghasilan ikut dihitung, tapi penghasilanmu masih di bawah nisab</dt><dd>+ Rp 0</dd></div>');
    }
    if (indo.fitrah && indo.fitrah.zakat.rp) {
      baris.push('<div><dt>Fitrah boleh dengan uang (pendapat Hanafi, praktik BAZNAS). Menurut nash: ' + esc(indo.fitrah.zakat.natura) + '</dt><dd>' + rp(indo.fitrah.zakat.rp) + '</dd></div>');
    }
    baris.push('<div><dt>Jalur BAZNAS atau LAZ berizin, Bukti Setor Zakat, dan pengurang pajak (UU 23/2011 Pasal 21 sampai 23) ditampilkan</dt><dd>catatan</dd></div>');
    var selisih = indo.totalRp - murni.totalRp;
    return '<h2 class="zk-title">Apa yang berubah bila aturan Indonesia dinyalakan?</h2>' +
      '<p class="zk-ket">Aturan Indonesia hanya menambah di atas nash dan tidak pernah mengurangi. Setiap tambahan diberi label dan sumbernya.</p>' +
      '<div class="zk-stats"><div class="fl-stat"><small>Qur’an &amp; Sunnah</small><b>' + rp(murni.totalRp) + '</b></div>' +
      '<div class="fl-stat"><small>+ Hukum Indonesia</small><b>' + rp(indo.totalRp) + '</b>' +
      '<span class="fl-delta"' + (selisih ? '' : ' data-dir="flat"') + '>' + (selisih ? 'naik ' + rp(selisih) : 'tidak berubah') + '</span></div></div>' +
      '<dl class="fl-kv">' + baris.join('') + '</dl>';
  }

  // ── Langkah selanjutnya ──────────────────────────────────────────
  function langkahHtml(langkah) {
    var item = langkah.map(function (a, i) {
      var tautan = (a.dalil || []).map(function (id) {
        var d = root.Dalil.ambil(id);
        return d ? '<a class="fl-tag fl-tag--lower" href="#dalil-' + id + '">' + esc(d.rujukan) + '</a>' : '';
      }).concat((a.hukumId || []).map(function (id) {
        var x = root.HukumID.ambil(id);
        return x ? '<a class="fl-tag fl-tag--lower fl-tag--amber" href="#hukum-' + id + '">' + esc(x.rujukan) + '</a>' : '';
      })).concat(a.tautan ? ['<a class="fl-tag fl-tag--lower fl-tag--outline" href="' + a.tautan.url +
        '" target="_blank" rel="noopener noreferrer">' + esc(a.tautan.label) + '</a>'] : []).join('');
      return '<div class="zk-cek__item"><label class="fl-check"><input type="checkbox" data-cek="' + i + '"' +
        (S.ui.cek && S.ui.cek[i] ? ' checked' : '') + '><span><b>' + esc(a.judul) + '</b></span></label>' +
        '<p>' + esc(a.teks) + '</p>' + (tautan ? '<p class="zk-dasar">' + tautan + '</p>' : '') + '</div>';
    }).join('');
    return '<h2 class="zk-title">Langkah selanjutnya untukmu</h2>' +
      '<p class="zk-ket">Centang yang sudah kamu kerjakan. Catatan ini hanya hidup di tab ini dan tidak disimpan.</p>' +
      '<div class="fl-xp"><div class="fl-xp__row"><span id="cek-n"></span></div>' +
      '<div class="fl-progress" id="cek-bar" role="progressbar" aria-label="Kemajuan langkah" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" style="--value:0%"><i></i></div></div>' +
      '<div class="zk-cek">' + item + '</div>' +
      '<div class="fl-notice"><b>Alat bantu hitung, bukan fatwa</b><span>Untuk keadaan yang tidak tercakup, bawa hasil ini sebagai bahan awal ke amil atau ustadz yang kamu percaya. Seluruh dalil bisa diperiksa di halaman rujukan.</span></div>';
  }

  function hitungCek() {
    var cb = $$('#out-langkah [data-cek]');
    var n = cb.filter(function (c) { return c.checked; }).length;
    $('#cek-n').textContent = n + ' dari ' + cb.length + ' selesai';
    var p = cb.length ? Math.round(n / cb.length * 100) : 0;
    var bar = $('#cek-bar');
    bar.style.setProperty('--value', p + '%');
    bar.setAttribute('aria-valuenow', p);
  }

  // ── Render utama ─────────────────────────────────────────────────
  function naikAngka(el, ke) {
    var M = root.Motion;
    if (!M || !ke || (root.Flavida && root.Flavida.reduced)) return;
    try {
      M.animate(0, ke, { duration: 1.1, ease: [0.16, 1, 0.3, 1],
        onUpdate: function (v) { el.textContent = rp(v); } });
    } catch (e) { el.textContent = rp(ke); }
  }

  function render(animasi) {
    S = root.UIWizard.S;
    rp = root.UIWizard.rp;
    S.ui.cek = S.ui.cek || {};

    var murni = root.Zakat.hitung(root.UIWizard.bangunMasukan('murni'));
    var indo = root.Zakat.hitung(root.UIWizard.bangunMasukan('indonesia'));
    var h = S.mode === 'indonesia' ? indo : murni;
    var langkah = root.Advice.susun(h).filter(function (a) { return !a.modeSaja || a.modeSaja === h.mode; });
    var kum = kumpulDalil(h, langkah);

    var fokusMode = doc.activeElement && doc.activeElement.name === 'mode';
    $('#out-ringkasan').innerHTML = ringkasan(h);
    $('#out-rincian').innerHTML = rincianHtml(h);
    $('#out-alir').innerHTML = aliranHtml(h);
    $('#out-waktu').innerHTML = waktuHtml(h);
    $('#out-dalil').innerHTML = dalilHtml(kum, h.mode);
    $('#out-beda').innerHTML = bedaHtml(murni, indo);
    $('#out-langkah').innerHTML = langkahHtml(langkah);

    $$('#hasil .zk-waffle').forEach(function (el) {
      var total = +el.dataset.total;
      root.Flavida.chart(el, { type: 'waffle', total: total, filled: 1, cols: total <= 5 ? total : 10,
        title: el.dataset.judul, locale: 'id-ID', animate: !!animasi });
    });
    hitungCek();
    if (fokusMode) { var r = $('input[name="mode"]:checked'); if (r) r.focus(); }
    if (animasi) naikAngka($('#total-angka'), h.totalRp);
    root.HasilTerakhir = { murni: murni, indonesia: indo, aktif: h };
  }

  // ── Perekat kejadian (sekali, pada elemen statis #hasil) ─────────
  function pasang() {
    var el = $('#hasil');
    el.addEventListener('change', function (e) {
      var t = e.target;
      if (t.name === 'mode') { S.mode = t.value; render(true); }
      else if (t.name === 'asnaf') {
        S.ui.asnaf = t.value;
        $('#asnaf-ket').innerHTML = asnafKet();
        $('#ayat-asnaf').innerHTML = ayatAsnaf();
      } else if (t.matches('[data-cek]')) {
        S.ui.cek[t.dataset.cek] = t.checked;
        hitungCek();
      }
    });
    el.addEventListener('toggle', function (e) {
      var d = e.target;
      if (d.matches && d.matches('details[data-kel]')) S.ui.buka[d.dataset.kel] = d.open;
    }, true);
    el.addEventListener('click', function (e) {
      var j = e.target.closest('a[href^="#dalil-"]');
      if (j) {                                           // tautan ke dalil: buka dulu akordeonnya
        var tujuan = doc.getElementById(j.getAttribute('href').slice(1));
        if (tujuan && tujuan.tagName === 'DETAILS') tujuan.open = true;
        return;
      }
      var b = e.target.closest('[data-aksi]');
      if (!b) return;
      if (b.dataset.aksi === 'ubah') root.UIWizard.ubah();
      else if (b.dataset.aksi === 'dalil-semua') {
        var semua = $$('#out-dalil details'), buka = semua.some(function (d) { return !d.open; });
        semua.forEach(function (d) { d.open = buka; });
      }
      else if (b.dataset.aksi === 'png') root.ZakatExport.png(root.HasilTerakhir.aktif);
      else if (b.dataset.aksi === 'pdf') root.ZakatExport.pdf();
    });
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', pasang);
  else pasang();

  root.UIResult = { render: render };
})(typeof window !== 'undefined' ? window : globalThis);
