/*
 * Halaman hasil — hitung.html.
 *
 * Mesin dijalankan DUA KALI setiap render: sekali mode "Qur'an & Sunnah",
 * sekali mode "+ Hukum Indonesia". Yang ditampilkan mengikuti saklar; yang
 * satunya dipakai menghitung kotak "Apa yang berubah", supaya pemakai
 * melihat persis apa yang ditambahkan fatwa/aturan negara di atas nash —
 * angkanya, bukan sekadar teksnya.
 *
 * Diagram alirnya sederhana dan jujur: rincian harta → dikurangi hutang →
 * harta bersih → kadar digambar sebagai kotak "1 dari 40" (bahasa haditsnya
 * sendiri: rub'ul 'usyr) → mengalir ke delapan golongan penerima. Ketuk
 * golongan mana pun untuk melihat ruasnya disorot di dalam ayatnya.
 */

(function (root) {
  'use strict';

  var S, rp;

  function ikon(id, cls) {
    return '<svg class="ic ' + (cls || '') + '" aria-hidden="true"><use href="#' + id + '"></use></svg>';
  }
  function esc(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  }

  var STATUS_TEKS = {
    wajib: 'Wajib zakat', belumNisab: 'Belum nisab', belumHaul: 'Menunggu haul',
    tidakWajib: 'Tidak wajib', info: 'Penjelasan'
  };

  function statusPil(st) {
    return '<span class="status-pil ' + st + '">' + STATUS_TEKS[st] + '</span>';
  }

  // ── Dalil ────────────────────────────────────────────────────────
  function ayatBersorot(d, sorotId, kelas, ambil) {
    if (!d.segmen) return '<div class="' + kelas + '">' + ambil(d) + '</div>';
    return '<div class="' + kelas + '">' + d.segmen.map(function (s) {
      var kena = sorotId && s.id === sorotId;
      return '<span class="' + (kena ? 'ayat-sorot' : sorotId ? 'ayat-redup' : '') + '">' +
        (ambil === ambilArab ? s.arab : s.arti) + '</span>';
    }).join(' ') + '</div>';
  }
  function ambilArab(d) { return d.arab; }
  function ambilArti(d) { return d.terjemah; }

  function renderDalil(id, sorotId) {
    var d = root.Dalil.ambil(id);
    if (!d) return '';
    return '<div class="dalil">' +
      '<div class="dalil-rujukan">' + d.rujukan + '</div>' +
      ayatBersorot(d, sorotId, 'dalil-arab" lang="ar" dir="rtl', ambilArab) +
      ayatBersorot(d, sorotId, 'dalil-terjemah', ambilArti) +
      '<div class="dalil-sumber">' + (d.perawi ? d.perawi + '. ' : '') +
      (d.derajat ? d.derajat + '.' : '') + '</div>' +
      (d.ringkas ? '<div class="dalil-sumber">' + d.ringkas + '</div>' : '') +
      '<div class="dalil-tautan"><a href="' + d.tautan.url + '" target="_blank" ' +
      'rel="noopener noreferrer">' + ikon('i-tautan', 'ic-sm') + d.tautan.label + '</a></div>' +
      '</div>';
  }

  // ── Potongan visual ──────────────────────────────────────────────
  function meter(k) {
    if (k.persenNisab == null || !k.nisab) return '';
    var p = Math.min(100, k.persenNisab);
    var lewat = k.persenNisab >= 100;
    return '<div class="meter"><div class="meter-bar">' +
      '<div class="meter-isi' + (lewat ? '' : ' hijau') + '" data-lebar="' + p + '"></div>' +
      '<div class="meter-tanda" style="left:' + (lewat ? Math.round(100 / (k.persenNisab / 100) ) : 100) + '%"></div>' +
      '</div><div class="meter-ket"><span>' + (lewat
        ? 'Sudah ' + k.persenNisab + '% dari nisab'
        : 'Baru ' + k.persenNisab + '% dari nisab') + '</span>' +
      '<span>nisab: ' + (k.nisab.rp ? rp(k.nisab.rp) : k.nisab.teks) + '</span></div></div>';
  }

  function kadarGrid(pembagi, keterangan) {
    var sel = '';
    for (var i = 0; i < pembagi; i++) {
      sel += '<div class="kadar-sel' + (i === 0 ? ' nyala' : '') + '"></div>';
    }
    return '<div class="kadar"><div class="kadar-grid' + (pembagi <= 5 ? ' lima' : '') +
      '">' + sel + '</div><div class="kadar-ket"><strong>1 dari ' + pembagi +
      ' bagian</strong> — ' + keterangan + '</div></div>';
  }

  function kadarUntuk(k) {
    if (k.id === 'simpanan' || k.id === 'penghasilan') {
      return kadarGrid(40, 'itulah 2,5% (rub’ul ‘usyr — seperempat dari sepersepuluh). ' +
        '39 bagian lainnya tetap milikmu, sudah dibersihkan.');
    }
    if (k.id === 'tani') {
      return k.pengairan === 'irigasi'
        ? kadarGrid(20, 'itulah 5% untuk pengairan berbiaya (nishful ‘usyr).')
        : kadarGrid(10, 'itulah 10% untuk pengairan alami (al-‘usyr).');
    }
    if (k.id === 'rikaz') return kadarGrid(5, 'itulah 20% (al-khumus) untuk harta temuan.');
    return '';
  }

  function catatanDaftar(k) {
    if (!k.catatan || !k.catatan.length) return '';
    return '<div class="catatan-daftar">' + k.catatan.map(function (c) {
      var label = c.tipe === 'khilaf' ? 'Khilaf' : c.tipe === 'indonesia' ? 'RI' : 'Info';
      return '<div class="catatan-item ' + c.tipe + '"><span class="tanda">' + label +
        '</span><span>' + esc(c.teks) + '</span></div>';
    }).join('') + '</div>';
  }

  // ── Kartu per kelompok ───────────────────────────────────────────
  function kartuKelompok(k) {
    var buka = !!S.ui.buka[k.id];
    var angka = k.zakat && k.zakat.natura
      ? '<span class="kel-natura">' + esc(k.zakat.natura) + '</span>'
      : k.zakat && k.zakat.rp
        ? '<span class="kel-rp">' + rp(k.zakat.rp) + '</span>'
        : '<span class="kel-rp" style="color:var(--fg3)">—</span>';
    var rincian = (k.rincian || []).map(function (r) {
      return '<div class="alir-baris">' + '<span>' + esc(r.label) + '</span><b>' +
        (typeof r.nilai === 'number' ? rp(r.nilai) : esc(r.nilai)) + '</b></div>';
    }).join('');
    return '<div class="kel-kartu' + (buka ? ' buka' : '') + '" data-kel="' + k.id + '">' +
      '<button class="kel-kepala" type="button" aria-expanded="' + buka + '">' +
      '<span class="kel-ikon">' + ikon(k.ikon) + '</span>' +
      '<span class="kel-info"><span class="kel-nama">' + k.label + '</span><br>' +
      statusPil(k.status) + '</span>' +
      '<span class="kel-angka">' + angka + '</span>' +
      ikon('i-chevron', 'ic-sm panah') + '</button>' +
      '<div class="kel-isi">' +
      '<p class="kel-alasan">' + esc(k.alasan) + '</p>' +
      (k.kapan && k.kapan.teks !== '—' ? '<p class="kel-alasan" style="margin-top:var(--space-2)">' +
        '<strong>Kapan:</strong> ' + esc(k.kapan.teks) + '</p>' : '') +
      (rincian ? '<div style="margin-top:var(--space-3)">' + rincian + '</div>' : '') +
      meter(k) +
      (k.status === 'wajib' ? kadarUntuk(k) : '') +
      catatanDaftar(k) +
      '<div style="margin-top:var(--space-2)">' +
      (k.dalil || []).map(function (id) { return renderDalil(id); }).join('') +
      (k.hukumId || []).map(hukumKartu).join('') +
      '</div></div></div>';
  }

  function hukumKartu(id) {
    var h = root.HukumID.ambil(id);
    if (!h) return '';
    return '<div class="dalil" style="border-left-color: var(--color-green)">' +
      '<div class="dalil-rujukan" style="color: var(--color-green)">' + h.rujukan + '</div>' +
      '<div class="dalil-terjemah">' + esc(h.teks) + '</div>' +
      '<div class="dalil-sumber">' + esc(h.ringkas) + '</div>' +
      '<div class="dalil-tautan"><a href="' + h.tautan.url + '" target="_blank" ' +
      'rel="noopener noreferrer">' + ikon('i-tautan', 'ic-sm') + h.tautan.label + '</a></div>' +
      '</div>';
  }

  // ── Diagram alir ─────────────────────────────────────────────────
  function diagramAlir(h) {
    var sp = h.simpanan;
    var tahap1 = '';
    if (sp) {
      var baris = sp.rincian.map(function (r) {
        return '<div class="alir-baris">' + ikon(
          r.id === 'uang' ? 'i-dompet' : r.id === 'emas' ? 'i-emas' :
          r.id === 'perak' ? 'i-emas' : r.id === 'dagang' ? 'i-toko' : 'i-kanan') +
          '<span>' + esc(r.label) + '</span><b>' + rp(r.nilai) + '</b></div>';
      }).join('');
      if (sp.hutang) {
        baris += '<div class="alir-baris minus">' + ikon('i-minus') +
          '<span>Hutang jatuh tempo</span><b>− ' + rp(sp.hutang) + '</b></div>';
      }
      baris += '<div class="alir-baris jumlah">' + ikon('i-timbangan') +
        '<span>Harta bersih yang dinilai</span><b>' + rp(sp.dasar) + '</b></div>';
      tahap1 = '<div class="alir-tahap"><div class="alir-tahap-judul">1 · Hartamu ' +
        'dikumpulkan & dibersihkan dari hutang</div>' + baris + meter(sp) + '</div>' +
        '<div class="alir-panah">' + ikon('i-unduh') + '</div>';
    }

    var potongan = [];
    if (sp && sp.status === 'wajib') potongan.push('<div class="alir-baris">' +
      ikon('i-dompet') + '<span>2,5% dari simpanan</span><b>' + rp(sp.zakat.rp) + '</b></div>');
    h.kelompok.forEach(function (k) {
      if (k.id === 'simpanan' || k.status !== 'wajib') return;
      potongan.push('<div class="alir-baris">' + ikon(k.ikon) + '<span>' + k.label +
        '</span><b>' + (k.zakat.natura ? esc(k.zakat.natura) : rp(k.zakat.rp)) + '</b></div>');
    });
    if (h.fitrah) {
      potongan.push('<div class="alir-baris">' + ikon('i-beras') +
        '<span>Zakat fitrah (jelang Idulfitri)</span><b>' +
        (h.fitrah.zakat.rp ? rp(h.fitrah.zakat.rp) : esc(h.fitrah.zakat.natura)) + '</b></div>');
    }

    var tahap2 = potongan.length
      ? '<div class="alir-tahap"><div class="alir-tahap-judul">2 · Bagian yang ' +
        'dikeluarkan sebagai zakat</div>' + potongan.join('') +
        (sp && sp.status === 'wajib' ? kadarGrid(40,
          'itulah 2,5% — 39 bagian lainnya <strong>tetap milikmu, sudah bersih</strong> ' +
          '(QS At-Taubah 103).') : '') + '</div>' +
        '<div class="alir-panah">' + ikon('i-unduh') + '</div>'
      : '';

    var asnaf = h.asnaf.map(function (a, i) {
      return '<button class="asnaf-kartu" type="button" data-asnaf="' + a.segmen +
        '" aria-pressed="' + (S.ui.asnaf === a.segmen ? 'true' : 'false') + '">' +
        '<span class="asnaf-nomor">' + (i + 1) + '</span>' +
        '<span class="asnaf-nama">' + a.label + '</span>' +
        '<span class="asnaf-arti">' + a.arti + '</span></button>';
    }).join('');

    var tahap3 = '<div class="alir-tahap"><div class="alir-tahap-judul">3 · Mengalir ke ' +
      'delapan golongan penerima</div>' +
      '<div class="asnaf-grid">' + asnaf + '</div>' +
      '<p class="asnaf-ket">Ketuk salah satu golongan untuk melihat ruasnya disorot di ' +
      'dalam ayatnya. Kamu tidak wajib membagi ke semua golongan — menyerahkan ke amil ' +
      'atau langsung ke fakir-miskin di sekitarmu sudah sah.</p>' +
      '<div id="ayat-asnaf">' + renderDalil('qs9-60', S.ui.asnaf) + '</div></div>';

    return '<section class="section" id="alir-sec" style="padding-top:0"><div class="wrap wrap-narrow">' +
      '<span class="overline">Simulasi alirannya</span>' +
      '<h2 class="flav-heading-l" style="margin-bottom:var(--space-6)">Bagaimana hartamu ' +
      'mengalir</h2><div class="alir">' + tahap1 + tahap2 + tahap3 + '</div></div></section>';
  }

  // ── Garis waktu ──────────────────────────────────────────────────
  function garisWaktu(h) {
    if (!h.timeline.length) return '';
    var item = h.timeline.map(function (t) {
      var jumlah = t.jumlah
        ? '<div class="gw-jumlah">' + (t.jumlah.rp ? rp(t.jumlah.rp) : esc(t.jumlah)) + '</div>'
        : '';
      var sisa = t.sisaHari != null && t.sisaHari > 0
        ? ' · sekitar ' + t.sisaHari + ' hari lagi' : '';
      return '<div class="gw-item"><div class="gw-ikon">' + ikon(t.ikon) + '</div>' +
        '<div class="gw-isi"><div class="gw-judul">' + t.label + '</div>' +
        '<div class="gw-kapan">' + esc(t.teks) + sisa + '</div>' + jumlah + '</div></div>';
    }).join('');
    return '<section class="section" id="waktu-sec" style="padding-top:0"><div class="wrap wrap-narrow">' +
      '<span class="overline">Kapan dibayar</span>' +
      '<h2 class="flav-heading-l" style="margin-bottom:var(--space-6)">Urutan waktunya</h2>' +
      '<div class="garis-waktu">' + item + '</div>' +
      renderDalil('hr-tajil') + '</div></section>';
  }

  // ── Delta dua mode ───────────────────────────────────────────────
  function kotakDelta(murni, indo) {
    var baris = [];
    var pengM = null, pengI = null;
    murni.kelompok.forEach(function (k) { if (k.id === 'penghasilan') pengM = k; });
    indo.kelompok.forEach(function (k) { if (k.id === 'penghasilan') pengI = k; });

    if (pengI && pengI.status === 'wajib') {
      baris.push('<div class="delta-baris"><span class="delta-tanda tambah">+ zakat</span>' +
        '<span>Zakat penghasilan dihitung (Fatwa MUI 3/2003 — qiyas, bukan nash ' +
        'langsung)</span><b>+ ' + rp(pengI.zakat.rp) + '/thn</b></div>');
    } else if (pengI && pengI.status === 'belumNisab') {
      baris.push('<div class="delta-baris"><span class="delta-tanda sama">dihitung</span>' +
        '<span>Zakat penghasilan ikut dihitung, tapi penghasilanmu masih di bawah ' +
        'nisab</span><b>+ Rp 0</b></div>');
    }
    if (indo.fitrah && indo.fitrah.zakat.rp) {
      baris.push('<div class="delta-baris"><span class="delta-tanda tambah">+ uang</span>' +
        '<span>Fitrah boleh ditunaikan dengan uang (pendapat Hanafi, praktik BAZNAS) — ' +
        'menurut nash: ' + esc(indo.fitrah.zakat.natura) + '</span><b>' +
        rp(indo.fitrah.zakat.rp) + '</b></div>');
    }
    baris.push('<div class="delta-baris"><span class="delta-tanda tambah">+ catatan</span>' +
      '<span>Jalur BAZNAS/LAZ resmi, Bukti Setor Zakat, dan pengurang penghasilan kena ' +
      'pajak (UU 23/2011 Pasal 21–23) ditampilkan</span></div>');

    var selisih = indo.totalRp - murni.totalRp;
    return '<div class="delta"><div class="delta-judul">' + ikon('i-info') +
      'Apa yang berubah bila aturan Indonesia dinyalakan?</div>' +
      '<div style="margin-top:var(--space-3)">' + baris.join('') + '</div>' +
      '<div class="delta-baris" style="border-top:1px solid var(--border-default);' +
      'border-bottom:none;margin-top:var(--space-2)"><span class="delta-tanda ' +
      (selisih ? 'tambah' : 'sama') + '">total</span><span>Selisih total zakat ' +
      'rupiah per tahun antara kedua mode</span><b>' +
      (selisih ? '+ ' + rp(selisih) : 'Rp 0 — sama') + '</b></div>' +
      '<p class="seg-ket" style="margin-top:var(--space-3)">Dasar nash tidak pernah ' +
      'dikurangi sedikit pun oleh mode mana pun — aturan Indonesia hanya MENAMBAH di ' +
      'atasnya. Semua rujukannya tetap ditampilkan dan bisa diperiksa.</p></div>';
  }

  // ── Langkah selanjutnya ──────────────────────────────────────────
  function langkahLanjut(h) {
    var item = root.Advice.susun(h).filter(function (a) {
      return !a.modeSaja || a.modeSaja === h.mode;
    }).map(function (a, i) {
      return '<div class="card" style="display:flex;gap:var(--space-4)">' +
        '<span class="kel-ikon" style="width:40px;height:40px">' + ikon(a.ikon) + '</span>' +
        '<div style="flex:1;min-width:0"><strong>' + (i + 1) + '. ' + a.judul + '</strong>' +
        '<p class="flav-body-sm" style="margin-top:var(--space-2)">' + esc(a.teks) + '</p>' +
        ((a.dalil || []).map(function (id) {
          var d = root.Dalil.ambil(id);
          return d ? '<a class="flav-caption" style="color:var(--color-ember);' +
            'font-weight:600;margin-right:var(--space-3)" href="rujukan.html#' + id + '">' +
            '📖 ' + d.rujukan + '</a>' : '';
        }).join('')) +
        ((a.hukumId || []).map(function (id) {
          var x = root.HukumID.ambil(id);
          return x ? '<a class="flav-caption" style="color:var(--color-green);' +
            'font-weight:600;margin-right:var(--space-3)" href="' + x.tautan.url +
            '" target="_blank" rel="noopener noreferrer">⚖ ' + x.rujukan + '</a>' : '';
        }).join('')) +
        (a.tautan ? '<a class="flav-caption" style="color:var(--color-ember);font-weight:600" ' +
          'href="' + a.tautan.url + '" target="_blank" rel="noopener noreferrer">↗ ' +
          a.tautan.label + '</a>' : '') +
        '</div></div>';
    }).join('');
    return '<section class="section" id="saran-sec" style="padding-top:0"><div class="wrap wrap-narrow">' +
      '<span class="overline">Setelah angka ini</span>' +
      '<h2 class="flav-heading-l" style="margin-bottom:var(--space-6)">Langkah ' +
      'selanjutnya untukmu</h2><div class="saran" id="saran-wadah">' + item +
      '</div></div></section>';
  }

  // ── Render utama ─────────────────────────────────────────────────
  function render() {
    S = root.UIWizard.S;
    rp = root.UIWizard.rp;

    var murni = root.Zakat.hitung(root.UIWizard.bangunMasukan('murni'));
    var indo = root.Zakat.hitung(root.UIWizard.bangunMasukan('indonesia'));
    var h = S.mode === 'indonesia' ? indo : murni;

    var chips = [];
    if (h.totalRpNanti) chips.push('menunggu haul: ' + rp(h.totalRpNanti));
    h.natura.forEach(function (n) {
      if (n.status === 'wajib') chips.push(n.label + ': ' + n.teks);
    });
    if (h.fitrah) {
      chips.push('fitrah: ' + (h.fitrah.zakat.rp ? rp(h.fitrah.zakat.rp)
        : h.fitrah.zakat.natura));
    }

    var kepala =
      '<section class="section" id="hasil-atas"><div class="wrap wrap-narrow">' +
      '<span class="overline">Hasil simulasi</span>' +
      '<h2 class="flav-display-l" style="margin-bottom:var(--space-4)">Zakatmu, beserta ' +
      'dalilnya.</h2>' +
      '<div style="display:flex;flex-wrap:wrap;gap:var(--space-3);align-items:center;' +
      'justify-content:space-between;margin-bottom:var(--space-6)">' +
      '<div class="mode-saklar" role="group" aria-label="Dasar hukum">' +
      '<button type="button" data-mode="murni" aria-pressed="' + (S.mode === 'murni') +
      '">Qur’an &amp; Sunnah</button>' +
      '<button type="button" data-mode="indonesia" aria-pressed="' +
      (S.mode === 'indonesia') + '">+ Hukum Indonesia</button></div>' +
      '<div class="harga-baris">' + ikon('i-emas') + ' emas ' + rp(h.harga.emas) +
      '/gr · nisab ' + rp(85 * h.harga.emas) + '</div></div>' +
      '<div class="total-hero" id="total-hero"><div class="total-label">Total zakat mal ' +
      'yang wajib ditunaikan sekarang</div>' +
      '<div class="total-angka">' + rp(h.totalRp) + '</div>' +
      '<div class="total-sub">' + (h.adaWajib
        ? 'Mode: ' + (h.mode === 'indonesia' ? 'Qur’an &amp; Sunnah + Hukum Indonesia'
          : 'Qur’an &amp; Sunnah') + '. Zakat dalam bentuk barang (panen/ternak) dan ' +
          'fitrah dihitung terpisah di bawah.'
        : 'Tidak ada kewajiban zakat dari isianmu saat ini — rinciannya di bawah, ' +
          'termasuk kapan ia akan mulai wajib.') + '</div>' +
      (chips.length ? '<div class="total-chips"><span>' + chips.join('</span><span>') +
        '</span></div>' : '') + '</div>' +
      '<div class="ekspor-baris" style="margin-top:var(--space-4)">' +
      '<button class="btn btn-dark btn-sm" type="button" id="btn-ekspor-png">' +
      ikon('i-gambar', 'ic-sm') + ' Simpan PNG</button>' +
      '<button class="btn btn-ghost btn-sm" type="button" id="btn-ekspor-pdf">' +
      ikon('i-dokumen', 'ic-sm') + ' Simpan PDF</button>' +
      '<button class="btn btn-ghost btn-sm" type="button" id="btn-ubah">' +
      ikon('i-pensil', 'ic-sm') + ' Ubah isian</button></div>' +
      '</div></section>';

    var kartu = '<section class="section" id="rincian-sec" style="padding-top:0">' +
      '<div class="wrap wrap-narrow"><span class="overline">Rincian per jenis harta</span>' +
      '<h2 class="flav-heading-l" style="margin-bottom:var(--space-6)">Setiap angka ada ' +
      'alasannya</h2><div class="hasil-grid">' +
      h.kelompok.map(kartuKelompok).join('') +
      (h.fitrah ? kartuKelompok(h.fitrah) : '') +
      '</div></div></section>';

    var deltaBox = '<section class="section" id="delta-sec" style="padding-top:0">' +
      '<div class="wrap wrap-narrow">' + kotakDelta(murni, indo) + '</div></section>';

    var el = document.getElementById('hasil');
    el.innerHTML = kepala + kartu + diagramAlir(h) + garisWaktu(h) + deltaBox +
      langkahLanjut(h) +
      '<section class="section" style="padding-top:0"><div class="wrap wrap-narrow">' +
      '<div class="note"><div class="note-title">Penafian</div> Ini alat bantu hitung, ' +
      'bukan pengganti amil atau ustadz. Untuk keadaan yang tidak tercakup, bawa ' +
      'hasil ini sebagai bahan awal konsultasi. Seluruh dalil bisa diperiksa di ' +
      '<a href="rujukan.html">halaman rujukan</a>.</div></div></section>';

    pasangHasil(el);
    animasikan(el);
    root.HasilTerakhir = { murni: murni, indonesia: indo, aktif: h };
  }

  function animasikan(el) {
    Array.prototype.forEach.call(el.querySelectorAll('.meter-isi'), function (m) {
      void m.offsetWidth;
      m.style.width = m.dataset.lebar + '%';
    });
  }

  function pasangHasil(el) {
    el.onclick = function (e) {
      var modeBtn = e.target.closest('[data-mode]');
      if (modeBtn) { S.mode = modeBtn.dataset.mode; render(); return; }

      var kel = e.target.closest('.kel-kepala');
      if (kel) {
        var id = kel.parentNode.dataset.kel;
        S.ui.buka[id] = !S.ui.buka[id];
        kel.parentNode.classList.toggle('buka', S.ui.buka[id]);
        kel.setAttribute('aria-expanded', String(!!S.ui.buka[id]));
        if (S.ui.buka[id]) animasikan(kel.parentNode);
        return;
      }

      var asnaf = e.target.closest('[data-asnaf]');
      if (asnaf) {
        var seg = asnaf.dataset.asnaf;
        S.ui.asnaf = S.ui.asnaf === seg ? null : seg;
        Array.prototype.forEach.call(el.querySelectorAll('[data-asnaf]'), function (b) {
          b.setAttribute('aria-pressed', String(b.dataset.asnaf === S.ui.asnaf));
        });
        document.getElementById('ayat-asnaf').innerHTML =
          renderDalil('qs9-60', S.ui.asnaf);
        return;
      }

      if (e.target.closest('#btn-ubah')) {
        document.getElementById('wizard').scrollIntoView({ behavior: 'smooth' });
        return;
      }
      if (e.target.closest('#btn-ekspor-png') && root.ZakatExport) {
        root.ZakatExport.png(root.HasilTerakhir.aktif);
        return;
      }
      if (e.target.closest('#btn-ekspor-pdf') && root.ZakatExport) {
        root.ZakatExport.pdf();
      }
    };
  }

  root.UIResult = { render: render, renderDalil: renderDalil, renderHukum: hukumKartu };
})(typeof window !== 'undefined' ? window : globalThis);
