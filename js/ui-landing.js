/*
 * Animasi demo di halaman utama.
 *
 * Angka yang ditampilkan TIDAK dikarang. Contoh kasusnya dijalankan lewat
 * mesin zakat yang sama persis dengan yang dipakai user nanti — jadi apa
 * yang dilihat di halaman depan memang begitulah hasilnya. Harganya memakai
 * nilai bawaan (bukan API) supaya demonya deterministik dan tetap jalan
 * saat offline.
 */

(function () {
  'use strict';

  var HARGA = window.Harga.BAWAAN;

  var CONTOH = {
    mode: 'murni',
    harga: HARGA,
    uang: { jumlah: 250000000 },
    emas: { gramSimpan: 20 },
    hutang: { jatuhTempo: 10000000 },
    fitrah: { jiwa: 4 },
    haul: { status: 'sudah' }
  };

  var hasil = window.Zakat.hitung(CONTOH);
  var sp = hasil.simpanan;

  function rp(n) {
    return 'Rp ' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  function rpPendek(n) {
    if (n >= 1e9) return 'Rp ' + (n / 1e9).toFixed(n % 1e9 === 0 ? 0 : 1).replace('.', ',') + ' M';
    if (n >= 1e6) return 'Rp ' + Math.round(n / 1e6) + ' jt';
    return rp(n);
  }
  function ikon(id, gaya) {
    return '<svg class="ic" aria-hidden="true"' + (gaya ? ' style="' + gaya + '"' : '') +
      '><use href="#' + id + '"></use></svg>';
  }

  // ── Isi tiap tahap ───────────────────────────────────────────────
  var TAHAP = [
    {
      judul: 'Langkah 1 — Kondisi hartamu',
      isi: function () {
        var chips = [
          { ik: 'i-dompet', t: 'Tabungan ' + rpPendek(CONTOH.uang.jumlah) },
          { ik: 'i-emas', t: 'Emas 20 gram' },
          { ik: 'i-minus', t: 'Hutang jatuh tempo ' + rpPendek(CONTOH.hutang.jatuhTempo) },
          { ik: 'i-beras', t: 'Keluarga 4 jiwa' }
        ].map(function (c, i) {
          return '<span class="demo-chip" style="animation-delay:' + (i * 160) + 'ms">' +
            ikon(c.ik) + c.t + '</span>';
        }).join('');
        return '<p class="flav-body-sm" style="margin-bottom:var(--space-4)">Contoh: seorang ' +
          'karyawan dengan simpanan yang sudah mengendap setahun:</p><div>' + chips + '</div>';
      }
    },
    {
      judul: 'Langkah 2 — Dicek ke nisab',
      isi: function () {
        var baris = sp.rincian.map(function (r, i) {
          return '<div class="demo-baris" style="opacity:0;animation:naik .4s ease ' +
            (i * 170) + 'ms forwards">' + ikon(r.id === 'emas' ? 'i-emas' : 'i-dompet') +
            '<span>' + r.label + '</span><b>' + rpPendek(r.nilai) + '</b></div>';
        }).join('');
        baris += '<div class="demo-baris" style="opacity:0;animation:naik .4s ease 340ms forwards">' +
          ikon('i-minus') + '<span>Hutang jatuh tempo</span>' +
          '<b style="color:var(--color-flame)">− ' + rpPendek(sp.hutang) + '</b></div>';
        baris += '<div class="demo-baris" style="opacity:0;animation:naik .4s ease 510ms forwards">' +
          ikon('i-timbangan') + '<span style="font-weight:600">Harta bersih vs nisab ' +
          '(85 gr emas)</span><b>' + rpPendek(sp.dasar) + ' &gt; ' + rpPendek(sp.nisab.rp) +
          '</b></div>';
        return baris +
          '<p class="flav-caption" style="margin-top:var(--space-3)">Lewat nisab dan sudah ' +
          'setahun (haul) → wajib zakat.</p>';
      }
    },
    {
      judul: 'Langkah 3 — Zakatnya dihitung',
      isi: function () {
        var sel = '';
        for (var i = 0; i < 40; i++) {
          sel += '<div class="kadar-sel' + (i === 0 ? ' nyala' : '') + '"></div>';
        }
        return '<div class="demo-baris"><span>Kadar simpanan: <strong>2,5%</strong> ' +
          '(1 dari 40 bagian)</span><b style="color:var(--color-flame)">' +
          rp(sp.zakat.rp) + '</b></div>' +
          '<div class="kadar-grid" style="margin-top:var(--space-2)">' + sel + '</div>' +
          '<div class="demo-baris" style="margin-top:var(--space-2)">' +
          '<span>Zakat fitrah: 4 jiwa × 2,5 kg</span><b>' + hasil.fitrah.zakat.natura +
          '</b></div>' +
          '<p class="flav-caption" style="margin-top:var(--space-2)">39 bagian lainnya tetap ' +
          'miliknya — justru menjadi bersih karena zakatnya ditunaikan.</p>';
      }
    },
    {
      judul: 'Langkah 4 — Dasar aturannya ikut ditampilkan',
      isi: function () {
        var d = window.Dalil.ambil('qs9-103');
        return '<div class="dalil" style="margin-top:0">' +
          '<div class="dalil-rujukan">' + d.rujukan + '</div>' +
          '<div class="dalil-arab" lang="ar" dir="rtl">' + d.segmen[0].arab + '</div>' +
          '<div class="dalil-terjemah">' + d.segmen[0].arti + '</div>' +
          '</div>' +
          '<p class="flav-body-sm" style="margin-top:var(--space-4)">Setiap angka ditelusuri ' +
          'ke ayat atau hadits sahihnya — ditampilkan utuh, bisa kamu baca dan periksa ' +
          'sendiri di halaman hasil.</p>';
      }
    }
  ];

  var wadahIsi = document.getElementById('demo-isi');
  var wadahJudul = document.getElementById('demo-tahap');
  var wadahTitik = document.getElementById('demo-titik');
  var kini = 0;
  var timer = null;

  wadahTitik.innerHTML = TAHAP.map(function (t, i) {
    return '<button type="button" aria-label="Lihat ' + t.judul + '" data-tahap="' + i + '"></button>';
  }).join('');

  function tampil(n) {
    kini = n % TAHAP.length;
    var t = TAHAP[kini];
    wadahJudul.textContent = t.judul;
    wadahIsi.innerHTML = '<div class="demo-panel aktif">' + t.isi() + '</div>';
    if (t.sesudah) t.sesudah(wadahIsi);
    Array.prototype.forEach.call(wadahTitik.children, function (s, i) {
      s.classList.toggle('on', i === kini);
      s.setAttribute('aria-current', String(i === kini));
    });
  }

  // Selalu bersihkan timer lama sebelum menjadwalkan yang baru — tanpa ini,
  // tiap ketukan titik navigasi meninggalkan rantai timer sendiri.
  function jalan() {
    clearTimeout(timer);
    timer = setTimeout(function () {
      tampil(kini + 1);
      jalan();
    }, kini === 2 ? 4600 : 3600);
  }

  tampil(0);

  var kurangiGerak = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!kurangiGerak.matches) jalan();

  kurangiGerak.addEventListener('change', function (e) {
    if (e.matches) clearTimeout(timer);
    else jalan();
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) clearTimeout(timer);
    else if (!kurangiGerak.matches) jalan();
  });

  wadahTitik.addEventListener('click', function (e) {
    var t = e.target.closest('[data-tahap]');
    if (!t) return;
    tampil(Number(t.dataset.tahap));
    if (!kurangiGerak.matches) jalan();
    else clearTimeout(timer);
  });
})();
