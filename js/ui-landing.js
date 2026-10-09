/*
 * Demo di halaman utama.
 *
 * Angka yang ditampilkan TIDAK dikarang. Contoh kasusnya dijalankan lewat
 * mesin zakat yang sama persis dengan yang dipakai pemakai nanti, jadi apa
 * yang dilihat di halaman depan memang begitulah hasilnya. Harganya memakai
 * nilai bawaan (bukan API) supaya demonya deterministik dan tetap jalan
 * saat offline.
 *
 * Berganti tahap sendiri sampai pemakai menyentuhnya (atau menekan jeda);
 * berhenti saat tab tidak terlihat, dan tidak bergerak sama sekali bila
 * pemakai meminta gerak dikurangi.
 */

(function () {
  'use strict';

  var D = window.UIDalil, ic = D.ic;
  var fmt = new Intl.NumberFormat('id-ID');
  function rp(n) { return 'Rp ' + fmt.format(Math.round(n)); }

  var CONTOH = {
    mode: 'murni',
    harga: window.Harga.BAWAAN,
    uang: { jumlah: 250000000 },
    emas: { gramSimpan: 20 },
    hutang: { jatuhTempo: 10000000 },
    fitrah: { jiwa: 4 },
    haul: { status: 'sudah' }
  };
  var hasil = window.Zakat.hitung(CONTOH);
  var sp = hasil.simpanan;

  function baris(ikon, judul, ket) {
    return '<li><span class="fl-card__icon" style="width:44px;height:44px">' + ic(ikon) + '</span>' +
      '<div><b>' + judul + '</b>' + (ket ? '<small>' + ket + '</small>' : '') + '</div></li>';
  }
  function kv(rows) {
    return '<dl class="fl-kv">' + rows.map(function (r) {
      return '<div' + (r[2] ? ' class="is-total"' : '') + '><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>';
    }).join('') + '</dl>';
  }

  var TAHAP = [
    {
      judul: 'Kondisi hartamu',
      isi: function () {
        return '<p class="fl-hint">Seorang karyawan dengan simpanan yang sudah mengendap setahun:</p>' +
          '<ul class="fl-list zk-baris">' +
          baris('i-wallet', 'Tabungan ' + rp(CONTOH.uang.jumlah)) +
          baris('i-coins', 'Emas 20 gram', 'disimpan, tidak dipakai') +
          baris('i-minus', 'Hutang jatuh tempo ' + rp(CONTOH.hutang.jatuhTempo)) +
          baris('i-users-round', 'Keluarga 4 jiwa', 'untuk zakat fitrah') + '</ul>';
      }
    },
    {
      judul: 'Dicek ke nisab',
      isi: function () {
        var rows = sp.rincian.map(function (r) { return [r.label, rp(r.nilai)]; });
        rows.push(['Hutang jatuh tempo', '− ' + rp(sp.hutang)]);
        rows.push(['Harta bersih', rp(sp.dasar), true]);
        return kv(rows) +
          '<div class="zk-meter"><div class="zk-meter__row"><span>Sudah melewati nisab dan setahun (haul)</span>' +
          '<span>nisab ' + rp(sp.nisab.rp) + '</span></div>' +
          '<div class="fl-progress" role="progressbar" aria-label="Posisi terhadap nisab" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100" style="--value:100%"><i></i></div></div>';
      }
    },
    {
      judul: 'Zakatnya dihitung',
      isi: function () {
        return '<div class="zk-kadar"><div id="demo-waffle"></div>' +
          '<p class="fl-hint"><b>1 dari 40 bagian</b> = 2,5%. Sisanya tetap milikmu dan menjadi bersih.</p></div>' +
          kv([['Zakat simpanan', rp(sp.zakat.rp), true], ['Zakat fitrah, 4 jiwa × 2,5 kg', hasil.fitrah.zakat.natura]]);
      },
      sesudah: function () {
        window.Flavida.chart(document.getElementById('demo-waffle'), { type: 'waffle', total: 40, filled: 1,
          cols: 10, title: 'Satu bagian dari 40', locale: 'id-ID' });
      }
    },
    {
      judul: 'Dasar aturannya',
      isi: function () {
        return D.cite('qs9-103', 'ambil', null, true) +
          '<p class="fl-hint">Setiap angka ditelusuri ke ayat atau hadits sahihnya, utuh dan bisa kamu periksa sendiri di halaman hasil.</p>';
      }
    }
  ];

  var elIsi = document.getElementById('demo-isi');
  var elJudul = document.getElementById('demo-judul');
  var elTahap = document.getElementById('demo-tahap');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var kini = 0, timer = null, berhenti = reduced.matches;

  function tampil(n) {
    kini = n % TAHAP.length;
    var t = TAHAP[kini];
    elJudul.textContent = (kini + 1) + '. ' + t.judul;
    elIsi.innerHTML = t.isi();
    if (t.sesudah) t.sesudah();
    var radio = elTahap.querySelector('input[value="' + kini + '"]');
    if (radio) radio.checked = true;
    if (window.Motion && !reduced.matches) {
      window.Motion.animate(elIsi, { opacity: [0, 1], y: [8, 0] }, { duration: 0.35 });
    }
  }

  // Bersihkan timer lama sebelum menjadwalkan yang baru, supaya tiap ketukan
  // tidak meninggalkan rantai timer sendiri.
  function jalan() {
    clearTimeout(timer);
    if (berhenti || document.hidden) return;
    timer = setTimeout(function () { tampil(kini + 1); jalan(); }, kini === 2 ? 5200 : 4200);
  }

  var tombolJeda = document.getElementById('demo-jeda');
  function aturJeda(jeda) {
    berhenti = jeda;
    tombolJeda.setAttribute('aria-pressed', String(jeda));
    tombolJeda.setAttribute('aria-label', jeda ? 'Putar animasi' : 'Jeda animasi');
    tombolJeda.innerHTML = ic(jeda ? 'i-play' : 'i-pause');
    if (jeda) clearTimeout(timer); else jalan();
  }
  tombolJeda.addEventListener('click', function () { aturJeda(!berhenti); });
  if (berhenti) aturJeda(true);

  elTahap.addEventListener('change', function (e) {
    if (e.target.name !== 'tahap') return;
    aturJeda(true);                  // pemakai memegang kendali; tidak berganti sendiri lagi
    tampil(+e.target.value);
  });
  document.addEventListener('visibilitychange', jalan);
  reduced.addEventListener('change', function (e) { aturJeda(e.matches); });

  // Cuplikan dalil di bagian kode terbuka: dari dataset yang sama, bukan salinan.
  document.getElementById('contoh-cite').innerHTML = D.cite('hr-muadz', 'zakat');

  tampil(0);
  jalan();
})();
