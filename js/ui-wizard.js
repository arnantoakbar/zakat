/*
 * Wizard isian — hitung.html.
 *
 * Empat langkah: pilih jenis harta → isi angkanya → hutang-piutang & haul →
 * harga acuan lalu Generate. Seluruh keadaan hidup di satu objek S di
 * memori; tidak ada localStorage, cookie, atau kiriman ke server — menutup
 * tab berarti hilang, dan memang begitu janjinya ke pemakai.
 *
 * Setelah hasil pertama dirender, setiap perubahan isian menghitung ulang
 * seketika (requirement: hasil bisa direvisi tanpa mengulang dari awal).
 */

(function (root) {
  'use strict';

  // ── Definisi kartu jenis harta ───────────────────────────────────
  var JENIS = [
    { id: 'uang', ikon: 'i-dompet', label: 'Uang & Tabungan',
      ket: 'tunai, rekening, deposito, e-wallet' },
    { id: 'emas', ikon: 'i-emas', label: 'Emas & Perak',
      ket: 'batangan, koin, perhiasan' },
    { id: 'dagang', ikon: 'i-toko', label: 'Usaha & Dagang',
      ket: 'barang dagangan, kas usaha' },
    { id: 'penghasilan', ikon: 'i-gaji', label: 'Gaji & Penghasilan',
      ket: 'gaji, honor, upah, bonus' },
    { id: 'tani', ikon: 'i-padi', label: 'Hasil Panen',
      ket: 'padi & bahan makanan pokok' },
    { id: 'ternak', ikon: 'i-kambing', label: 'Ternak',
      ket: 'kambing/domba, sapi/kerbau, unta' },
    { id: 'rikaz', ikon: 'i-permata', label: 'Harta Temuan',
      ket: 'harta karun terpendam (rikaz)' },
    { id: 'fitrah', ikon: 'i-beras', label: 'Zakat Fitrah',
      ket: 'per jiwa, jelang Idulfitri' }
  ];

  // ── Keadaan ──────────────────────────────────────────────────────
  var S = {
    langkah: 1,
    tampil: false,               // hasil sudah pernah dirender?
    mode: 'murni',
    pilih: {},
    nilai: {
      ternakGembala: true,
      ternakDagang: false,
      taniBentuk: 'gabah',
      taniAir: 'hujan',
      emasZakati: false
    },
    haul: { status: 'sudah', sejak: '' },
    harga: null,                 // diisi Harga.muat
    hargaDiubah: {},             // field harga yang sudah disentuh user
    ui: { buka: {}, asnaf: null }
  };

  function rp(n) {
    return 'Rp ' + String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  function angka(v) {
    var n = parseFloat(String(v == null ? '' : v).replace(/\./g, '').replace(',', '.'));
    return isNaN(n) || n < 0 ? 0 : n;
  }
  function ikon(id, cls) {
    return '<svg class="ic ' + (cls || '') + '" aria-hidden="true"><use href="#' + id + '"></use></svg>';
  }

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
        var ekor = n[j + 'Ekor'];
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

  // ── Pembangun potongan form ──────────────────────────────────────
  function fieldRp(id, label, ket, besar) {
    var v = S.nilai[id];
    return '<div class="uang-field">' +
      '<label class="uang-label" for="in-' + id + '">' + label + '</label>' +
      '<div class="uang-box' + (besar ? ' besar' : '') + '"><span class="rp">Rp</span>' +
      '<input id="in-' + id + '" data-f="' + id + '" data-jenis="rupiah" type="text" ' +
      'inputmode="numeric" autocomplete="off" placeholder="0" value="' +
      (v > 0 ? String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '') + '">' +
      '</div>' +
      (ket ? '<span class="uang-ket">' + ket + '</span>' : '') +
      '</div>';
  }

  function fieldAngka(id, label, ket, satuan, step) {
    var v = S.nilai[id];
    return '<div class="uang-field">' +
      '<label class="uang-label" for="in-' + id + '">' + label + '</label>' +
      '<div class="uang-box">' +
      '<input id="in-' + id + '" data-f="' + id + '" data-jenis="angka" type="number" ' +
      'inputmode="decimal" min="0" step="' + (step || 'any') + '" placeholder="0" value="' +
      (v > 0 ? v : '') + '">' +
      (satuan ? '<span class="rp">' + satuan + '</span>' : '') +
      '</div>' +
      (ket ? '<span class="uang-ket">' + ket + '</span>' : '') +
      '</div>';
  }

  function ceklis(id, judul, ket, aktif) {
    return '<button class="ceklis" type="button" data-ceklis="' + id + '" aria-pressed="' +
      (aktif ? 'true' : 'false') + '"><span class="kotak">' + ikon('i-check', 'ic-sm') +
      '</span><span><span class="ceklis-judul">' + judul + '</span>' +
      '<span class="ceklis-ket">' + ket + '</span></span></button>';
  }

  function seg(id, opsi, aktif) {
    return '<div class="seg" data-seg="' + id + '" role="group">' + opsi.map(function (o) {
      return '<button type="button" data-v="' + o.v + '" aria-pressed="' +
        (o.v === aktif ? 'true' : 'false') + '">' + o.t + '</button>';
    }).join('') + '</div>';
  }

  function blok(j, isi) {
    return '<div class="blok-isian"><div class="blok-kepala">' + ikon(j.ikon) +
      '<div><span class="blok-judul">' + j.label + '</span>' +
      '<span class="blok-ket">' + j.ket + '</span></div></div>' + isi + '</div>';
  }

  // ── Langkah 2: isian per jenis terpilih ──────────────────────────
  function renderIsian() {
    var h = '';
    JENIS.forEach(function (j) {
      if (!S.pilih[j.id]) return;
      if (j.id === 'uang') {
        h += blok(j, fieldRp('uangJumlah',
          'Total uang yang kamu simpan',
          'Jumlahkan semua: tunai, semua rekening & tabungan, deposito, e-wallet.', true));
      }
      if (j.id === 'emas') {
        h += blok(j,
          fieldAngka('emasSimpan', 'Emas yang disimpan',
            'Batangan, koin, atau perhiasan yang jarang/tidak dipakai.', 'gram') +
          fieldAngka('emasPakai', 'Perhiasan yang dipakai sehari-hari',
            'Menurut mazhab Syafi’i tidak wajib dizakati — diisi pun tidak dihitung, ' +
            'kecuali kamu centang pilihan di bawah.', 'gram') +
          ceklis('emasZakati', 'Zakati juga perhiasan yang dipakai',
            'Pendapat mazhab Hanafi, lebih berhati-hati.', S.nilai.emasZakati) +
          '<div style="margin-top:var(--space-4)"></div>' +
          fieldAngka('perakGram', 'Perak', 'Nisab perak sendiri: 595 gram.', 'gram'));
      }
      if (j.id === 'dagang') {
        h += blok(j,
          fieldRp('dagangBarang', 'Nilai barang dagangan',
            'Pakai harga jual hari ini, bukan harga beli. Etalase, kendaraan, dan alat ' +
            'kerja tidak ikut — itu bukan barang dagangan.') +
          fieldRp('dagangKas', 'Kas usaha', 'Uang usaha di laci & rekening toko.') +
          fieldRp('dagangPiutang', 'Piutang usaha yang lancar',
            'Tagihan ke pelanggan yang masih diharapkan kembali.') +
          fieldRp('dagangHutang', 'Hutang usaha jatuh tempo',
            'Hutang ke pemasok dsb. yang harus dibayar dalam waktu dekat — mengurangi.'));
      }
      if (j.id === 'penghasilan') {
        h += blok(j,
          fieldRp('pengBulan', 'Penghasilan per bulan', 'Gaji/honor kotor sebulan.') +
          fieldRp('pengBonus', 'Bonus & THR setahun', 'Perkiraan totalnya setahun.'));
      }
      if (j.id === 'tani') {
        h += blok(j,
          fieldAngka('taniKg', 'Hasil panen (kering)', 'Berat siap simpan, sekali panen.', 'kg') +
          '<div class="uang-label" style="margin-top:var(--space-2)">Bentuk hasilnya</div>' +
          seg('taniBentuk', [{ v: 'gabah', t: 'Gabah (nisab 653 kg)' },
            { v: 'beras', t: 'Beras (nisab 520 kg)' }], S.nilai.taniBentuk) +
          '<div class="uang-label" style="margin-top:var(--space-4)">Pengairannya</div>' +
          seg('taniAir', [{ v: 'hujan', t: 'Hujan / aliran alami — 10%' },
            { v: 'irigasi', t: 'Irigasi berbiaya — 5%' }], S.nilai.taniAir));
      }
      if (j.id === 'ternak') {
        h += blok(j,
          fieldAngka('kambingEkor', 'Kambing / domba', 'Nisab mulai 40 ekor.', 'ekor', 1) +
          fieldAngka('sapiEkor', 'Sapi / kerbau', 'Nisab mulai 30 ekor.', 'ekor', 1) +
          fieldAngka('untaEkor', 'Unta', 'Nisab mulai 5 ekor.', 'ekor', 1) +
          ceklis('ternakGembala', 'Digembalakan bebas di padang',
            'Sebagian besar tahun mencari makan sendiri (sa’imah) — syarat dalam ' +
            'haditsnya. Ternak yang dikandangkan & dibeli pakannya tidak wajib zakat ' +
            'ternak menurut jumhur.', S.nilai.ternakGembala) +
          ceklis('ternakDagang', 'Ternak ini untuk diperjualbelikan',
            'Kalau iya, ia dizakati sebagai harta dagang, bukan dengan tabel ekor.',
            S.nilai.ternakDagang));
      }
      if (j.id === 'rikaz') {
        h += blok(j, fieldRp('rikazNilai', 'Perkiraan nilai temuan',
          'Harta karun terpendam peninggalan lama yang kamu temukan.'));
      }
      if (j.id === 'fitrah') {
        h += blok(j, fieldAngka('fitrahJiwa', 'Jumlah jiwa yang kamu tanggung',
          'Dirimu + istri + anak-anak + orang lain yang nafkahnya kamu tanggung.',
          'jiwa', 1));
      }
    });
    document.getElementById('isian-wadah').innerHTML =
      h || '<p class="flav-body-sm">Belum ada jenis harta terpilih — kembali ke langkah 1.</p>';
  }

  // ── Langkah 3: hutang, piutang, haul ─────────────────────────────
  function renderHaul() {
    var el = document.getElementById('haul-wadah');
    el.innerHTML =
      fieldRp('hutangJatuhTempo', 'Hutang pribadi jatuh tempo dekat',
        'Cicilan & hutang yang HARUS dibayar dalam waktu dekat — mengurangi harta yang ' +
        'dizakati. Sisa KPR belasan tahun tidak dikurangkan seluruhnya; cukup ' +
        'angsuran tahun ini.') +
      fieldRp('piutangLancar', 'Piutang pribadi yang lancar',
        'Uangmu di tangan orang lain yang masih diharapkan kembali — ikut dihitung.') +
      '<div class="uang-label" style="margin-top:var(--space-4)">Sudah berapa lama harta ' +
      'simpananmu bertahan di atas nisab?</div>' +
      seg('haulStatus', [
        { v: 'sudah', t: 'Sudah ≥ 1 tahun' },
        { v: 'belum', t: 'Belum setahun' },
        { v: 'tidakTahu', t: 'Tidak yakin' }
      ], S.haul.status) +
      '<div id="haul-sejak" style="margin-top:var(--space-4);' +
      (S.haul.status === 'belum' ? '' : 'display:none') + '">' +
      '<label class="uang-label" for="in-haulSejak">Kira-kira sejak kapan mencapai nisab?</label>' +
      '<div class="uang-box"><input id="in-haulSejak" data-f="haulSejak" type="month" ' +
      'style="text-align:left" value="' + (S.haul.sejak || '') + '"></div>' +
      '<span class="uang-ket">Dipakai menghitung perkiraan tanggal jatuh tempo haulmu ' +
      '(1 tahun hijriah ≈ 354 hari).</span></div>' +
      '<p class="seg-ket">Haul hanya menyangkut simpanan & ternak. Panen, temuan, dan ' +
      'fitrah punya waktunya sendiri. Pilih "Tidak yakin" pun tidak apa-apa — zakatnya ' +
      'dihitung sekarang dan syarat haulnya dijelaskan di hasil.</p>';
  }

  // ── Langkah 4: harga acuan ───────────────────────────────────────
  function renderHarga() {
    var el = document.getElementById('harga-wadah');
    var ket = S.harga.sumber === 'live'
      ? '<span class="harga-sumber-live">' + ikon('i-check', 'ic-sm') + ' Harga pasar ' +
        'hari ini</span> — dari gold-api.com & kurs open.er-api.com. Boleh kamu ubah.'
      : ikon('i-info', 'ic-sm') + ' Memakai nilai bawaan (' + S.harga.keterangan +
        '). Ubah sesuai harga hari ini bila sempat.';
    el.innerHTML =
      '<div class="harga-baris" style="margin-bottom:var(--space-4)">' + ket + '</div>' +
      fieldRp('hargaEmas', 'Harga emas per gram',
        'Menentukan nisab: 85 gram × harga ini = ' + rp(85 * S.harga.emas) + '.') +
      fieldRp('hargaPerak', 'Harga perak per gram', 'Nisab perak: 595 gram.') +
      fieldRp('hargaBeras', 'Harga beras per kg',
        'Untuk konversi zakat fitrah & padanan rupiah hasil panen beras.');
    // nilai harga disimpan terpisah dari S.nilai
    ['hargaEmas', 'hargaPerak', 'hargaBeras'].forEach(function (f) {
      var kunci = f.replace('harga', '').toLowerCase();
      var inp = document.getElementById('in-' + f);
      inp.value = String(Math.round(S.harga[kunci])).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    });
  }

  // ── Navigasi langkah ─────────────────────────────────────────────
  var TOTAL_LANGKAH = 4;

  function keLangkah(n) {
    S.langkah = Math.max(1, Math.min(TOTAL_LANGKAH, n));
    if (S.langkah === 2) renderIsian();
    if (S.langkah === 3) renderHaul();
    if (S.langkah === 4) renderHarga();
    for (var i = 1; i <= TOTAL_LANGKAH; i++) {
      var el = document.getElementById('langkah-' + i);
      el.classList.toggle('aktif', i === S.langkah);
    }
    document.getElementById('langkah-pos').textContent =
      'Langkah ' + S.langkah + ' dari ' + TOTAL_LANGKAH;
    document.getElementById('btn-mundur').style.visibility =
      S.langkah === 1 ? 'hidden' : 'visible';
    document.getElementById('btn-maju').innerHTML = S.langkah === TOTAL_LANGKAH
      ? 'Generate ' + ikon('i-kanan', 'ic-sm')
      : 'Lanjut ' + ikon('i-kanan', 'ic-sm');
    setPesan('');
    var atas = document.getElementById('wizard');
    if (atas.getBoundingClientRect().top < 0) atas.scrollIntoView({ behavior: 'smooth' });
  }

  function setPesan(t) {
    var el = document.getElementById('wizard-pesan');
    el.textContent = t;
    el.style.display = t ? 'block' : 'none';
  }

  function maju() {
    if (S.langkah === 1 && !JENIS.some(function (j) { return S.pilih[j.id]; })) {
      setPesan('Pilih dulu minimal satu jenis harta.');
      return;
    }
    if (S.langkah === 2 && !adaIsian(bangunMasukan('murni'))) {
      setPesan('Isi dulu minimal satu angka pada jenis harta yang kamu pilih.');
      return;
    }
    if (S.langkah < TOTAL_LANGKAH) { keLangkah(S.langkah + 1); return; }
    generate();
  }

  function generate() {
    var m = bangunMasukan('murni');
    if (!adaIsian(m)) { setPesan('Belum ada isian yang bisa dihitung.'); return; }
    S.tampil = true;
    root.UIResult.render();
    document.getElementById('hasil').hidden = false;
    document.getElementById('hasil').scrollIntoView({ behavior: 'smooth' });
  }

  function hitungUlangBilaTampil() {
    if (S.tampil && adaIsian(bangunMasukan('murni'))) root.UIResult.render();
  }

  function reset() {
    if (!confirm('Kosongkan seluruh isian dan mulai dari awal?')) return;
    S.pilih = {};
    S.nilai = { ternakGembala: true, ternakDagang: false, taniBentuk: 'gabah',
      taniAir: 'hujan', emasZakati: false };
    S.haul = { status: 'sudah', sejak: '' };
    S.tampil = false;
    S.mode = 'murni';
    S.ui = { buka: {}, asnaf: null };
    document.getElementById('hasil').hidden = true;
    document.getElementById('hasil').innerHTML = '';
    renderPilih();
    keLangkah(1);
  }

  // ── Langkah 1: kartu pilihan ─────────────────────────────────────
  function renderPilih() {
    document.getElementById('pilih-wadah').innerHTML = JENIS.map(function (j) {
      return '<button class="pilih" type="button" data-pilih="' + j.id +
        '" aria-pressed="' + (S.pilih[j.id] ? 'true' : 'false') + '">' +
        ikon(j.ikon) + '<span>' + j.label + '</span>' +
        '<span class="uang-ket" style="margin-top:2px">' + j.ket + '</span></button>';
    }).join('');
  }

  // ── Perekat kejadian ─────────────────────────────────────────────
  function pasang() {
    var wizard = document.getElementById('wizard');

    wizard.addEventListener('click', function (e) {
      var pilih = e.target.closest('[data-pilih]');
      if (pilih) {
        var id = pilih.dataset.pilih;
        S.pilih[id] = !S.pilih[id];
        pilih.setAttribute('aria-pressed', String(!!S.pilih[id]));
        setPesan('');
        return;
      }
      var ck = e.target.closest('[data-ceklis]');
      if (ck) {
        var f = ck.dataset.ceklis;
        S.nilai[f] = !S.nilai[f];
        ck.setAttribute('aria-pressed', String(!!S.nilai[f]));
        hitungUlangBilaTampil();
        return;
      }
      var segBtn = e.target.closest('.seg button');
      if (segBtn) {
        var grup = segBtn.closest('[data-seg]');
        var idSeg = grup.dataset.seg;
        var v = segBtn.dataset.v;
        Array.prototype.forEach.call(grup.children, function (b) {
          b.setAttribute('aria-pressed', String(b === segBtn));
        });
        if (idSeg === 'haulStatus') {
          S.haul.status = v;
          var sejak = document.getElementById('haul-sejak');
          if (sejak) sejak.style.display = v === 'belum' ? '' : 'none';
        } else {
          S.nilai[idSeg] = v;
        }
        hitungUlangBilaTampil();
      }
    });

    wizard.addEventListener('input', function (e) {
      var inp = e.target.closest('input[data-f]');
      if (!inp) return;
      var f = inp.dataset.f;
      if (inp.dataset.jenis === 'rupiah') {
        var digit = inp.value.replace(/[^\d]/g, '').slice(0, 15);
        inp.value = digit ? String(+digit).replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';
        var nilai = digit ? +digit : 0;
        if (f.indexOf('harga') === 0) {
          var kunci = f.replace('harga', '').toLowerCase();
          S.harga[kunci] = nilai;
          S.hargaDiubah[kunci] = true;
        } else {
          S.nilai[f] = nilai;
        }
      } else if (f === 'haulSejak') {
        S.haul.sejak = inp.value;
      } else {
        S.nilai[f] = angka(inp.value);
      }
      hitungUlangBilaTampil();
    });

    document.getElementById('btn-maju').addEventListener('click', maju);
    document.getElementById('btn-mundur').addEventListener('click', function () {
      keLangkah(S.langkah - 1);
    });
    document.getElementById('btn-mulai-ulang').addEventListener('click', reset);
  }

  /**
   * hitung.html?contoh=1 — langsung memuat kasus contoh yang sama dengan
   * demo di beranda, lalu menampilkan hasilnya. Berguna untuk berbagi
   * tautan "begini lho hasilnya" tanpa menyuruh orang mengetik dulu.
   * Tidak ada data pribadi di sini — angkanya contoh karangan.
   */
  function muatContoh() {
    S.pilih = { uang: true, emas: true, fitrah: true };
    S.nilai.uangJumlah = 250000000;
    S.nilai.emasSimpan = 20;
    S.nilai.fitrahJiwa = 4;
    S.nilai.hutangJatuhTempo = 10000000;
    S.tampil = true;
    keLangkah(4);
    root.UIResult.render();
    document.getElementById('hasil').hidden = false;
    // Kalau ada #fragmen, gulir ke sana setelah hasil dirender.
    if (location.hash) {
      var target = document.querySelector(location.hash);
      if (target) target.scrollIntoView();
    } else {
      document.getElementById('hasil').scrollIntoView();
    }
  }

  // ── Mulai ────────────────────────────────────────────────────────
  function mulai() {
    S.harga = { emas: root.Harga.BAWAAN.emas, perak: root.Harga.BAWAAN.perak,
      beras: root.Harga.BAWAAN.beras, sumber: 'default',
      keterangan: root.Harga.BAWAAN.keterangan };
    renderPilih();
    pasang();
    keLangkah(1);
    if (new URLSearchParams(location.search).has('contoh')) muatContoh();

    root.Harga.muat(function (h) {
      // Jangan menimpa angka yang sudah diketik user.
      if (!S.hargaDiubah.emas) S.harga.emas = h.emas;
      if (!S.hargaDiubah.perak) S.harga.perak = h.perak;
      if (!S.hargaDiubah.beras) S.harga.beras = h.beras;
      S.harga.sumber = h.sumber;
      S.harga.keterangan = h.keterangan;
      if (S.langkah === 4) renderHarga();
      hitungUlangBilaTampil();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mulai);
  } else {
    mulai();
  }

  root.UIWizard = { S: S, bangunMasukan: bangunMasukan, keLangkah: keLangkah, rp: rp };
})(typeof window !== 'undefined' ? window : globalThis);
