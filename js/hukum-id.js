/*
 * Catatan hukum Indonesia tentang zakat.
 *
 * Rujukan utama situs ini tetap Al-Qur'an dan sunnah. Aturan negara dan
 * fatwa dicantumkan hanya karena ia memang mengatur muslim Indonesia dalam
 * praktik: lewat siapa zakat disalurkan, bukti setorannya, kaitannya dengan
 * pajak, dan zakat penghasilan yang lahir dari fatwa.
 *
 * Teks pasal di bawah diverifikasi lewat basis data peraturan (pasal.id,
 * Agustus 2026), bukan ditulis dari ingatan. Setiap entri membawa tautan
 * yang bisa dibuka pembaca untuk memeriksa sendiri. Bagian ini hanya
 * ditampilkan penuh saat mode "+ Hukum Indonesia" menyala.
 */

(function (root) {
  'use strict';

  var HUKUM = {

    'uu23-def': {
      rujukan: 'UU 23/2011 Pasal 1 (istilah)',
      tautan: { label: 'Baca di pasal.id',
        url: 'https://pasal.id/peraturan/uu/uu-no-23-tahun-2011#pasal-1' },
      teks: '2. Zakat adalah harta yang wajib dikeluarkan oleh seorang muslim atau badan ' +
        'usaha untuk diberikan kepada yang berhak menerimanya sesuai dengan syariat Islam. ' +
        '5. Muzaki adalah seorang muslim atau badan usaha yang berkewajiban menunaikan ' +
        'zakat. 6. Mustahik adalah orang yang berhak menerima zakat. 7. BAZNAS adalah ' +
        'lembaga yang melakukan pengelolaan zakat secara nasional. 8. LAZ adalah lembaga ' +
        'yang dibentuk masyarakat yang memiliki tugas membantu pengumpulan, ' +
        'pendistribusian, dan pendayagunaan zakat.',
      ringkas: 'Hukum negara memakai istilah yang sama dengan fiqh — dan menegaskan ' +
        'ukurannya tetap "sesuai dengan syariat Islam", bukan menggantinya.'
    },

    'uu23-21': {
      rujukan: 'UU 23/2011 Pasal 21',
      tautan: { label: 'Baca di pasal.id',
        url: 'https://pasal.id/peraturan/uu/uu-no-23-tahun-2011#pasal-21' },
      teks: '(1) Dalam rangka pengumpulan zakat, muzaki melakukan penghitungan sendiri ' +
        'atas kewajiban zakatnya. (2) Dalam hal tidak dapat menghitung sendiri kewajiban ' +
        'zakatnya, muzaki dapat meminta bantuan BAZNAS.',
      ringkas: 'Undang-undang justru menyuruh muzaki MENGHITUNG SENDIRI zakatnya — ' +
        'persis yang dibantu kalkulator ini. Kalau ragu, BAZNAS wajib membantu.'
    },

    'uu23-22': {
      rujukan: 'UU 23/2011 Pasal 22',
      tautan: { label: 'Baca di pasal.id',
        url: 'https://pasal.id/peraturan/uu/uu-no-23-tahun-2011#pasal-22' },
      teks: 'Zakat yang dibayarkan oleh muzaki kepada BAZNAS atau LAZ dikurangkan dari ' +
        'penghasilan kena pajak.',
      ringkas: 'Zakat lewat BAZNAS/LAZ resmi mengurangi penghasilan kena pajak di ' +
        'SPT-mu. Negara tidak memajaki harta yang sudah dizakatkan lewat jalur resmi.'
    },

    'uu23-23': {
      rujukan: 'UU 23/2011 Pasal 23',
      tautan: { label: 'Baca di pasal.id',
        url: 'https://pasal.id/peraturan/uu/uu-no-23-tahun-2011#pasal-23' },
      teks: '(1) BAZNAS atau LAZ wajib memberikan bukti setoran zakat kepada setiap ' +
        'muzaki. (2) Bukti setoran zakat sebagaimana dimaksud pada ayat (1) digunakan ' +
        'sebagai pengurang penghasilan kena pajak.',
      ringkas: 'Selalu minta Bukti Setor Zakat (BSZ). Itu hakmu, dan itu dokumen yang ' +
        'dipakai saat lapor SPT.'
    },

    'pp14-2014': {
      rujukan: 'PP 14/2014',
      tautan: { label: 'Baca di pasal.id',
        url: 'https://pasal.id/peraturan/pp/pp-14-2014' },
      teks: 'Peraturan Pemerintah tentang Pelaksanaan UU 23/2011 tentang Pengelolaan ' +
        'Zakat — mengatur organisasi BAZNAS, perizinan LAZ, dan pelaporannya.',
      ringkas: 'Aturan teknis lembaga amil. Yang perlu kamu tahu darinya satu saja: ' +
        'LAZ yang sah adalah yang BERIZIN — cek daftarnya sebelum menitipkan zakat.'
    },

    'mui-3-2003': {
      rujukan: 'Fatwa MUI No. 3 Tahun 2003 — Zakat Penghasilan',
      tautan: { label: 'Penjelasan resmi di baznas.go.id',
        url: 'https://baznas.go.id/zakatpenghasilan' },
      teks: 'Ketentuan hukumnya: (1) Semua bentuk penghasilan halal wajib dikeluarkan ' +
        'zakatnya dengan syarat telah mencapai nisab dalam satu tahun, yakni senilai ' +
        'emas 85 gram. (2) Zakat penghasilan dapat dikeluarkan pada saat menerima jika ' +
        'sudah cukup nisab; jika tidak mencapai nisab, semua penghasilan dikumpulkan ' +
        'selama satu tahun lalu dizakati jika jumlahnya cukup nisab. (3) Kadarnya 2,5%.',
      ringkas: 'Ini dasar zakat penghasilan/profesi di Indonesia — ijtihad ulama ' +
        'kontemporer lewat qiyas ke zakat emas, bukan nash langsung. Karena itu di ' +
        'situs ini ia hanya dihitung saat mode "+ Hukum Indonesia" menyala.'
    },

    'uu-cagar': {
      rujukan: 'UU 11/2010 tentang Cagar Budaya',
      tautan: { label: 'Baca di pasal.id',
        url: 'https://pasal.id/peraturan/uu/uu-11-2010' },
      teks: 'Benda yang diduga cagar budaya yang ditemukan wajib dilaporkan dan ' +
        'dikuasai oleh negara.',
      ringkas: 'Sebelum menganggap temuan sebagai rikaz milik pribadi, pastikan ia ' +
        'bukan benda purbakala/cagar budaya — kalau iya, jalurnya lapor ke negara.'
    }
  };

  function ambil(id) { return HUKUM[id] || null; }
  function kumpulkan(ids) { return (ids || []).map(ambil).filter(Boolean); }

  root.HukumID = { DATA: HUKUM, ambil: ambil, kumpulkan: kumpulkan };
})(typeof window !== 'undefined' ? window : globalThis);
