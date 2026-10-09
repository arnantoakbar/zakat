/*
 * DALIL — sumber hukum untuk setiap aturan yang dipakai kalkulator ini.
 *
 * Dataset statis. Aturan zakat sudah baku: tidak berubah sejak diturunkan,
 * tidak perlu ditanyakan ulang ke mesin pencari atau AI setiap kali orang
 * menghitung. Jadi sumbernya dianalisa sekali, disimpan di sini, lalu
 * dipanggil berulang-ulang lewat lookup biasa.
 *
 * Setiap entri menyimpan `tautan` ke sumber daring yang bisa dibuka pembaca
 * untuk memeriksa sendiri teks Arab, terjemahan, sanad, dan derajatnya.
 * Nomor hadits dan derajat di bawah sudah dicocokkan satu per satu dengan
 * hadits.id, dan ayat dengan Quran.com (Agustus 2026).
 *
 * ─────────────────────────────────────────────────────────────────────
 * CATATAN UNTUK PEMILIK SITUS
 * Ini menyangkut hukum agama. Pencocokan dengan sumber daring memastikan
 * nomor dan teksnya benar, tapi TIDAK menggantikan pemeriksaan seorang
 * ustadz yang kompeten di bidang fiqh zakat — terutama penilaian derajat
 * hadits, yang antar ulama pun bisa berbeda. Kode bisa diuji dengan test
 * suite; keabsahan kutipan tidak bisa.
 *
 * Nomor hadits BERBEDA antar penerbit. Nomor di sini adalah nomor hadits.id
 * — selalu sertakan tautannya, jangan cukup nomornya.
 * ─────────────────────────────────────────────────────────────────────
 *
 * Terjemahan sengaja ditulis dalam bahasa Indonesia sehari-hari agar mudah
 * dipahami orang awam, bukan salinan terjemahan resmi. Ayat TIDAK PERNAH
 * dipenggal: ayat yang memuat beberapa ketetapan disimpan sebagai deretan
 * RUAS (`segmen`) — seluruh ruas selalu ditampilkan, ruas yang sedang
 * dibahas disorot, sisanya dipudarkan. Ruas dengan id null tetap tampil
 * tapi tidak pernah menjadi sorotan.
 */

