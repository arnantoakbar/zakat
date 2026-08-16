/*
 * Angka baku zakat.
 *
 * SEMUA angka syariat dikumpulkan di satu berkas ini, bukan tersebar di
 * logika, supaya bisa diperiksa sekali baca oleh siapa pun — termasuk yang
 * tidak bisa membaca kode. Setiap angka membawa id dalil yang menunjuk ke
 * entri di js/dalil.js; keterkaitannya dijaga oleh test suite.
 *
 * Aturan zakat sudah baku dari nash dan tidak berubah sejak diturunkan.
 * Yang BUKAN nash dan bisa berubah hanyalah harga pasar (emas, perak, beras)
 * — karena itu harga tidak pernah ada di berkas ini; ia selalu input.
 */

(function (root) {
  'use strict';

  var C = {

    // ── Nisab & kadar harta simpanan ─────────────────────────────
    // 20 dinar emas = 85 gram; 200 dirham perak = 595 gram.
    // Kadarnya rub'ul 'usyr — seperempat dari sepersepuluh = 1/40 = 2,5%.
    NISAB_EMAS_GRAM: 85,          // dalil: hr-nisab-emas
    NISAB_PERAK_GRAM: 595,        // dalil: hr-nisab-emas, hr-5wasaq (5 uqiyah)
    KADAR_SIMPANAN: 1 / 40,       // 2,5% — dalil: hr-nisab-emas

    // ── Haul ─────────────────────────────────────────────────────
    // Satu tahun hijriah. 354 hari adalah pembulatan dari 354,367.
    HAUL_HARI: 354,               // dalil: hr-haul

    // ── Pertanian ────────────────────────────────────────────────
    // Nisab 5 wasaq = 300 sha'. Konversi baku yang dipakai Kemenag/BAZNAS:
    // 653 kg gabah, atau setara 520 kg beras.
    NISAB_TANI_KG: { gabah: 653, beras: 520 },  // dalil: hr-5wasaq
    KADAR_TANI: {
      hujan: 1 / 10,    // 10% — diairi hujan/sungai tanpa biaya. dalil: hr-usyr
      irigasi: 1 / 20   // 5%  — diairi dengan biaya/tenaga. dalil: hr-usyr
    },

    // ── Rikaz (harta temuan/karun) ───────────────────────────────
    KADAR_RIKAZ: 1 / 5,           // 20% — dalil: hr-rikaz

    // ── Zakat fitrah ─────────────────────────────────────────────
    // 1 sha' makanan pokok per jiwa. Konversi baku BAZNAS: 2,5 kg
    // (atau 3,5 liter) beras.
    FITRAH_KG_PER_JIWA: 2.5,      // dalil: hr-fitrah

    // ── Ternak: kambing/domba ────────────────────────────────────
    // Dari surat zakat Abu Bakar (dalil: hr-surat-abubakar):
    // 40–120 → 1 ekor · 121–200 → 2 · 201–300 → 3 ·
    // lebih dari 300 → tiap 100 ekor 1 kambing.
    KAMBING_MULAI: 40,

    // ── Ternak: sapi/kerbau ──────────────────────────────────────
    // Dari hadits Mu'adz di Yaman (dalil: hr-sapi):
    // tiap 30 → 1 tabi'/tabi'ah (umur 1 th) · tiap 40 → 1 musinnah (2 th).
    SAPI_MULAI: 30,
    SAPI_TABI: 30,
    SAPI_MUSINNAH: 40,

    // ── Ternak: unta ─────────────────────────────────────────────
    // Tabel surat Abu Bakar (dalil: hr-surat-abubakar). Batas bawah tiap
    // baris; berlaku sampai batas bawah baris berikutnya dikurangi satu.
    UNTA_MULAI: 5,
    UNTA_TABEL: [
      { min: 5,   zakat: '1 ekor kambing' },
      { min: 10,  zakat: '2 ekor kambing' },
      { min: 15,  zakat: '3 ekor kambing' },
      { min: 20,  zakat: '4 ekor kambing' },
      { min: 25,  zakat: '1 bintu makhadh (unta betina umur 1 tahun)' },
      { min: 36,  zakat: '1 bintu labun (unta betina umur 2 tahun)' },
      { min: 46,  zakat: '1 hiqqah (unta betina umur 3 tahun)' },
      { min: 61,  zakat: '1 jadza’ah (unta betina umur 4 tahun)' },
      { min: 76,  zakat: '2 bintu labun' },
      { min: 91,  zakat: '2 hiqqah' }
    ],
    // Di atas 120: tiap 40 ekor → 1 bintu labun, tiap 50 ekor → 1 hiqqah.
    UNTA_BLOK_BINTU_LABUN: 40,
    UNTA_BLOK_HIQQAH: 50,

    // ── Delapan golongan penerima (asnaf) ────────────────────────
    // QS At-Taubah 60 — satu-satunya dasar distribusi zakat. Urutan
    // mengikuti urutan penyebutan dalam ayat. `segmen` menunjuk ruas ayat
    // yang menyebut golongan itu di js/dalil.js.
    ASNAF: [
      { id: 'fakir',      label: 'Fakir',          segmen: 'fakirMiskin',
        arti: 'Nyaris tidak punya apa-apa untuk kebutuhan pokoknya.' },
      { id: 'miskin',     label: 'Miskin',         segmen: 'fakirMiskin',
        arti: 'Punya penghasilan, tapi tidak cukup menutup kebutuhan pokok.' },
      { id: 'amil',       label: 'Amil',           segmen: 'amil',
        arti: 'Petugas yang mengurus pengumpulan dan penyaluran zakat.' },
      { id: 'muallaf',    label: 'Muallaf',        segmen: 'muallaf',
        arti: 'Orang yang baru masuk Islam atau yang dilunakkan hatinya.' },
      { id: 'riqab',      label: 'Riqab',          segmen: 'riqab',
        arti: 'Memerdekakan orang dari perbudakan. Kini nyaris tidak ada; sebagian ulama memasukkan korban perdagangan manusia.' },
      { id: 'gharimin',   label: 'Gharimin',       segmen: 'gharimin',
        arti: 'Orang yang terlilit hutang untuk kebutuhan halal dan tidak sanggup melunasinya.' },
      { id: 'sabilillah', label: 'Fi sabilillah',  segmen: 'sabilillah',
        arti: 'Perjuangan di jalan Allah — jumhur klasik: jihad; diperluas sebagian ulama ke dakwah dan pendidikan.' },
      { id: 'ibnusabil',  label: 'Ibnu sabil',     segmen: 'ibnusabil',
        arti: 'Musafir yang kehabisan bekal di perjalanan, meskipun di kampungnya mampu.' }
    ]
  };

  root.ZakatConst = C;
})(typeof window !== 'undefined' ? window : globalThis);
