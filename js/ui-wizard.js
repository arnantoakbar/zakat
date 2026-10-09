/*
 * Wizard isian — hitung.html.
 *
 * Seluruh formulir ada di HTML (statis); berkas ini hanya mengikat nilainya
 * ke satu objek S di memori. Isian tidak pernah disimpan atau dikirim ke server;
 * menutup tab berarti hilang, dan memang begitu janjinya ke pemakai. (Satu-satunya
 * yang diingat browser: pilihan tema, lewat tombol tema di navbar.)
 *
 * Setelah hasil pertama dirender, setiap perubahan isian menghitung ulang
 * seketika (hasil bisa direvisi tanpa mengulang dari awal).
 */

(function (root) {
  'use strict';

  var doc = document;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };

  var JENIS = ['uang', 'emas', 'dagang', 'penghasilan', 'tani', 'ternak', 'rikaz', 'fitrah'];
  var TOTAL_LANGKAH = 4;
  var fmt = new Intl.NumberFormat('id-ID');

  function rp(n) { return 'Rp ' + fmt.format(Math.round(n || 0)); }

  /** "92,5" → 92.5 · "1.000" → 1000 · "92.5" → 92.5 */
  function angka(v) {
    v = String(v == null ? '' : v).trim();
    if (v.indexOf(',') >= 0) v = v.replace(/\./g, '').replace(',', '.');
    else if ((v.match(/\./g) || []).length > 1 || /\.\d{3}$/.test(v)) v = v.replace(/\./g, '');
    var n = parseFloat(v);
    return isNaN(n) || n < 0 ? 0 : n;
  }

  function nilaiAwal() {
    return { ternakGembala: true, ternakDagang: false, taniBentuk: 'gabah', taniAir: 'hujan',
      emasZakati: false, fitrahJiwa: 1 };
  }

  var S = {
    langkah: 1,
    tampil: false,               // hasil sudah pernah dirender?
    mode: 'murni',
    pilih: {},
    nilai: nilaiAwal(),
    haul: { status: 'sudah', sejak: '' },
    harga: null,                 // diisi Harga.muat
    hargaDiubah: {},             // harga yang sudah disentuh pemakai
    ui: { buka: {}, asnaf: null }
  };

  // ── Masukan mesin dari keadaan ───────────────────────────────────
  function bangunMasukan(mode) {
    var n = S.nilai;
    var m = {
      mode: mode,
      harga: { emas: S.harga.emas, perak: S.harga.perak, beras: S.harga.beras },
      haul: { status: S.haul.status, sejak: S.haul.sejak || null }
    };
    if (S.pilih.uang && n.uangJumlah > 0) m.uang = { jumlah: n.uangJumlah };
    if (S.pilih.emas) {
      if (n.emasSimpan > 0 || n.emasPakai > 0) {
        m.emas = { gramSimpan: n.emasSimpan || 0, gramPakai: n.emasPakai || 0,
          zakatiPakai: !!n.emasZakati };
      }
      if (n.perakGram > 0) m.perak = { gram: n.perakGram };
    }
    if (S.pilih.dagang && (n.dagangBarang > 0 || n.dagangKas > 0 || n.dagangPiutang > 0)) {
      m.dagang = { nilaiBarang: n.dagangBarang || 0, kasUsaha: n.dagangKas || 0,
        piutangLancar: n.dagangPiutang || 0, hutangJatuhTempo: n.dagangHutang || 0 };
    }
    if (S.pilih.penghasilan && (n.pengBulan > 0 || n.pengBonus > 0)) {
      m.penghasilan = { perBulan: n.pengBulan || 0, bonusSetahun: n.pengBonus || 0 };
    }
    if (S.pilih.tani && n.taniKg > 0) {
      m.tani = { kg: n.taniKg, bentuk: n.taniBentuk, pengairan: n.taniAir };
    }
    if (S.pilih.ternak) {
      var t = {};
      ['kambing', 'sapi', 'unta'].forEach(function (j) {
        var ekor = Math.floor(n[j + 'Ekor'] || 0);
        if (ekor > 0) t[j] = { ekor: ekor, digembalakan: !!n.ternakGembala,
          untukDagang: !!n.ternakDagang };
      });
      if (Object.keys(t).length) m.ternak = t;
    }
    if (S.pilih.rikaz && n.rikazNilai > 0) m.rikaz = { nilai: n.rikazNilai };
    if (S.pilih.fitrah && n.fitrahJiwa > 0) m.fitrah = { jiwa: Math.round(n.fitrahJiwa) };
    if (n.hutangJatuhTempo > 0) m.hutang = { jatuhTempo: n.hutangJatuhTempo };
    if (n.piutangLancar > 0) m.piutang = { lancar: n.piutangLancar };
    return m;
  }

  function adaIsian(m) {
    return !!(m.uang || m.emas || m.perak || m.dagang || m.penghasilan || m.tani ||
      m.ternak || m.rikaz || m.fitrah);
  }

  // ── Tampilan ─────────────────────────────────────────────────────
  function pesan(t) {
    var el = $('#pesan');
    el.hidden = !t;
    el.innerHTML = t ? '<svg class="fl-icon" aria-hidden="true"><use href="#i-circle-alert"/></svg> ' + t : '';
  }

  function tampilkanBlok() {
    $$('[data-blok]').forEach(function (b) { b.hidden = !S.pilih[b.dataset.blok]; });
  }

  function isiHarga() {
    var h = S.harga;
    [['hargaEmas', 'emas'], ['hargaPerak', 'perak'], ['hargaBeras', 'beras']].forEach(function (p) {
      var el = $('#in-' + p[0]);
      if (doc.activeElement !== el) el.value = fmt.format(Math.round(h[p[1]]));
    });
    var live = h.sumber === 'live';
    var chip = $('#harga-fresh');
    chip.textContent = live ? 'Harga pasar hari ini' : 'Memakai nilai bawaan';
    if (live) chip.removeAttribute('data-age'); else chip.setAttribute('data-age', 'stale');
    $('#harga-ket').textContent = live
      ? 'Dari gold-api.com dan kurs open.er-api.com saat halaman dibuka. Boleh kamu ubah.'
      : 'Perkiraan bawaan (' + h.keterangan + '). Samakan dengan harga hari ini bila sempat.';
    $('#harga-nisab').textContent = 'Menentukan nisab: 85 gram × harga ini = ' + rp(85 * h.emas) + '.';
  }

  function keLangkah(n) {
    S.langkah = Math.max(1, Math.min(TOTAL_LANGKAH, n));
    if (S.langkah === 2) tampilkanBlok();
    if (S.langkah === 4) isiHarga();
    for (var i = 1; i <= TOTAL_LANGKAH; i++) {
      var el = $('#langkah-' + i);
      var aktif = i === S.langkah;
      if (aktif && el.hidden && root.Motion && !(root.Flavida && root.Flavida.reduced)) {
        root.Motion.animate(el, { opacity: [0, 1], y: [10, 0] }, { duration: 0.35 });
      }
      el.hidden = !aktif;
    }
    $$('#steps li').forEach(function (li, k) {
      li.classList.toggle('is-done', k + 1 < S.langkah);
      if (k + 1 === S.langkah) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    $('#btn-mundur').hidden = S.langkah === 1;
    $('#btn-maju span').textContent = S.langkah === TOTAL_LANGKAH ? 'Lihat hasilnya' : 'Lanjut';
    pesan('');
  }

  function majuAtau() {
    if (S.langkah === 1 && !JENIS.some(function (j) { return S.pilih[j]; })) {
      pesan('Pilih dulu minimal satu jenis harta.');
      return;
    }
    if (S.langkah === 2 && !adaIsian(bangunMasukan('murni'))) {
      pesan('Isi dulu minimal satu angka pada jenis harta yang kamu pilih.');
      return;
    }
    if (S.langkah < TOTAL_LANGKAH) {
      keLangkah(S.langkah + 1);
      $('#wizard').scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    generate();
  }

  function generate() {
    S.tampil = true;
    $('#hasil').hidden = false;
    root.UIResult.render(true);
    // Navigasi bagian dibangun sekali, setelah cangkang hasil terlihat.
    if (root.Flavida && root.Flavida.sectionNav) root.Flavida.sectionNav({ sections: '#hasil [data-section]' });
    $('#r-ringkasan').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function segar() {
    if (S.tampil && adaIsian(bangunMasukan('murni'))) root.UIResult.render(false);
  }

  function ubah() {
    keLangkah(2);
    $('#wizard').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function reset() {
    $$('#wizard input').forEach(function (i) {
      if (i.dataset.f && i.dataset.f.indexOf('harga') === 0) return;   // harga acuan dipertahankan
      if (i.type === 'checkbox' || i.type === 'radio') i.checked = i.defaultChecked;
      else i.value = i.defaultValue;
    });
    $$('.fl-stepper').forEach(function (s) {
      $('output', s).textContent = '1';
      s.setAttribute('data-value', '1');
      var b = $$('button', s);
      b[0].disabled = true;
      b[1].disabled = false;
    });
    $('#haul-sejak').hidden = true;
    S.pilih = {};
    S.nilai = nilaiAwal();
    S.haul = { status: 'sudah', sejak: '' };
    S.tampil = false;
    S.mode = 'murni';
    S.ui = { buka: {}, asnaf: null };
    $('#hasil').hidden = true;
    $$('#hasil [id^="out-"]').forEach(function (o) { o.innerHTML = ''; });
    keLangkah(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Perekat kejadian ─────────────────────────────────────────────
  function pasang() {
    var w = $('#wizard');

    w.addEventListener('input', function (e) {
      var inp = e.target.closest('input[data-f]');
      if (!inp) return;
      var f = inp.dataset.f, t = inp.dataset.t, nilai;
      if (f === 'haulSejak') { S.haul.sejak = inp.value; segar(); return; }
      if (t === 'rp') {
        var digit = inp.value.replace(/[^\d]/g, '').slice(0, 15);
        inp.value = digit ? fmt.format(+digit) : '';
        nilai = digit ? +digit : 0;
      } else {
        nilai = angka(inp.value);
      }
      if (f.indexOf('harga') === 0) {
        var kunci = f.replace('harga', '').toLowerCase();
        S.harga[kunci] = nilai;
        S.hargaDiubah[kunci] = true;
        $('#harga-nisab').textContent = 'Menentukan nisab: 85 gram × harga ini = ' + rp(85 * S.harga.emas) + '.';
      } else {
        S.nilai[f] = nilai;
      }
      segar();
    });

    w.addEventListener('change', function (e) {
      var el = e.target;
      if (el.matches('.fl-stepper')) {                  // peristiwa dari widget stepper bawaan
        S.nilai[el.dataset.f] = e.detail.value;
        segar();
      } else if (el.matches('[data-pilih]')) {
        S.pilih[el.dataset.pilih] = el.checked;
        pesan('');
      } else if (el.matches('[data-ck]')) {
        S.nilai[el.dataset.ck] = el.checked;
        segar();
      } else if (el.matches('[data-seg] input')) {
        if (el.name === 'haulStatus') {
          S.haul.status = el.value;
          $('#haul-sejak').hidden = el.value !== 'belum';
        } else {
          S.nilai[el.name] = el.value;
        }
        segar();
      }
    });

    $('#btn-maju').addEventListener('click', majuAtau);
    $('#btn-mundur').addEventListener('click', function () {
      keLangkah(S.langkah - 1);
      $('#wizard').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    $('#dlg-reset').addEventListener('close', function () {
      if (this.returnValue === 'ya') reset();
    });
  }

  /**
   * hitung.html?contoh=1 — memuat kasus contoh yang sama dengan demo di
   * beranda lalu menampilkan hasilnya, untuk berbagi tautan "begini lho
   * hasilnya" tanpa menyuruh orang mengetik. Angkanya contoh karangan.
   */
  function muatContoh() {
    function cek(sel) { var e = $(sel); e.checked = true; e.dispatchEvent(new Event('change', { bubbles: true })); }
    function isi(id, v) { var e = $('#in-' + id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }
    ['uang', 'emas', 'fitrah'].forEach(function (j) { cek('[data-pilih="' + j + '"]'); });
    isi('uangJumlah', '250000000');
    isi('emasSimpan', '20');
    isi('hutangJatuhTempo', '10000000');
    for (var i = 0; i < 3; i++) $('[data-f="fitrahJiwa"] [data-stepper-plus]').click();
    keLangkah(4);
    generate();
  }

  function mulai() {
    S.harga = { emas: root.Harga.BAWAAN.emas, perak: root.Harga.BAWAAN.perak,
      beras: root.Harga.BAWAAN.beras, sumber: 'default',
      keterangan: root.Harga.BAWAAN.keterangan };
    pasang();
    keLangkah(1);
    if (new URLSearchParams(location.search).has('contoh')) muatContoh();

    root.Harga.muat(function (h) {
      // Jangan menimpa angka yang sudah diketik pemakai.
      if (!S.hargaDiubah.emas) S.harga.emas = h.emas;
      if (!S.hargaDiubah.perak) S.harga.perak = h.perak;
      if (!S.hargaDiubah.beras) S.harga.beras = h.beras;
      S.harga.sumber = h.sumber;
      S.harga.keterangan = h.keterangan;
      if (S.langkah === 4) isiHarga();
      segar();
    });
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', mulai);
  else mulai();

  root.UIWizard = { S: S, bangunMasukan: bangunMasukan, rp: rp, ubah: ubah };
})(typeof window !== 'undefined' ? window : globalThis);
