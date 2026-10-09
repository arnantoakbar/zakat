/*
 * Zakat pertanian.
 *
 * Berbeda dari simpanan: TIDAK menunggu haul — ditunaikan pada hari
 * panennya (QS Al-An'am 141), setiap kali panen. Nisabnya 5 wasaq, yang
 * konversi bakunya di Indonesia (Kemenag/BAZNAS) 653 kg gabah atau setara
 * 520 kg beras. Kadarnya dari hadits: 10% kalau diairi hujan/sungai tanpa
 * biaya, 5% kalau pengairannya berbiaya.
 *
 * Zakatnya ditunaikan dari hasil panen itu sendiri (natura). Rupiah hanya
 * ditampilkan sebagai bantuan bila bentuknya beras dan harga beras diisi —
 * tidak ada konversi gabah→rupiah yang dikarang-karang.
 */

(function (root) {
  'use strict';

  var C = root.ZakatConst;

  /**
   * @param {{kg:number, bentuk:'gabah'|'beras', pengairan:'hujan'|'irigasi'}|null} t
   * @param {{beras:number}} harga
   */
  function hitung(t, harga) {
    if (!t || !(t.kg > 0)) return null;

    var bentuk = t.bentuk === 'beras' ? 'beras' : 'gabah';
    var pengairan = t.pengairan === 'irigasi' ? 'irigasi' : 'hujan';
    var nisabKg = C.NISAB_TANI_KG[bentuk];
    var kadar = C.KADAR_TANI[pengairan];
    var persenTeks = pengairan === 'irigasi' ? '5%' : '10%';

    var catatan = [
      { tipe: 'info', teks: 'Dihitung dari hasil panen kering yang siap disimpan. Kalau ' +
        'pengairannya campuran (sebagian musim hujan, sebagian irigasi berbayar), sebagian ' +
        'ulama menetapkan 7,5% — pilih yang dominan, atau tanyakan ke amil setempat.' }
    ];

    if (t.kg < nisabKg) {
      return {
        id: 'tani',
        label: 'Hasil pertanian',
        ikon: 'i-wheat',
        status: 'belumNisab',
        alasan: 'Panenmu ' + t.kg + ' kg ' + bentuk + ', masih di bawah nisab ' + nisabKg +
          ' kg (5 wasaq). Belum wajib zakat — bersedekah dari hasil panen tetap dianjurkan.',
        dasar: t.kg,
        nisab: { teks: nisabKg + ' kg ' + bentuk + ' (5 wasaq)' },
        persenNisab: Math.min(999, Math.round(t.kg / nisabKg * 100)),
        zakat: { rp: null, natura: null },
        kapan: { tipe: 'panen', teks: 'saat panenmu mencapai nisab' },
        dalil: ['qs6-141', 'hr-5wasaq', 'hr-usyr', 'qs2-267'],
        catatan: catatan,
        rincian: []
      };
    }

    var zakatKg = Math.round(t.kg * kadar * 10) / 10;
    var rp = bentuk === 'beras' && harga.beras > 0 ? Math.round(zakatKg * harga.beras) : null;

    return {
      id: 'tani',
      label: 'Hasil pertanian',
      ikon: 'i-wheat',
      pengairan: pengairan,
      status: 'wajib',
      alasan: 'Panenmu ' + t.kg + ' kg ' + bentuk + ' sudah melewati nisab ' + nisabKg +
        ' kg. Karena pengairannya ' +
        (pengairan === 'irigasi' ? 'berbiaya, kadarnya ' : 'dari hujan/aliran alami, kadarnya ') +
        persenTeks + '.',
      dasar: t.kg,
      nisab: { teks: nisabKg + ' kg ' + bentuk + ' (5 wasaq)' },
      persenNisab: Math.min(999, Math.round(t.kg / nisabKg * 100)),
      zakat: { rp: rp, natura: zakatKg + ' kg ' + bentuk, kg: zakatKg },
      kapan: { tipe: 'panen', teks: 'pada hari panen — setiap kali panen, tanpa menunggu setahun' },
      dalil: ['qs6-141', 'hr-5wasaq', 'hr-usyr', 'qs2-267'],
      catatan: catatan,
      rincian: [{ label: 'Hasil panen', nilai: t.kg + ' kg ' + bentuk }]
    };
  }

  root.ZakatTani = { hitung: hitung };
})(typeof window !== 'undefined' ? window : globalThis);