(function (root) {
  'use strict';

  var DALIL = {

    // ═══ AL-QUR'AN ═══════════════════════════════════════════════

    'qs2-43': {
      jenis: 'quran',
      rujukan: 'QS Al-Baqarah ayat 43',
      tautan: { label: 'Baca di Quran.com', url: 'https://quran.com/2/43' },
      arab: 'وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ وَارْكَعُوا مَعَ الرَّاكِعِينَ',
      terjemah: 'Dirikanlah shalat, tunaikanlah zakat, dan rukuklah bersama ' +
        'orang-orang yang rukuk.',
      ringkas: 'Perintah zakat disandingkan langsung dengan perintah shalat — dan ' +
        'pasangan ini berulang puluhan kali di Al-Qur’an. Zakat bukan sumbangan ' +
        'sukarela; ia rukun Islam.'
    },

    'qs9-103': {
      jenis: 'quran',
      rujukan: 'QS At-Taubah ayat 103',
      tautan: { label: 'Baca di Quran.com', url: 'https://quran.com/9/103' },
      segmen: [
        { id: 'ambil',
          arab: 'خُذْ مِنْ أَمْوَالِهِمْ صَدَقَةً تُطَهِّرُهُمْ وَتُزَكِّيهِمْ بِهَا',
          arti: 'Ambillah zakat dari harta mereka — dengannya engkau membersihkan ' +
            'dan menyucikan mereka —' },
        { id: null,
          arab: 'وَصَلِّ عَلَيْهِمْ ۖ إِنَّ صَلَاتَكَ سَكَنٌ لَهُمْ ۗ وَاللَّهُ سَمِيعٌ عَلِيمٌ',
          arti: 'dan doakanlah mereka. Sungguh doamu menjadi ketenteraman bagi ' +
            'jiwa mereka. Allah Maha Mendengar, Maha Mengetahui.' }
      ],
      ringkas: 'Inilah gunanya zakat bagi pembayarnya: membersihkan harta dan jiwa. ' +
        'Sisa hartamu yang 97,5% menjadi bersih justru karena 2,5%-nya ditunaikan.'
    },

    'qs9-60': {
      jenis: 'quran',
      rujukan: 'QS At-Taubah ayat 60',
      tautan: { label: 'Baca di Quran.com', url: 'https://quran.com/9/60' },
      segmen: [
        { id: 'fakirMiskin',
          arab: 'إِنَّمَا الصَّدَقَاتُ لِلْفُقَرَاءِ وَالْمَسَاكِينِ',
          arti: 'Zakat itu hanyalah untuk orang fakir dan orang miskin,' },
        { id: 'amil',
          arab: 'وَالْعَامِلِينَ عَلَيْهَا',
          arti: 'para amil yang mengurusnya,' },
        { id: 'muallaf',
          arab: 'وَالْمُؤَلَّفَةِ قُلُوبُهُمْ',
          arti: 'orang yang dilunakkan hatinya (muallaf),' },
        { id: 'riqab',
          arab: 'وَفِي الرِّقَابِ',
          arti: 'untuk memerdekakan hamba sahaya,' },
        { id: 'gharimin',
          arab: 'وَالْغَارِمِينَ',
          arti: 'orang yang terlilit hutang,' },
        { id: 'sabilillah',
          arab: 'وَفِي سَبِيلِ اللَّهِ',
          arti: 'perjuangan di jalan Allah,' },
        { id: 'ibnusabil',
          arab: 'وَابْنِ السَّبِيلِ ۖ',
          arti: 'dan musafir yang kehabisan bekal.' },
        { id: null,
          arab: 'فَرِيضَةً مِنَ اللَّهِ ۗ وَاللَّهُ عَلِيمٌ حَكِيمٌ',
          arti: 'Itu ketetapan yang diwajibkan Allah. Allah Maha Mengetahui, Mahabijaksana.' }
      ],
      ringkas: 'Satu-satunya ayat yang menetapkan ke mana zakat boleh disalurkan — ' +
        'delapan golongan, tidak lebih. Kata "innama" (hanyalah) menutup pintu ' +
        'penyaluran ke luar daftar ini. Pembayar tidak wajib membagi rata ke ' +
        'delapan-delapannya; menyerahkan ke satu-dua golongan yang ada sudah sah.'
    },

    'qs2-267': {
      jenis: 'quran',
      rujukan: 'QS Al-Baqarah ayat 267',
      tautan: { label: 'Baca di Quran.com', url: 'https://quran.com/2/267' },
      segmen: [
        { id: 'usaha',
          arab: 'يَا أَيُّهَا الَّذِينَ آمَنُوا أَنْفِقُوا مِنْ طَيِّبَاتِ مَا كَسَبْتُمْ',
          arti: 'Wahai orang-orang yang beriman, nafkahkanlah sebagian dari hasil ' +
            'usahamu yang baik-baik' },
        { id: 'bumi',
          arab: 'وَمِمَّا أَخْرَجْنَا لَكُمْ مِنَ الْأَرْضِ ۖ',
          arti: 'dan sebagian dari apa yang Kami keluarkan dari bumi untukmu.' },
        { id: null,
          arab: 'وَلَا تَيَمَّمُوا الْخَبِيثَ مِنْهُ تُنْفِقُونَ وَلَسْتُمْ بِآخِذِيهِ إِلَّا أَنْ تُغْمِضُوا فِيهِ ۚ وَاعْلَمُوا أَنَّ اللَّهَ غَنِيٌّ حَمِيدٌ',
          arti: 'Jangan sengaja memilih yang buruk untuk kamu nafkahkan — padahal ' +
            'kamu sendiri tidak mau menerimanya kecuali dengan mata terpicing. ' +
            'Ketahuilah, Allah Mahakaya lagi Maha Terpuji.' }
      ],
      ringkas: 'Dasar zakat atas hasil usaha — termasuk harta perdagangan — dan ' +
        'hasil bumi. Dari keumuman "ma kasabtum" inilah ulama kontemporer ' +
        'meng-qiyas-kan zakat penghasilan.'
    },

    'qs6-141': {
      jenis: 'quran',
      rujukan: 'QS Al-An’am ayat 141',
      tautan: { label: 'Baca di Quran.com', url: 'https://quran.com/6/141' },
      segmen: [
        { id: null,
          arab: 'وَهُوَ الَّذِي أَنْشَأَ جَنَّاتٍ مَعْرُوشَاتٍ وَغَيْرَ مَعْرُوشَاتٍ وَالنَّخْلَ وَالزَّرْعَ مُخْتَلِفًا أُكُلُهُ وَالزَّيْتُونَ وَالرُّمَّانَ مُتَشَابِهًا وَغَيْرَ مُتَشَابِهٍ ۚ',
          arti: 'Dialah yang menumbuhkan kebun-kebun yang berjunjung dan yang tidak ' +
            'berjunjung, pohon kurma, tanaman yang beraneka rasa buahnya, zaitun, ' +
            'dan delima yang serupa dan yang tidak serupa.' },
        { id: 'panen',
          arab: 'كُلُوا مِنْ ثَمَرِهِ إِذَا أَثْمَرَ وَآتُوا حَقَّهُ يَوْمَ حَصَادِهِ ۖ',
          arti: 'Makanlah buahnya apabila ia berbuah, dan tunaikan haknya pada hari ' +
            'panennya;' },
        { id: null,
          arab: 'وَلَا تُسْرِفُوا ۚ إِنَّهُ لَا يُحِبُّ الْمُسْرِفِينَ',
          arti: 'dan janganlah berlebih-lebihan. Sungguh Allah tidak menyukai orang ' +
            'yang berlebih-lebihan.' }
      ],
      ringkas: 'Zakat pertanian tidak menunggu setahun — waktunya hari panen. ' +
        'Setiap panen dihitung sendiri-sendiri.'
    },

    'qs9-34': {
      jenis: 'quran',
      rujukan: 'QS At-Taubah ayat 34–35',
      tautan: { label: 'Baca di Quran.com', url: 'https://quran.com/9/34-35' },
      segmen: [
        { id: null,
          arab: 'يَا أَيُّهَا الَّذِينَ آمَنُوا إِنَّ كَثِيرًا مِنَ الْأَحْبَارِ وَالرُّهْبَانِ لَيَأْكُلُونَ أَمْوَالَ النَّاسِ بِالْبَاطِلِ وَيَصُدُّونَ عَنْ سَبِيلِ اللَّهِ ۗ',
          arti: 'Wahai orang-orang yang beriman, sesungguhnya banyak dari para rahib ' +
            'dan pendeta yang memakan harta manusia dengan cara batil dan menghalangi ' +
            'dari jalan Allah.' },
        { id: 'kanz',
          arab: 'وَالَّذِينَ يَكْنِزُونَ الذَّهَبَ وَالْفِضَّةَ وَلَا يُنْفِقُونَهَا فِي سَبِيلِ اللَّهِ فَبَشِّرْهُمْ بِعَذَابٍ أَلِيمٍ',
          arti: 'Dan orang-orang yang menimbun emas dan perak dan tidak ' +
            'menafkahkannya di jalan Allah — kabarkan kepada mereka azab yang pedih.' },
        { id: 'azab',
          arab: 'يَوْمَ يُحْمَىٰ عَلَيْهَا فِي نَارِ جَهَنَّمَ فَتُكْوَىٰ بِهَا جِبَاهُهُمْ وَجُنُوبُهُمْ وَظُهُورُهُمْ ۖ هَٰذَا مَا كَنَزْتُمْ لِأَنْفُسِكُمْ فَذُوقُوا مَا كُنْتُمْ تَكْنِزُونَ',
          arti: 'Pada hari ketika semua itu dipanaskan dalam neraka Jahanam lalu ' +
            'disetrikakan ke dahi, lambung, dan punggung mereka: "Inilah harta yang ' +
            'dulu kamu timbun untuk dirimu sendiri. Rasakanlah apa yang kamu timbun itu."' }
      ],
      ringkas: 'Menurut para sahabat dan tafsir, "harta yang ditimbun" (kanz) adalah ' +
        'harta yang tidak ditunaikan zakatnya. Harta yang zakatnya ditunaikan bukan ' +
        'timbunan, berapa pun besarnya.'
    },

    'qs51-19': {
      jenis: 'quran',
      rujukan: 'QS Adz-Dzariyat ayat 19',
      tautan: { label: 'Baca di Quran.com', url: 'https://quran.com/51/19' },
      arab: 'وَفِي أَمْوَالِهِمْ حَقٌّ لِلسَّائِلِ وَالْمَحْرُومِ',
      terjemah: 'Dan pada harta mereka ada hak untuk orang yang meminta dan orang ' +
        'yang tidak mendapat bagian.',
      ringkas: 'Bagian untuk fakir-miskin di hartamu disebut "hak" — bukan hadiah ' +
        'dan bukan kemurahan hati. Menahannya berarti menahan hak orang lain.'
    },

    // ═══ HADITS ══════════════════════════════════════════════════

    'hr-rukun': {
      jenis: 'hadits',
      rujukan: 'HR Bukhari no. 8',
      perawi: 'Dari Ibnu Umar radhiyallahu anhuma',
      derajat: 'Sahih',
      tautan: { label: 'Baca di hadits.id — Bukhari 8',
        url: 'https://www.hadits.id/hadits/bukhari/8' },
      arab: 'بُنِيَ الْإِسْلَامُ عَلَى خَمْسٍ: شَهَادَةِ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللَّهِ، وَإِقَامِ الصَّلَاةِ، وَإِيتَاءِ الزَّكَاةِ، وَالْحَجِّ، وَصَوْمِ رَمَضَانَ',
      terjemah: 'Islam dibangun di atas lima perkara: bersaksi bahwa tidak ada tuhan ' +
        'yang berhak disembah selain Allah dan Muhammad utusan Allah, mendirikan ' +
        'shalat, menunaikan zakat, berhaji, dan berpuasa Ramadan.',
      ringkas: 'Zakat adalah rukun Islam ketiga — satu paket dengan syahadat dan shalat.'
    },

    'hr-muadz': {
      jenis: 'hadits',
      rujukan: 'HR Bukhari no. 1395',
      perawi: 'Dari Ibnu Abbas radhiyallahu anhuma',
      derajat: 'Sahih',
      tautan: { label: 'Baca di hadits.id — Bukhari 1395',
        url: 'https://www.hadits.id/hadits/bukhari/1395' },
      segmen: [
        { id: null,
          arab: 'إِنَّكَ تَأْتِي قَوْمًا مِنْ أَهْلِ الْكِتَابِ، فَادْعُهُمْ إِلَى شَهَادَةِ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَأَنِّي رَسُولُ اللَّهِ، فَإِنْ هُمْ أَطَاعُوا لِذَلِكَ فَأَعْلِمْهُمْ أَنَّ اللَّهَ افْتَرَضَ عَلَيْهِمْ خَمْسَ صَلَوَاتٍ فِي كُلِّ يَوْمٍ وَلَيْلَةٍ،',
          arti: '(Pesan Nabi ﷺ kepada Mu’adz yang diutus ke Yaman:) "Engkau akan ' +
            'mendatangi kaum ahli kitab. Ajaklah mereka bersaksi bahwa tidak ada tuhan ' +
            'selain Allah dan aku utusan Allah. Kalau mereka menaatinya, beri tahu bahwa ' +
            'Allah mewajibkan atas mereka shalat lima waktu sehari semalam.' },
        { id: 'zakat',
          arab: 'فَإِنْ هُمْ أَطَاعُوا لِذَلِكَ فَأَعْلِمْهُمْ أَنَّ اللَّهَ افْتَرَضَ عَلَيْهِمْ صَدَقَةً فِي أَمْوَالِهِمْ تُؤْخَذُ مِنْ أَغْنِيَائِهِمْ وَتُرَدُّ عَلَى فُقَرَائِهِمْ',
          arti: 'Kalau mereka menaatinya juga, beri tahu bahwa Allah mewajibkan atas ' +
            'mereka zakat pada harta mereka — diambil dari orang kaya mereka dan ' +
            'dikembalikan kepada orang fakir mereka."' }
      ],
      ringkas: 'Prinsip dasar aliran zakat dalam satu kalimat: dari yang mampu, ' +
        'kembali ke yang kekurangan di sekitarnya. Kata "dikembalikan" menunjukkan ' +
        'itu memang hak mereka.'
    },

    'hr-nisab-emas': {
      jenis: 'hadits',
      rujukan: 'HR Abu Dawud no. 1573',
      perawi: 'Dari Ali bin Abi Thalib radhiyallahu anhu',
      derajat: 'Sahih menurut Al-Albani',
      tautan: { label: 'Baca di hadits.id — Abu Dawud 1573',
        url: 'https://www.hadits.id/hadits/abudawud/1573' },
      segmen: [
        { id: 'perak',
          arab: 'فَإِذَا كَانَتْ لَكَ مِائَتَا دِرْهَمٍ وَحَالَ عَلَيْهَا الْحَوْلُ فَفِيهَا خَمْسَةُ دَرَاهِمَ،',
          arti: '"Bila engkau punya 200 dirham (perak) dan sudah berlalu satu tahun, ' +
            'zakatnya 5 dirham.' },
        { id: 'emas',
          arab: 'وَلَيْسَ عَلَيْكَ شَيْءٌ - يَعْنِي فِي الذَّهَبِ - حَتَّى يَكُونَ لَكَ عِشْرُونَ دِينَارًا، فَإِذَا كَانَ لَكَ عِشْرُونَ دِينَارًا وَحَالَ عَلَيْهَا الْحَوْلُ فَفِيهَا نِصْفُ دِينَارٍ،',
          arti: 'Untuk emas, tidak ada kewajiban apa pun atasmu sampai engkau punya ' +
            '20 dinar; bila sudah 20 dinar dan berlalu satu tahun, zakatnya setengah dinar.' },
        { id: null,
          arab: 'فَمَا زَادَ فَبِحِسَابِ ذَلِكَ،',
          arti: 'Selebihnya dihitung menurut perbandingan itu.' },
        { id: 'haul',
          arab: 'وَلَيْسَ فِي مَالٍ زَكَاةٌ حَتَّى يَحُولَ عَلَيْهِ الْحَوْلُ',
          arti: 'Dan tidak ada zakat pada harta sampai berlalu satu tahun atasnya."' }
      ],
      ringkas: 'Semua angka kunci zakat simpanan ada di sini: nisab perak 200 dirham ' +
        '(= 595 gram), nisab emas 20 dinar (= 85 gram), kadar 5/200 = 1/40 = 2,5%, ' +
        'dan syarat haul satu tahun. Uang zaman ini di-qiyas-kan ke nisab emas oleh ' +
        'BAZNAS/Kemenag.'
    },

    'hr-haul': {
      jenis: 'hadits',
      rujukan: 'HR Ibnu Majah no. 1792',
      perawi: 'Dari Aisyah radhiyallahu anha',
      derajat: 'Hasan menurut Darussalam',
      tautan: { label: 'Baca di hadits.id — Ibnu Majah 1792',
        url: 'https://www.hadits.id/hadits/ibnmajah/1792' },
      arab: 'لَا زَكَاةَ فِي مَالٍ حَتَّى يَحُولَ عَلَيْهِ الْحَوْلُ',
      terjemah: 'Tidak ada zakat pada harta sampai berlalu satu tahun atasnya.',
      ringkas: 'Syarat haul: simpanan baru dizakati setelah bertahan satu tahun ' +
        'hijriah (±354 hari) di atas nisab. Pertanian, rikaz, dan fitrah tidak ' +
        'memakai syarat ini.'
    },

    'hr-5wasaq': {
      jenis: 'hadits',
      rujukan: 'HR Bukhari no. 1405',
      perawi: 'Dari Abu Sa’id Al-Khudri radhiyallahu anhu',
      derajat: 'Sahih',
      tautan: { label: 'Baca di hadits.id — Bukhari 1405',
        url: 'https://www.hadits.id/hadits/bukhari/1405' },
      segmen: [
        { id: 'perak',
          arab: 'لَيْسَ فِيمَا دُونَ خَمْسِ أَوَاقٍ صَدَقَةٌ،',
          arti: 'Tidak ada zakat pada perak di bawah lima uqiyah (= 200 dirham = 595 gram),' },
        { id: 'unta',
          arab: 'وَلَيْسَ فِيمَا دُونَ خَمْسِ ذَوْدٍ صَدَقَةٌ،',
          arti: 'tidak ada zakat pada unta di bawah lima ekor,' },
        { id: 'tani',
          arab: 'وَلَيْسَ فِيمَا دُونَ خَمْسِ أَوْسُقٍ صَدَقَةٌ',
          arti: 'dan tidak ada zakat pada hasil panen di bawah lima wasaq ' +
            '(= 653 kg gabah).' }
      ],
      ringkas: 'Tiga batas minimal (nisab) dalam satu hadits: perak, unta, dan hasil ' +
        'panen. Di bawah batas ini tidak ada kewajiban — zakat hanya mengambil dari ' +
        'yang mampu.'
    },

    'hr-surat-abubakar': {
      jenis: 'hadits',
      rujukan: 'HR Bukhari no. 1454',
      perawi: 'Dari Anas bin Malik radhiyallahu anhu — surat resmi Abu Bakar tentang tarif zakat',
      derajat: 'Sahih',
      tautan: { label: 'Baca di hadits.id — Bukhari 1454',
        url: 'https://www.hadits.id/hadits/bukhari/1454' },
      segmen: [
        { id: null,
          arab: 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ، هَذِهِ فَرِيضَةُ الصَّدَقَةِ الَّتِي فَرَضَ رَسُولُ اللَّهِ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ عَلَى الْمُسْلِمِينَ، وَالَّتِي أَمَرَ اللَّهُ بِهَا رَسُولَهُ، فَمَنْ سُئِلَهَا مِنَ الْمُسْلِمِينَ عَلَى وَجْهِهَا فَلْيُعْطِهَا، وَمَنْ سُئِلَ فَوْقَهَا فَلَا يُعْطِ:',
          arti: '"Bismillahirrahmanirrahim. Inilah kewajiban zakat yang ditetapkan ' +
            'Rasulullah ﷺ atas kaum muslimin sebagaimana diperintahkan Allah. Siapa ' +
            'diminta sesuai ketentuan ini, berikanlah; siapa diminta melebihinya, ' +
            'jangan beri.' },
        { id: 'untaAwal',
          arab: 'فِي أَرْبَعٍ وَعِشْرِينَ مِنَ الْإِبِلِ فَمَا دُونَهَا مِنَ الْغَنَمِ مِنْ كُلِّ خَمْسٍ شَاةٌ،',
          arti: 'Unta sampai 24 ekor: tiap 5 ekor zakatnya 1 kambing.' },
        { id: 'untaTabel',
          arab: 'إِذَا بَلَغَتْ خَمْسًا وَعِشْرِينَ إِلَى خَمْسٍ وَثَلَاثِينَ فَفِيهَا بِنْتُ مَخَاضٍ أُنْثَى، فَإِذَا بَلَغَتْ سِتًّا وَثَلَاثِينَ إِلَى خَمْسٍ وَأَرْبَعِينَ فَفِيهَا بِنْتُ لَبُونٍ أُنْثَى، فَإِذَا بَلَغَتْ سِتًّا وَأَرْبَعِينَ إِلَى سِتِّينَ فَفِيهَا حِقَّةٌ طَرُوقَةُ الْجَمَلِ، فَإِذَا بَلَغَتْ وَاحِدَةً وَسِتِّينَ إِلَى خَمْسٍ وَسَبْعِينَ فَفِيهَا جَذَعَةٌ، فَإِذَا بَلَغَتْ سِتًّا وَسَبْعِينَ إِلَى تِسْعِينَ فَفِيهَا بِنْتَا لَبُونٍ، فَإِذَا بَلَغَتْ إِحْدَى وَتِسْعِينَ إِلَى عِشْرِينَ وَمِائَةٍ فَفِيهَا حِقَّتَانِ طَرُوقَتَا الْجَمَلِ،',
          arti: '25–35 ekor: 1 bintu makhadh (unta betina umur 1 tahun). 36–45: 1 ' +
            'bintu labun (2 tahun). 46–60: 1 hiqqah (3 tahun, siap dikawinkan). ' +
            '61–75: 1 jadza’ah (4 tahun). 76–90: 2 bintu labun. 91–120: 2 hiqqah.' },
        { id: 'untaBesar',
          arab: 'فَإِذَا زَادَتْ عَلَى عِشْرِينَ وَمِائَةٍ فَفِي كُلِّ أَرْبَعِينَ بِنْتُ لَبُونٍ، وَفِي كُلِّ خَمْسِينَ حِقَّةٌ،',
          arti: 'Lebih dari 120: tiap 40 ekor → 1 bintu labun, dan tiap 50 ekor → 1 hiqqah.' },
        { id: null,
          arab: 'وَمَنْ لَمْ يَكُنْ مَعَهُ إِلَّا أَرْبَعٌ مِنَ الْإِبِلِ فَلَيْسَ فِيهَا صَدَقَةٌ إِلَّا أَنْ يَشَاءَ رَبُّهَا،',
          arti: 'Yang hanya punya 4 ekor unta tidak wajib apa-apa, kecuali ' +
            'pemiliknya mau bersedekah sukarela.' },
        { id: 'kambing',
          arab: 'وَفِي صَدَقَةِ الْغَنَمِ فِي سَائِمَتِهَا إِذَا كَانَتْ أَرْبَعِينَ إِلَى عِشْرِينَ وَمِائَةٍ شَاةٌ، فَإِذَا زَادَتْ عَلَى عِشْرِينَ وَمِائَةٍ إِلَى مِائَتَيْنِ شَاتَانِ، فَإِذَا زَادَتْ عَلَى مِائَتَيْنِ إِلَى ثَلَاثِمِائَةٍ فَفِيهَا ثَلَاثُ شِيَاهٍ، فَإِذَا زَادَتْ عَلَى ثَلَاثِمِائَةٍ فَفِي كُلِّ مِائَةٍ شَاةٌ،',
          arti: 'Kambing yang digembalakan: 40–120 ekor → 1 kambing. Lebih dari 120 ' +
            'sampai 200 → 2 kambing. Lebih dari 200 sampai 300 → 3 kambing. Lebih ' +
            'dari 300 → tiap 100 ekor 1 kambing.' },
        { id: 'dibawahNisab',
          arab: 'فَإِذَا كَانَتْ سَائِمَةُ الرَّجُلِ نَاقِصَةً مِنْ أَرْبَعِينَ شَاةً وَاحِدَةً فَلَيْسَ فِيهَا صَدَقَةٌ إِلَّا أَنْ يَشَاءَ رَبُّهَا،',
          arti: 'Yang gembalaannya kurang satu saja dari 40 ekor tidak wajib ' +
            'apa-apa, kecuali pemiliknya mau.' },
        { id: 'perak',
          arab: 'وَفِي الرِّقَةِ رُبْعُ الْعُشْرِ، فَإِنْ لَمْ تَكُنْ إِلَّا تِسْعِينَ وَمِائَةً فَلَيْسَ فِيهَا شَيْءٌ إِلَّا أَنْ يَشَاءَ رَبُّهَا',
          arti: 'Perak (uang): zakatnya seperempat dari sepersepuluh (2,5%). Yang ' +
            'hanya punya 190 dirham tidak wajib apa-apa, kecuali ia mau."' }
      ],
      ringkas: 'Dokumen tertulis resmi pertama tentang tarif zakat, dikirim Abu ' +
        'Bakar kepada Anas saat menjadi amil Bahrain. Seluruh tabel ternak dan kadar ' +
        '2,5% di kalkulator ini disalin apa adanya dari surat ini. Perhatikan syarat ' +
        '"sa’imah" (digembalakan) pada kambing.'
    },

    'hr-sapi': {
      jenis: 'hadits',
      rujukan: 'HR Abu Dawud no. 1576',
      perawi: 'Dari Mu’adz bin Jabal radhiyallahu anhu',
      derajat: 'Sahih menurut Al-Albani',
      tautan: { label: 'Baca di hadits.id — Abu Dawud 1576',
        url: 'https://www.hadits.id/hadits/abudawud/1576' },
      segmen: [
        { id: 'sapi',
          arab: 'أَنَّ النَّبِيَّ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ لَمَّا وَجَّهَهُ إِلَى الْيَمَنِ أَمَرَهُ أَنْ يَأْخُذَ مِنَ الْبَقَرِ مِنْ كُلِّ ثَلَاثِينَ تَبِيعًا أَوْ تَبِيعَةً وَمِنْ كُلِّ أَرْبَعِينَ مُسِنَّةً،',
          arti: 'Ketika mengutus Mu’adz ke Yaman, Nabi ﷺ memerintahkannya ' +
            'mengambil zakat sapi: dari tiap 30 ekor satu tabi’ atau tabi’ah ' +
            '(sapi umur 1 tahun), dan dari tiap 40 ekor satu musinnah (sapi betina ' +
            'umur 2 tahun);' },
        { id: null,
          arab: 'وَمِنْ كُلِّ حَالِمٍ - يَعْنِي مُحْتَلِمًا - دِينَارًا أَوْ عِدْلَهُ مِنَ الْمَعَافِرِ ثِيَابٌ تَكُونُ بِالْيَمَنِ',
          arti: 'dan dari tiap lelaki dewasa (non-muslim, sebagai jizyah) satu dinar ' +
            'atau kain ma’afir senilainya — kain buatan Yaman.' }
      ],
      ringkas: 'Tabel zakat sapi: kelipatan 30 → tabi’, kelipatan 40 → musinnah. ' +
        'Jumlah besar dihitung dengan kombinasi keduanya — 70 ekor = 1 tabi’ + ' +
        '1 musinnah, dan seterusnya.'
    },

    'hr-usyr': {
      jenis: 'hadits',
      rujukan: 'HR Bukhari no. 1483',
      perawi: 'Dari Ibnu Umar radhiyallahu anhuma',
      derajat: 'Sahih',
      tautan: { label: 'Baca di hadits.id — Bukhari 1483',
        url: 'https://www.hadits.id/hadits/bukhari/1483' },
      segmen: [
        { id: 'hujan',
          arab: 'فِيمَا سَقَتِ السَّمَاءُ وَالْعُيُونُ أَوْ كَانَ عَثَرِيًّا الْعُشْرُ،',
          arti: 'Tanaman yang diairi hujan, mata air, atau menyerap air sendiri: ' +
            'zakatnya sepersepuluh (10%).' },
        { id: 'irigasi',
          arab: 'وَمَا سُقِيَ بِالنَّضْحِ نِصْفُ الْعُشْرِ',
          arti: 'Yang diairi dengan tenaga dan biaya (disiram, dipompa): setengahnya ' +
            '— seperduapuluh (5%).' }
      ],
      ringkas: 'Kadar zakat pertanian mengikuti besarnya usaha: pengairan gratis ' +
        'dari langit 10%, pengairan yang keluar biaya 5%.'
    },

    'hr-rikaz': {
      jenis: 'hadits',
      rujukan: 'HR Bukhari no. 1499',
      perawi: 'Dari Abu Hurairah radhiyallahu anhu',
      derajat: 'Sahih',
      tautan: { label: 'Baca di hadits.id — Bukhari 1499',
        url: 'https://www.hadits.id/hadits/bukhari/1499' },
      segmen: [
        { id: null,
          arab: 'الْعَجْمَاءُ جُبَارٌ، وَالْبِئْرُ جُبَارٌ، وَالْمَعْدِنُ جُبَارٌ،',
          arti: 'Luka karena hewan tidak ada tanggungannya, celaka di sumur tidak ' +
            'ada tanggungannya, celaka di tambang tidak ada tanggungannya;' },
        { id: 'rikaz',
          arab: 'وَفِي الرِّكَازِ الْخُمُسُ',
          arti: 'dan pada rikaz (harta karun temuan) zakatnya seperlima (20%).' }
      ],
      ringkas: 'Harta temuan tidak menunggu nisab dan haul — seperlimanya langsung ' +
        'dikeluarkan saat ditemukan. Harta yang datang tanpa jerih payah, bagiannya ' +
        'untuk umat paling besar.'
    },

    'hr-fitrah': {
      jenis: 'hadits',
      rujukan: 'HR Bukhari no. 1503',
      perawi: 'Dari Ibnu Umar radhiyallahu anhuma',
      derajat: 'Sahih',
      tautan: { label: 'Baca di hadits.id — Bukhari 1503',
        url: 'https://www.hadits.id/hadits/bukhari/1503' },
      segmen: [
        { id: 'kadar',
          arab: 'فَرَضَ رَسُولُ اللَّهِ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ زَكَاةَ الْفِطْرِ صَاعًا مِنْ تَمْرٍ، أَوْ صَاعًا مِنْ شَعِيرٍ',
          arti: 'Rasulullah ﷺ mewajibkan zakat fitrah satu sha’ kurma atau satu ' +
            'sha’ gandum (di Indonesia: ±2,5 kg makanan pokok — beras)' },
        { id: 'siapa',
          arab: 'عَلَى الْعَبْدِ وَالْحُرِّ، وَالذَّكَرِ وَالْأُنْثَى، وَالصَّغِيرِ وَالْكَبِيرِ مِنَ الْمُسْلِمِينَ،',
          arti: 'atas setiap muslim — hamba maupun merdeka, lelaki maupun perempuan, ' +
            'anak-anak maupun dewasa —' },
        { id: 'waktu',
          arab: 'وَأَمَرَ بِهَا أَنْ تُؤَدَّى قَبْلَ خُرُوجِ النَّاسِ إِلَى الصَّلَاةِ',
          arti: 'dan memerintahkan agar ditunaikan sebelum orang-orang berangkat ' +
            'shalat Id.' }
      ],
      ringkas: 'Zakat fitrah dihitung per jiwa, bukan per harta: 1 sha’ makanan ' +
        'pokok untuk setiap orang yang kamu tanggung, lunas sebelum shalat Idulfitri.'
    },

    'hr-fitrah-waktu': {
      jenis: 'hadits',
      rujukan: 'HR Bukhari no. 1509',
      perawi: 'Dari Ibnu Umar radhiyallahu anhuma',
      derajat: 'Sahih',
      tautan: { label: 'Baca di hadits.id — Bukhari 1509',
        url: 'https://www.hadits.id/hadits/bukhari/1509' },
      arab: 'أَمَرَ النَّبِيُّ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ بِزَكَاةِ الْفِطْرِ قَبْلَ خُرُوجِ النَّاسِ إِلَى الصَّلَاةِ',
      terjemah: 'Nabi ﷺ memerintahkan zakat fitrah ditunaikan sebelum orang-orang ' +
        'berangkat shalat (Id).',
      ringkas: 'Batas akhirnya jelas: sebelum shalat Id. Para sahabat biasa ' +
        'menunaikannya satu-dua hari sebelumnya; setelah shalat Id ia jatuh menjadi ' +
        'sedekah biasa, bukan lagi zakat fitrah.'
    },

    'hr-tajil': {
      jenis: 'hadits',
      rujukan: 'HR Abu Dawud no. 1624',
      perawi: 'Dari Ali bin Abi Thalib radhiyallahu anhu',
      derajat: 'Hasan menurut Al-Albani',
      tautan: { label: 'Baca di hadits.id — Abu Dawud 1624',
        url: 'https://www.hadits.id/hadits/abudawud/1624' },
      arab: 'أَنَّ الْعَبَّاسَ سَأَلَ النَّبِيَّ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ فِي تَعْجِيلِ صَدَقَتِهِ قَبْلَ أَنْ تَحِلَّ، فَرَخَّصَ لَهُ فِي ذَلِكَ',
      terjemah: 'Abbas bertanya kepada Nabi ﷺ tentang membayar zakatnya lebih awal ' +
        'sebelum jatuh temponya, dan beliau mengizinkannya.',
      ringkas: 'Membayar zakat lebih awal dari haulnya boleh (ta’jil). Yang ' +
        'tidak boleh adalah menundanya setelah jatuh tempo tanpa uzur.'
    },

    'hr-doa': {
      jenis: 'hadits',
      rujukan: 'HR Bukhari no. 1497',
      perawi: 'Dari Abdullah bin Abi Aufa radhiyallahu anhu',
      derajat: 'Sahih',
      tautan: { label: 'Baca di hadits.id — Bukhari 1497',
        url: 'https://www.hadits.id/hadits/bukhari/1497' },
      arab: 'كَانَ النَّبِيُّ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ إِذَا أَتَاهُ قَوْمٌ بِصَدَقَتِهِمْ قَالَ: اللَّهُمَّ صَلِّ عَلَى آلِ فُلَانٍ. فَأَتَاهُ أَبِي بِصَدَقَتِهِ فَقَالَ: اللَّهُمَّ صَلِّ عَلَى آلِ أَبِي أَوْفَى',
      terjemah: 'Bila ada kaum yang datang menyerahkan zakatnya, Nabi ﷺ berdoa: "Ya ' +
        'Allah, limpahkanlah shalawat (rahmat) atas keluarga si Fulan." Ketika ayahku ' +
        'datang membawa zakatnya, beliau berdoa: "Ya Allah, limpahkanlah shalawat atas ' +
        'keluarga Abu Aufa."',
      ringkas: 'Pembayar zakat didoakan langsung oleh Nabi ﷺ — sunnah ini diteruskan ' +
        'para amil hingga sekarang saat menerima setoran zakat.'
    },

    'hr-kuda-budak': {
      jenis: 'hadits',
      rujukan: 'HR Bukhari no. 1464',
      perawi: 'Dari Abu Hurairah radhiyallahu anhu',
      derajat: 'Sahih',
      tautan: { label: 'Baca di hadits.id — Bukhari 1464',
        url: 'https://www.hadits.id/hadits/bukhari/1464' },
      arab: 'لَيْسَ عَلَى الْمُسْلِمِ صَدَقَةٌ فِي عَبْدِهِ وَلَا فِي فَرَسِهِ',
      terjemah: 'Tidak ada zakat atas seorang muslim pada budaknya dan pada kudanya.',
      ringkas: 'Dasar kaidah penting: harta yang dipakai sendiri tidak dizakati. ' +
        'Kuda tunggangan zaman itu = kendaraan dan rumah tinggal zaman ini. Yang ' +
        'dizakati adalah harta yang tersimpan dan berkembang, bukan yang dipakai ' +
        'sehari-hari.'
    },

    'hr-dagang': {
      jenis: 'hadits',
      rujukan: 'HR Abu Dawud no. 1562',
      perawi: 'Dari Samurah bin Jundub radhiyallahu anhu',
      derajat: 'Dhaif menurut Al-Albani — dicantumkan karena masyhur sebagai dalil bab ini; ' +
        'pijakan utama zakat perdagangan adalah keumuman QS Al-Baqarah 267 dan ijma’ ' +
        '(kesepakatan) ulama',
      tautan: { label: 'Baca di hadits.id — Abu Dawud 1562',
        url: 'https://www.hadits.id/hadits/abudawud/1562' },
      arab: 'أَمَّا بَعْدُ، فَإِنَّ رَسُولَ اللَّهِ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ كَانَ يَأْمُرُنَا أَنْ نُخْرِجَ الصَّدَقَةَ مِنَ الَّذِي نُعِدُّ لِلْبَيْعِ',
      terjemah: 'Rasulullah ﷺ dahulu memerintahkan kami mengeluarkan zakat dari ' +
        'barang yang kami siapkan untuk dijual.',
      ringkas: 'Kewajiban zakat harta dagang disepakati ulama (ijma’). Derajat ' +
        'hadits ini sendiri lemah menurut Al-Albani — kami tulis apa adanya; dalil ' +
        'kuatnya adalah keumuman QS Al-Baqarah 267 tentang menafkahkan hasil usaha.'
    }
  };

  // Ayat/hadits ber-segmen: teks utuhnya diturunkan dari gabungan ruas,
  // supaya tidak mungkin ada dua versi teks yang berbeda.
  Object.keys(DALIL).forEach(function (id) {
    var d = DALIL[id];
    if (!d.segmen) return;
    d.arab = d.segmen.map(function (s) { return s.arab; }).join(' ');
    d.terjemah = d.segmen.map(function (s) { return s.arti; }).join(' ');
  });

  // Chip derajat memakai kata pertama `derajat` — satu sumber kebenaran.
  Object.keys(DALIL).forEach(function (id) {
    var d = DALIL[id];
    if (d.jenis !== 'hadits') return;
    d.grade = /^dhaif/i.test(d.derajat) ? 'dhaif' : /^hasan/i.test(d.derajat) ? 'hasan' : 'sahih';
  });

  function ambil(id) { return DALIL[id] || null; }

  function kumpulkan(ids) {
    return (ids || []).map(ambil).filter(Boolean);
  }

  root.Dalil = { DATA: DALIL, ambil: ambil, kumpulkan: kumpulkan };
})(typeof window !== 'undefined' ? window : globalThis);
