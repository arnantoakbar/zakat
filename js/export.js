/*
 * Export hasil ke PNG dan PDF.
 *
 * Sengaja tanpa pustaka pihak ketiga (pola yang sama dengan waris):
 *  - PNG : kartu ringkasan digambar langsung ke <canvas>. Hasilnya rapi dan
 *          konsisten, bukan tangkapan layar yang ikut terpotong.
 *  - PDF : lewat dialog cetak browser (Simpan sebagai PDF), diatur oleh
 *          css/print.css. Teksnya tetap bisa diseleksi dan dicari, ukuran
 *          berkasnya kecil, dan tidak ada satu byte pun yang keluar dari
 *          perangkat.
 */

(function (root) {
  'use strict';

  var W = 1080;
  var PAD = 72;
  var CREAM = '#FFF8F0';
  var PARCHMENT = '#FFF0E0';
  var CHARCOAL = '#111111';
  var MID = '#555555';
  var LIGHT = '#999999';
  var FLAME = '#E8391D';
  var EMBER = '#A0341A';
  var GREEN = '#1B5E3B';

  function rp(n) {
    return 'Rp ' + String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function tanggalHariIni() {
    var bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
      'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    var d = new Date();
    return d.getDate() + ' ' + bulan[d.getMonth()] + ' ' + d.getFullYear();
  }

  /** Pecah teks menjadi beberapa baris selebar maxW. */
  function bungkus(ctx, teks, maxW) {
    var kata = String(teks).split(' ');
    var baris = [];
    var kini = '';
    kata.forEach(function (k) {
      var coba = kini ? kini + ' ' + k : k;
      if (ctx.measureText(coba).width > maxW && kini) {
        baris.push(kini);
        kini = k;
      } else {
        kini = coba;
      }
    });
    if (kini) baris.push(kini);
    return baris;
  }

  function bulatKotak(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  var STATUS_TEKS = {
    wajib: 'WAJIB', belumNisab: 'BELUM NISAB', belumHaul: 'MENUNGGU HAUL',
    tidakWajib: 'TIDAK WAJIB', info: 'PENJELASAN'
  };

  /**
   * Gambar kartu ringkasan lalu unduh sebagai PNG.
   * @param {object} h — hasil Zakat.hitung() yang sedang aktif di layar
   */
  function png(h) {
    if (!h) return;

    var kelompok = h.kelompok.concat(h.fitrah ? [h.fitrah] : []);
    // Tinggi dihitung dulu: kepala 300 + total 190 + baris kelompok + kaki.
    var TB = 84;                       // tinggi tiap baris kelompok
    var tinggiIsi = kelompok.length * TB;
    var H = 330 + 210 + tinggiIsi + 40 + 150;

    var kanvas = document.createElement('canvas');
    kanvas.width = W * 2;              // 2× supaya tajam di layar retina
    kanvas.height = H * 2;
    var ctx = kanvas.getContext('2d');
    ctx.scale(2, 2);

    // Latar
    ctx.fillStyle = CREAM;
    ctx.fillRect(0, 0, W, H);

    // Kepala
    ctx.fillStyle = FLAME;
    ctx.fillRect(0, 0, W, 10);
    ctx.fillStyle = EMBER;
    ctx.font = '700 26px "DM Sans", Arial, sans-serif';
    ctx.fillText('Zakat · by Flavida', PAD, 74);
    ctx.fillStyle = LIGHT;
    ctx.font = '400 20px "DM Sans", Arial, sans-serif';
    ctx.fillText(tanggalHariIni() + ' · dihitung di perangkat sendiri', PAD, 106);

    ctx.fillStyle = CHARCOAL;
    ctx.font = '800 52px "Bricolage Grotesque", "Arial Black", sans-serif';
    ctx.fillText('Ringkasan Zakat', PAD, 180);

    // Mode
    ctx.fillStyle = GREEN;
    ctx.font = '700 20px "DM Sans", Arial, sans-serif';
    ctx.fillText('Dasar: ' + (h.mode === 'indonesia'
      ? 'Qur’an & Sunnah + Hukum Indonesia (Fatwa MUI, BAZNAS)'
      : 'Qur’an & Sunnah'), PAD, 218);
    ctx.fillStyle = LIGHT;
    ctx.fillText('Harga acuan: emas ' + rp(h.harga.emas) + '/gram · nisab ' +
      rp(85 * h.harga.emas), PAD, 248);

    // Kotak total
    var yTotal = 286;
    ctx.fillStyle = CHARCOAL;
    bulatKotak(ctx, PAD, yTotal, W - PAD * 2, 170, 24);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,248,240,0.6)';
    ctx.font = '700 18px "DM Sans", Arial, sans-serif';
    ctx.fillText('TOTAL ZAKAT MAL YANG WAJIB SEKARANG', PAD + 40, yTotal + 52);
    ctx.fillStyle = CREAM;
    ctx.font = '800 64px "Bricolage Grotesque", "Arial Black", sans-serif';
    ctx.fillText(rp(h.totalRp), PAD + 40, yTotal + 126);
    if (h.totalRpNanti) {
      ctx.fillStyle = 'rgba(255,248,240,0.6)';
      ctx.font = '400 19px "DM Sans", Arial, sans-serif';
      ctx.fillText('+ ' + rp(h.totalRpNanti) + ' menunggu haul', PAD + 40, yTotal + 156);
    }

    // Baris per kelompok
    var y = yTotal + 210;
    kelompok.forEach(function (k) {
      ctx.fillStyle = '#FFFFFF';
      bulatKotak(ctx, PAD, y, W - PAD * 2, TB - 12, 16);
      ctx.fill();
      ctx.strokeStyle = 'rgba(232,57,29,0.15)';
      ctx.lineWidth = 1.5;
      bulatKotak(ctx, PAD, y, W - PAD * 2, TB - 12, 16);
      ctx.stroke();

      ctx.fillStyle = CHARCOAL;
      ctx.font = '700 22px "DM Sans", Arial, sans-serif';
      ctx.fillText(k.label, PAD + 28, y + 32);
      ctx.fillStyle = k.status === 'wajib' ? EMBER : LIGHT;
      ctx.font = '700 14px "DM Sans", Arial, sans-serif';
      ctx.fillText(STATUS_TEKS[k.status] || '', PAD + 28, y + 56);

      var angka = k.zakat && k.zakat.natura ? k.zakat.natura
        : k.zakat && k.zakat.rp ? rp(k.zakat.rp) : '—';
      ctx.fillStyle = k.status === 'wajib' ? FLAME : MID;
      ctx.font = '700 24px "DM Sans", Arial, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(angka, W - PAD - 28, y + 44);
      ctx.textAlign = 'left';
      y += TB;
    });

    // Kaki
    y += 14;
    ctx.fillStyle = PARCHMENT;
    bulatKotak(ctx, PAD, y, W - PAD * 2, 96, 16);
    ctx.fill();
    ctx.fillStyle = MID;
    ctx.font = '400 17px "DM Sans", Arial, sans-serif';
    var kaki = 'Disalurkan hanya kepada 8 golongan (QS At-Taubah 60). Alat bantu hitung, ' +
      'bukan pengganti amil/ustadz. Dalil lengkap & kode terbuka: ' +
      'github.com/arnantoakbar/zakat';
    bungkus(ctx, kaki, W - PAD * 2 - 56).forEach(function (b, i) {
      ctx.fillText(b, PAD + 28, y + 36 + i * 26);
    });

    kanvas.toBlob(function (blob) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'ringkasan-zakat.png';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 1000);
    }, 'image/png');
  }

  /** PDF = dialog cetak browser; tata letaknya diatur css/print.css. */
  function pdf() {
    window.print();
  }

  root.ZakatExport = { png: png, pdf: pdf };
})(typeof window !== 'undefined' ? window : globalThis);
