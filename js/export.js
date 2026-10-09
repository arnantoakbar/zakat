/*
 * Export hasil ke PNG dan PDF.
 *
 * Sengaja tanpa pustaka pihak ketiga:
 *  - PNG : kartu ringkasan digambar langsung ke <canvas> dengan warna dan
 *          huruf design system Flavida. Hasilnya rapi dan konsisten, bukan
 *          tangkapan layar yang ikut terpotong.
 *  - PDF : lewat dialog cetak browser (Simpan sebagai PDF), diatur oleh
 *          css/print.css. Teksnya tetap bisa diseleksi dan dicari, ukuran
 *          berkasnya kecil, dan tidak ada satu byte pun yang keluar dari
 *          perangkat.
 */

(function (root) {
  'use strict';

  var W = 1080;
  var PAD = 72;
  var C = { cream: '#FFF8F0', parchment: '#FFF0E0', surface: '#FFFDF9', sunk: '#F8E9D6',
    ink: '#1A1410', mid: '#5A4F48', light: '#706157', flame: '#E8391D', flameInk: '#C42E14',
    ember: '#A0341A', charcoal: '#111111', border: 'rgba(160,52,26,0.14)' };
  var DISPLAY = '"Gabarito", "Trebuchet MS", system-ui, sans-serif';
  var BODY = '"Figtree", "Segoe UI", system-ui, sans-serif';

  // warna chip status — sama dengan .zk-status di css/zakat.css
  var STATUS = {
    wajib:      { t: 'Wajib zakat',   bg: '#FFE0D5', fg: '#8A1E0F', bentuk: 'bulat' },
    belumNisab: { t: 'Belum nisab',   bg: '#F8E9D6', fg: '#5A4F48', bentuk: 'cincin' },
    belumHaul:  { t: 'Menunggu haul', bg: '#FFEBBD', fg: '#6B3F02', bentuk: 'segitiga' },
    tidakWajib: { t: 'Tidak wajib',   bg: '#F8E9D6', fg: '#5A4F48', bentuk: 'kotak' },
    info:       { t: 'Penjelasan',    bg: '#D4E6FA', fg: '#1D4F87', bentuk: 'belah' }
  };

  function rp(n) {
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(n || 0));
  }

  function tanggalHariIni() {
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  }

  function kotak(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /** Pecah teks menjadi baris selebar maxW. */
  function bungkus(ctx, teks, maxW) {
    var baris = [], kini = '';
    String(teks).split(' ').forEach(function (k) {
      var coba = kini ? kini + ' ' + k : k;
      if (ctx.measureText(coba).width > maxW && kini) { baris.push(kini); kini = k; } else kini = coba;
    });
    if (kini) baris.push(kini);
    return baris;
  }

  /** Bayangan lembut hangat ala "clay": satu lapis, tanpa cahaya berwarna. */
  function timbul(ctx, fn) {
    ctx.save();
    ctx.shadowColor = 'rgba(160,52,26,0.16)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 10;
    fn();
    ctx.restore();
  }

  function bentukStatus(ctx, b, x, y, r, warna) {
    ctx.fillStyle = warna;
    ctx.strokeStyle = warna;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (b === 'bulat') { ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
    else if (b === 'cincin') { ctx.arc(x, y, r - 1.2, 0, Math.PI * 2); ctx.stroke(); }
    else if (b === 'segitiga') { ctx.moveTo(x, y - r); ctx.lineTo(x + r, y + r * 0.85); ctx.lineTo(x - r, y + r * 0.85); ctx.closePath(); ctx.fill(); }
    else if (b === 'kotak') { ctx.rect(x - r * 0.85, y - r * 0.85, r * 1.7, r * 1.7); ctx.fill(); }
    else { ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath(); ctx.fill(); }
  }

  function chipStatus(ctx, st, x, y) {
    var s = STATUS[st] || STATUS.info;
    ctx.font = '700 17px ' + BODY;
    var w = ctx.measureText(s.t).width + 50;
    ctx.fillStyle = s.bg;
    kotak(ctx, x, y, w, 34, 17);
    ctx.fill();
    bentukStatus(ctx, s.bentuk, x + 20, y + 17, 6, s.fg);
    ctx.fillStyle = s.fg;
    ctx.textBaseline = 'middle';
    ctx.fillText(s.t, x + 36, y + 18);
    ctx.textBaseline = 'alphabetic';
  }

  function muatMark() {
    return new Promise(function (res) {
      var img = new Image();
      img.onload = function () { res(img); };
      img.onerror = function () { res(null); };
      img.src = 'assets/v4/mark-color.svg';
    });
  }

  function muatHuruf() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all([
      document.fonts.load('900 56px Gabarito'), document.fonts.load('800 24px Gabarito'),
      document.fonts.load('700 18px Figtree'), document.fonts.load('400 18px Figtree')
    ]).catch(function () {});
  }

  /** Gambar kartu ringkasan lalu unduh sebagai PNG. */
  function png(h) {
    if (!h) return;
    Promise.all([muatHuruf(), muatMark()]).then(function (r) { gambar(h, r[1]); });
  }

  function gambar(h, mark) {
    var kelompok = h.kelompok.concat(h.fitrah ? [h.fitrah] : []);
    var TB = 104;                                   // tinggi tiap baris
    var H = 550 + kelompok.length * TB + 8 + 120 + 60;   // kepala + total, baris, kaki

    var kanvas = document.createElement('canvas');
    kanvas.width = W * 2;                           // 2× supaya tajam di layar retina
    kanvas.height = H * 2;
    var ctx = kanvas.getContext('2d');
    ctx.scale(2, 2);

    ctx.fillStyle = C.cream;
    ctx.fillRect(0, 0, W, H);

    // Kepala: bloom mark + nama + tanggal
    if (mark) ctx.drawImage(mark, PAD, 54, 56, 56);
    ctx.fillStyle = C.ember;
    ctx.font = '900 34px ' + DISPLAY;
    ctx.fillText('Zakat', PAD + (mark ? 70 : 0), 90);
    ctx.fillStyle = C.light;
    ctx.font = '400 20px ' + BODY;
    ctx.textAlign = 'right';
    ctx.fillText(tanggalHariIni() + ' · dihitung di perangkat sendiri', W - PAD, 90);
    ctx.textAlign = 'left';

    ctx.fillStyle = C.ember;
    ctx.font = '900 64px ' + DISPLAY;
    ctx.fillText('Ringkasan zakat', PAD, 196);

    ctx.fillStyle = C.mid;
    ctx.font = '600 21px ' + BODY;
    ctx.fillText('Dasar: ' + (h.mode === 'indonesia' ? 'Qur’an & Sunnah + Hukum Indonesia (Fatwa MUI, BAZNAS)' : 'Qur’an & Sunnah'), PAD, 244);
    ctx.fillStyle = C.light;
    ctx.font = '400 20px ' + BODY;
    ctx.fillText('Harga emas ' + rp(h.harga.emas) + '/gram · nisab ' + rp(85 * h.harga.emas), PAD, 276);

    // Kotak total (charcoal, seperti .fl-card--dark)
    var yT = 316;
    timbul(ctx, function () {
      ctx.fillStyle = C.charcoal;
      kotak(ctx, PAD, yT, W - PAD * 2, 190, 28);
      ctx.fill();
    });
    ctx.fillStyle = 'rgba(255,248,240,0.65)';
    ctx.font = '800 17px ' + BODY;
    ctx.fillText('TOTAL ZAKAT MAL YANG WAJIB SEKARANG', PAD + 44, yT + 56);
    ctx.fillStyle = C.cream;
    ctx.font = '900 78px ' + DISPLAY;
    ctx.fillText(rp(h.totalRp), PAD + 44, yT + 136);
    if (h.totalRpNanti) {
      ctx.fillStyle = 'rgba(255,248,240,0.65)';
      ctx.font = '400 20px ' + BODY;
      ctx.fillText('+ ' + rp(h.totalRpNanti) + ' menunggu haul', PAD + 44, yT + 172);
    }

    // Baris per kelompok
    var y = yT + 190 + 44;
    kelompok.forEach(function (k) {
      timbul(ctx, function () {
        ctx.fillStyle = C.surface;
        kotak(ctx, PAD, y, W - PAD * 2, TB - 18, 20);
        ctx.fill();
      });
      ctx.fillStyle = C.ink;
      ctx.font = '800 25px ' + DISPLAY;
      ctx.fillText(k.label, PAD + 30, y + 38);
      chipStatus(ctx, k.status, PAD + 30, y + 50);

      var angka = k.zakat && k.zakat.natura ? k.zakat.natura : k.zakat && k.zakat.rp ? rp(k.zakat.rp) : '–';
      ctx.fillStyle = k.status === 'wajib' ? C.flameInk : C.mid;
      ctx.font = '900 28px ' + DISPLAY;
      ctx.textAlign = 'right';
      ctx.fillText(angka, W - PAD - 30, y + 60);
      ctx.textAlign = 'left';
      y += TB;
    });

    // Kaki
    y += 8;
    ctx.fillStyle = C.parchment;
    kotak(ctx, PAD, y, W - PAD * 2, 120, 20);
    ctx.fill();
    ctx.fillStyle = C.mid;
    ctx.font = '400 19px ' + BODY;
    var kaki = 'Zakat disalurkan hanya kepada 8 golongan (QS At-Taubah 60). Ini alat bantu hitung, bukan fatwa dan bukan ' +
      'pengganti amil atau ustadz. Dalil lengkap dan kode terbuka: github.com/arnantoakbar/zakat';
    bungkus(ctx, kaki, W - PAD * 2 - 60).forEach(function (b, i) {
      ctx.fillText(b, PAD + 30, y + 42 + i * 28);
    });

    kanvas.toBlob(function (blob) {
      if (!blob) return;
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'ringkasan-zakat.png';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    }, 'image/png');
  }

  /**
   * PDF = dialog cetak browser; tata letaknya diatur css/print.css.
   * Rincian (<details>) dibuka dulu supaya tidak ada yang tersembunyi di
   * kertas, lalu dikembalikan; judul sementara jadi nama berkas bawaan.
   */
  function pdf() {
    var tertutup = Array.prototype.filter.call(document.querySelectorAll('details'), function (d) { return !d.open; });
    var judulAsal = document.title;
    var html = document.documentElement, temaAsal = html.getAttribute('data-theme');
    tertutup.forEach(function (d) { d.open = true; });
    document.title = 'Ringkasan zakat';
    html.setAttribute('data-theme', 'light');        // kertas selalu terang
    function pulih() {
      tertutup.forEach(function (d) { d.open = false; });
      document.title = judulAsal;
      html.setAttribute('data-theme', temaAsal || 'auto');
      window.removeEventListener('afterprint', pulih);
    }
    window.addEventListener('afterprint', pulih);
    window.print();
  }

  root.ZakatExport = { png: png, pdf: pdf };
})(typeof window !== 'undefined' ? window : globalThis);
