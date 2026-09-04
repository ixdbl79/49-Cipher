// ============================================================
// KEYTAB – Quran Transliteration Tool
// Complete version with embedded phonetics data (no external file needed)
// ============================================================

(function() {

    // ---- Global Data ----
    let quranData = {};
    let surahNames = {};
    let verseCache = {};
    let dataLoaded = false;
    let isLoading = false;

    // ---- Page Mapping ----
    let pageMap = null;
    let pagesData = [];
    let pagesLoaded = false;
    let pendingRef = null;

    // ---- Pagination State ----
    let currentPage = 0;
    let totalPages = 604;
    let isCover = true;

    // ---- Surah Data & Display Mode ----
    let surahData = {};
    let surahNamesList = [];
    let displayMode = 'translit';

    // ---- Phonetics Data (embedded) ----
    // ---- Phonetics Data (embedded, English-friendly) ----
    const phoneticsData = {
        "1": {
            "english": "Hamza",
            "arabic": "ء / أ / ؤ / ئ",
            "description": "Glottal stop (catch in throat)",
            "examples": ["2ana (أنا) – like the break in 'uh-oh'"]
        },
        "2": {
            "english": "Ghayn",
            "arabic": "غ",
            "description": "Voiced uvular fricative (like French 'r' but deeper)",
            "examples": ["2ayb (غيب) – similar to 'gh' in 'ghost'"]
        },
        "3": {
            "english": "'Ayn",
            "arabic": "ع",
            "description": "Voiced pharyngeal fricative (deep 'a' from throat)",
            "examples": ["3ayn (عين) – sounds like 'aa' with a catch"]
        },
        "4": {
            "english": "Ṭāʼ",
            "arabic": "ط",
            "description": "Emphatic 't' (heavy, with tongue tip)",
            "examples": ["4ayeb (طيب) – like 't' but deeper"]
        },
        "5": {
            "english": "Khāʼ",
            "arabic": "خ",
            "description": "Voiceless uvular fricative (like 'ch' in 'Bach')",
            "examples": ["5aled (خالد) – like 'kh' in 'khan'"]
        },
        "6": {
            "english": "Ḍād",
            "arabic": "ض",
            "description": "Emphatic 'd' (heavy, with tongue tip)",
            "examples": ["6ayb (ضيب) – like 'd' but heavier"]
        },
        "7": {
            "english": "Ḥāʼ",
            "arabic": "ح",
            "description": "Voiceless pharyngeal fricative (strong 'h' from throat)",
            "examples": ["7abib (حبيب) – like 'h' but from deeper in throat"]
        },
        "8": {
            "english": "Shīn",
            "arabic": "ش",
            "description": "Voiceless postalveolar fricative (like 'sh' in 'ship')",
            "examples": ["8ams (شمس) – like 'sh' in 'shame'"]
        },
        "9": {
            "english": "Qāf",
            "arabic": "ق",
            "description": "Voiceless uvular plosive (like 'k' from back of throat)",
            "examples": ["9alb (قلب) – like 'q' in 'qat'"]
        },
        "0": {
            "english": "Ṣād",
            "arabic": "ص",
            "description": "Emphatic 's' (heavy, with tongue tip)",
            "examples": ["0abir (صابر) – like 's' but deeper"]
        },
        "a": {
            "english": "Alif / Fatha",
            "arabic": "ا / َ",
            "description": "Short 'a' as in 'cat' / long 'ā' as in 'father'",
            "examples": ["ana (أنا) – 'a' as in 'apple'"]
        },
        "b": {
            "english": "Bāʼ",
            "arabic": "ب",
            "description": "Voiced bilabial plosive (like 'b' in 'bat')",
            "examples": ["baba (بابا) – like 'b' in 'baby'"]
        },
        "d": {
            "english": "Dāl",
            "arabic": "د",
            "description": "Voiced alveolar plosive (like 'd' in 'dog')",
            "examples": ["dar (دار) – like 'd' in 'door'"]
        },
        "dh": {
            "english": "Dhāl",
            "arabic": "ذ",
            "description": "Voiced dental fricative (like 'th' in 'this')",
            "examples": ["dheeb (ذيب) – like 'th' in 'that'"]
        },
        "f": {
            "english": "Fāʼ",
            "arabic": "ف",
            "description": "Voiceless labiodental fricative (like 'f' in 'fun')",
            "examples": ["faisal (فيصل) – like 'f' in 'friend'"]
        },
        "g": {
            "english": "Jeem (hard)",
            "arabic": "ج",
            "description": "Voiced palato-alveolar affricate (like 'j' in 'jump')",
            "examples": ["gamal (جمال) – like 'j' in 'jam'"]
        },
        "h": {
            "english": "Hāʼ",
            "arabic": "ه",
            "description": "Voiceless glottal fricative (like 'h' in 'house')",
            "examples": ["hawa (هوى) – like 'h' in 'happy'"]
        },
        "j": {
            "english": "Jeem",
            "arabic": "ج",
            "description": "Voiced palato-alveolar affricate (like 'j' in 'jump')",
            "examples": ["jamal (جمل) – like 'j' in 'jam'"]
        },
        "k": {
            "english": "Kāf",
            "arabic": "ك",
            "description": "Voiceless velar plosive (like 'k' in 'kite')",
            "examples": ["kalb (كلب) – like 'k' in 'king'"]
        },
        "l": {
            "english": "Lām",
            "arabic": "ل",
            "description": "Voiced alveolar lateral approximant (like 'l' in 'love')",
            "examples": ["lail (ليل) – like 'l' in 'light'"]
        },
        "m": {
            "english": "Mīm",
            "arabic": "م",
            "description": "Voiced bilabial nasal (like 'm' in 'mother')",
            "examples": ["mama (ماما) – like 'm' in 'moon'"]
        },
        "n": {
            "english": "Nūn",
            "arabic": "ن",
            "description": "Voiced alveolar nasal (like 'n' in 'night')",
            "examples": ["nur (نور) – like 'n' in 'new'"]
        },
        "r": {
            "english": "Rāʼ",
            "arabic": "ر",
            "description": "Voiced alveolar trill (like Spanish 'r')",
            "examples": ["ras (راس) – like 'r' in 'run' (rolled)"]
        },
        "s": {
            "english": "Sīn",
            "arabic": "س",
            "description": "Voiceless alveolar fricative (like 's' in 'sun')",
            "examples": ["salam (سلام) – like 's' in 'safe'"]
        },
        "sh": {
            "english": "Shīn",
            "arabic": "ش",
            "description": "Voiceless postalveolar fricative (like 'sh' in 'ship')",
            "examples": ["shams (شمس) – like 'sh' in 'shine'"]
        },
        "t": {
            "english": "Tāʼ",
            "arabic": "ت",
            "description": "Voiceless alveolar plosive (like 't' in 'top')",
            "examples": ["tayeb (طيب) – like 't' in 'time'"]
        },
        "th": {
            "english": "Thāʼ",
            "arabic": "ث",
            "description": "Voiceless dental fricative (like 'th' in 'thin')",
            "examples": ["thalath (ثلاثة) – like 'th' in 'thick'"]
        },
        "w": {
            "english": "Wāw",
            "arabic": "و",
            "description": "Voiced labio-velar approximant (like 'w' in 'water')",
            "examples": ["wadi (وادي) – like 'w' in 'wind'"]
        },
        "y": {
            "english": "Yāʼ",
            "arabic": "ي",
            "description": "Voiced palatal approximant (like 'y' in 'yes')",
            "examples": ["yad (يد) – like 'y' in 'yellow'"]
        },
        "z": {
            "english": "Zāy",
            "arabic": "ز",
            "description": "Voiced alveolar fricative (like 'z' in 'zoo')",
            "examples": ["zaman (زمان) – like 'z' in 'zero'"]
        },
        "d·": {
            "english": "Dhāl (this)",
            "arabic": "ذ",
            "description": "Voiced dental fricative (like 'th' in 'this')",
            "examples": ["d·alik (ذلك) – like 'th' in 'that'"]
        },
        "t·": {
            "english": "Thāʼ (thin)",
            "arabic": "ث",
            "description": "Voiceless dental fricative (like 'th' in 'thin')",
            "examples": ["t·alath (ثلاث) – like 'th' in 'three'"]
        },
        "6·": {
            "english": "Ẓāʼ (3aẓīm)",
            "arabic": "ظ",
            "description": "Emphatic 'th' (heavy, with tongue tip)",
            "examples": ["6·ulm (ظلم) – like 'th' but deeper"]
        },
        "-": {
            "english": "Fatha (a)",
            "arabic": "َ",
            "description": "Short open vowel (like 'a' in 'cat')",
            "examples": ["kataba (كَتَبَ) – 'a' as in 'apple'"]
        },
        "°": {
            "english": "Damma (u)",
            "arabic": "ُ",
            "description": "Short close back rounded vowel (like 'u' in 'put')",
            "examples": ["kutiba (كُتِبَ) – 'u' as in 'full'"]
        },
        "_": {
            "english": "Kasra (i)",
            "arabic": "ِ",
            "description": "Short close front unrounded vowel (like 'i' in 'sit')",
            "examples": ["kitab (كِتَاب) – 'i' as in 'bit'"]
        },
        "--": {
            "english": "Long ā",
            "arabic": "ا / ٰ",
            "description": "Long open vowel (like 'a' in 'father')",
            "examples": ["kitaab (كِتَاب) – 'aa' as in 'father'"]
        },
        "°°": {
            "english": "Long ū",
            "arabic": "و",
            "description": "Long close back rounded vowel (like 'oo' in 'moon')",
            "examples": ["nūr (نُور) – 'oo' as in 'moon'"]
        },
        "__": {
            "english": "Long ī",
            "arabic": "ي",
            "description": "Long close front unrounded vowel (like 'ee' in 'see')",
            "examples": ["tīr (طِير) – 'ee' as in 'see'"]
        },
        "²": {
            "english": "Shadda",
            "arabic": "ّ",
            "description": "Gemination (double the consonant)",
            "examples": ["inna (إِنَّ) – 'nn' as in 'penknife'"]
        },
        "~": {
            "english": "Madda",
            "arabic": "ۤ",
            "description": "Prolongation of alif",
            "examples": ["āyah (آيَة) – 'aa' as in 'father' but longer"]
        },
        "=": {
            "english": "Tanween",
            "arabic": "ً / ٌ / ٍ",
            "description": "Nunation (indefinite noun ending)",
            "examples": ["kitāban (كِتَابًا) – 'an' as in 'can'"]
        },
        "¯": {
            "english": "Separator",
            "arabic": "ـ",
            "description": "Word boundary marker (joins words)",
            "examples": ["fī¯l (فِيل) – connects letters"]
        },
        "L.": {
            "english": "Lunar L",
            "arabic": "ل",
            "description": "Lam of the definite article (clear 'l')",
            "examples": ["al-qamar (اَلْقَمَر) – 'l' as in 'lunar'"]
        },
        "(L.)¨~": {
            "english": "Solar L",
            "arabic": "ل",
            "description": "Lam of the definite article (assimilated 'l')",
            "examples": ["ash-shams (اَلشَّمْس) – 'l' assimilates to 'sh'"]
        },
        "^": {
            "english": "Tafkhīm (heavy)",
            "arabic": "ـۢ",
            "description": "Emphatic / heavy pronunciation",
            "examples": ["Allāh (اَلله) – heavy 'l' in 'Allah'"]
        }
    };

    // ---- DOM Elements ----
    const input = document.getElementById('verseInput');
    const goBtn = document.getElementById('goBtn');
    const randomBtn = document.getElementById('randomBtn');
    const resultsContainer = document.getElementById('resultsContainer');
    const resultsTitle = document.getElementById('resultsTitle');
    const verseCountDisplay = document.getElementById('verseCountDisplay');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const loadingIndicator = document.getElementById('loadingIndicator');

    // ============================================================
    // SMART FONT-SIZE ADJUSTMENT
    // ============================================================

    function fitContentToContainer() {
        const bookPage = document.querySelector('.book-page');
        if (!bookPage) return;

        const containerHeight = bookPage.clientHeight;
        if (containerHeight < 100) return;

        const baseFontSize = 1.0;
        bookPage.style.fontSize = baseFontSize + 'rem';
        const contentHeightAtBase = bookPage.scrollHeight;

        const targetRatio = 0.95;
        let ratio = (containerHeight / contentHeightAtBase) * targetRatio;

        let newFontSize = baseFontSize * ratio;
        newFontSize = Math.max(0.45, Math.min(2.5, newFontSize));

        bookPage.style.fontSize = newFontSize + 'rem';

        let low = 0.45;
        let high = 2.5;
        let mid;
        let iterations = 0;
        const maxIterations = 30;

        while (iterations < maxIterations) {
            mid = (low + high) / 2;
            bookPage.style.fontSize = mid + 'rem';
            if (bookPage.scrollHeight <= containerHeight) {
                low = mid;
            } else {
                high = mid;
            }
            iterations++;
        }

        bookPage.style.fontSize = low + 'rem';

        if (bookPage.scrollHeight > containerHeight) {
            bookPage.style.fontSize = (low * 0.98) + 'rem';
        }

        console.log(`📏 Font size adjusted to: ${bookPage.style.fontSize} (${bookPage.scrollHeight}px / ${containerHeight}px)`);

        const container = bookPage.parentElement;
        if (container) container.scrollTop = 0;
    }

    // ---- Auto‑re‑fit on window resize ----
    let resizeTimeout = null;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            if (!isCover && document.querySelector('.book-page')) {
                fitContentToContainer();
            }
        }, 250);
    });

    // ---- Also re‑fit when the container size changes ----
    if (window.ResizeObserver) {
        const resizeObserver = new ResizeObserver(function() {
            if (!isCover && document.querySelector('.book-page')) {
                fitContentToContainer();
            }
        });
        const container = document.querySelector('.book-container');
        if (container) {
            resizeObserver.observe(container);
        }
    }

    // ============================================================
    // LOAD QURAN BOOK DATA
    // ============================================================

    function loadQuranBook() {
        isLoading = true;
        loadingIndicator.classList.add('visible');

        // --- MODIFIED: added ../data/quran_book.txt as first path ---
        const paths = [
            '../data/quran_book.txt',
            '../../../quran_book.txt',
            '../../quran_book.txt',
            '../quran_book.txt',
            '/quran_book.txt',
            'quran_book.txt'
        ];

        let attempt = 0;

        function tryNextPath() {
            if (attempt >= paths.length) {
                loadingIndicator.classList.remove('visible');
                isLoading = false;
                showError('Could not load quran_book.txt. Please ensure the file exists.');
                console.error('❌ All paths failed.');
                return;
            }

            const path = paths[attempt];
            attempt++;
            console.log(`🔍 Attempting to load: ${path}`);

            fetch(path)
                .then(response => {
                    if (!response.ok) throw new Error('Not found');
                    return response.text();
                })
                .then(text => {
                    console.log('✅ File loaded successfully. Size:', text.length, 'chars');
                    parseQuranBook(text);
                    loadingIndicator.classList.remove('visible');
                    isLoading = false;
                    dataLoaded = true;
                    buildPageMap();
                })
                .catch((err) => {
                    console.warn(`⚠️ Failed to load from ${path}:`, err.message);
                    tryNextPath();
                });
        }

        tryNextPath();
    }

    // ============================================================
    // PARSE QURAN BOOK DATA
    // ============================================================

    function parseQuranBook(text) {
        if (text.charCodeAt(0) === 0xFEFF) {
            text = text.slice(1);
            console.log('🔧 Stripped UTF-8 BOM');
        }

        const lines = text.split('\n');
        let currentSurah = null;
        let currentSurahName = null;
        let verseBuffer = [];
        let totalVerses = 0;
        let surahCount = 0;

        console.log('📖 Parsing quran_book.txt...');

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            if (!line) continue;

            const headerMatch = line.match(/^\{(\d+)\}\s+s°°r-t\s+"([^"]+)"/);
            if (headerMatch) {
                if (currentSurah !== null && verseBuffer.length > 0) {
                    const count = processVerseBuffer(currentSurah, currentSurahName, verseBuffer);
                    console.log(`   ➜ Surah ${currentSurah} processed: ${count} verses`);
                    totalVerses += count;
                    surahCount++;
                }
                currentSurah = parseInt(headerMatch[1]);
                currentSurahName = headerMatch[2];
                verseBuffer = [];
                console.log(`   📖 Found Surah ${currentSurah}: "${currentSurahName}" (line ${i+1})`);
                continue;
            }

            if (line.includes('b_¯(1)~sm_') && !line.includes('[')) {
                continue;
            }

            if (line.includes('[') && line.includes(']')) {
                verseBuffer.push(line);
            }
        }

        if (currentSurah !== null && verseBuffer.length > 0) {
            const count = processVerseBuffer(currentSurah, currentSurahName, verseBuffer);
            console.log(`   ➜ Surah ${currentSurah} processed: ${count} verses`);
            totalVerses += count;
            surahCount++;
        }

        console.log(`✅ Loaded ${totalVerses} verses from quran_book.txt`);
        console.log(`   📊 ${surahCount} surahs loaded (out of 114)`);

        if (Object.keys(quranData).length === 0) {
            console.warn('⚠️ No data loaded, using demo data');
            loadDemoData();
        } else {
            const sampleKeys = Object.keys(quranData).slice(0, 5);
            console.log('🔍 Sample keys:', sampleKeys);
            sampleKeys.forEach(k => console.log(`   ${k} -> ${quranData[k].slice(0, 50)}...`));
        }
    }

    function processVerseBuffer(surah, surahName, buffer) {
        surahNames[surah] = surahName;
        const fullText = buffer.join(' ');
        const regex = /\[(\d+)\]\s*([^\[]+)/g;
        let match;
        let count = 0;

        while ((match = regex.exec(fullText)) !== null) {
            const verseNum = parseInt(match[1]);
            const translit = match[2].trim();
            if (translit) {
                const key = surah + ':' + verseNum;
                quranData[key] = translit;
                if (!verseCache[surah]) verseCache[surah] = [];
                verseCache[surah].push(verseNum);
                count++;
            }
        }

        return count;
    }

    // ============================================================
    // FALLBACK – DEMO DATA
    // ============================================================

    function loadDemoData() {
        console.log('📖 Loading demo data...');
        quranData = {
            "1:1": "b_¯(1)~sm_ L.²-h_ (L.)¨~r²-7m--n_ (L.)¨~r²-7__m_",
            "1:2": "L.7-md° l_¯L.²-h_ r-b²_ L.3--l-m__n-",
            "1:3": "(L.)¨~r²-7m--n_ (L.)¨~r²-7__m_",
            "1:4": "m--l_k_ y-wm_ (L.)¨~d²__n_",
            "1:5": "1_y²--k- n-3b°d° w-¯1_y²--k- n-st-3__n°",
            "1:6": "1hd_n-- (L.)¨~0²_r--4- L.m°st-9__m-",
            "1:7": "0_r--4- L.²-d·__n- 1-n3-mt- 3-l-yh_m 2-yr_ L.m-26°°b_ 3-l-yh_m w-¯l-- (L.)¨~6²--l²__n-",
            "112:1": "9°l h°w- L.^²-h° 1-7-d°=",
            "112:2": "L.^²-h° (L.)¨~0²-m-d°",
            "112:3": "l-m y-l_d w-¯l-m y°°l-d",
            "112:4": "w-¯l-m y-k°n l²-h° k°f°w-= 1-7-d°=",
            "2:255": "L.²-h_ l-- 1-l--h- 1-l²-- h°w- (L.)¨~7-y° (L.)¨~9-y°°m°",
        };
        surahNames[1] = "L.f--t_7-";
        surahNames[112] = "L.1_5l--0";
        surahNames[2] = "L.b-9-r-°-h";
        dataLoaded = true;
        isLoading = false;
        loadingIndicator.classList.remove('visible');
        console.log('✅ Demo data loaded:', Object.keys(quranData).length, 'verses');
        showCoverPage();
    }

    // ============================================================
    // BUILD PAGE MAP FROM pages.json
    // ============================================================

    function buildPageMap() {
        // --- MODIFIED: fetch from data/ ---
        fetch('data/pages.json')
            .then(res => {
                if (!res.ok) throw new Error('pages.json not found');
                return res.json();
            })
            .then(data => {
                pageMap = data;
                pagesLoaded = true;
                console.log(`✅ Page mapping loaded: ${Object.keys(pageMap).length} verses mapped.`);
                buildPagesData();
                showCoverPage();
                loadSurahData();
                // ---- Phonetics data is embedded – just setup tooltip ----
                console.log('✅ Using embedded phonetics data');
                setupPhoneticsTooltip();
                if (pendingRef) {
                    searchVerse(pendingRef);
                    pendingRef = null;
                }
            })
            .catch(err => {
                console.warn('⚠️ Failed to load pages.json:', err);
                console.warn('⚠️ Falling back to verse-count pagination (per surah).');
                pagesLoaded = false;
                showCoverPage();
                if (pendingRef) {
                    searchVerse(pendingRef);
                    pendingRef = null;
                }
            });
    }

    function buildPagesData() {
        pagesData = new Array(605).fill(null).map(() => []);
        let totalAdded = 0;
        let missingKeys = [];

        for (const [key, page] of Object.entries(pageMap)) {
            const parts = key.split(':');
            if (parts.length === 2) {
                const surah = parseInt(parts[0]);
                const verse = parseInt(parts[1]);
                const text = quranData[key];
                if (text) {
                    pagesData[page].push({ surah, verse, text });
                    totalAdded++;
                } else {
                    missingKeys.push(key);
                }
            }
        }

        for (let p = 1; p <= 604; p++) {
            pagesData[p].sort((a, b) => a.surah - b.surah || a.verse - b.verse);
        }

        console.log(`✅ Built pagesData: ${totalAdded} verses across 604 pages.`);
        if (missingKeys.length > 0) {
            console.warn(`⚠️ Missing ${missingKeys.length} verses in quranData:`, missingKeys.slice(0, 10), '...');
        }

        if (totalAdded === 0) {
            console.warn('⚠️ No verses added to pagesData – rebuilding from pageMap directly...');
            for (const [key, page] of Object.entries(pageMap)) {
                const parts = key.split(':');
                if (parts.length === 2) {
                    const surah = parseInt(parts[0]);
                    const verse = parseInt(parts[1]);
                    const text = quranData[key] || `[${key}]`;
                    pagesData[page].push({ surah, verse, text });
                    totalAdded++;
                }
            }
            console.log(`✅ Rebuilt pagesData: ${totalAdded} verses (with placeholders).`);
        }
    }

    // ============================================================
    // LOAD SURAH DATA FROM JSON
    // ============================================================

    function loadSurahData() {
        // --- MODIFIED: fetch from data/ ---
        return fetch('data/surah_data.json')
            .then(res => {
                if (!res.ok) throw new Error('surah_data.json not found');
                return res.json();
            })
            .then(data => {
                surahData = data;
                surahNamesList = Object.entries(data).map(([id, info]) => ({
                    id: parseInt(id),
                    translit: info.translit || '',
                    arabic: info.arabic || '',
                    english: info.english || '',
                    meaning: info.meaning || '',
                    juz: info.juz || 0,
                    hizb: info.hizb || 0
                }));
                console.log('✅ Surah data loaded:', surahNamesList.length, 'surahs');
                populateSurahSelector();
                setupAutocomplete();
                setupDisplayModeFilters();
            })
            .catch(err => {
                console.warn('⚠️ Could not load surah_data.json, using fallback from quran_book.txt');
                surahNamesList = Object.entries(surahNames).map(([id, name]) => ({
                    id: parseInt(id),
                    translit: name,
                    arabic: '',
                    english: '',
                    meaning: '',
                    juz: 0,
                    hizb: 0
                }));
                populateSurahSelector();
                setupAutocomplete();
                setupDisplayModeFilters();
            });
    }

    // ============================================================
    // COVER PAGE – Clean Link Style
    // ============================================================

    function showCoverPage() {
        console.log('📖 showCoverPage called');
        isCover = true;
        currentPage = 0;
        resultsTitle.style.display = 'none';
        hideError();

        // ---- Calculate stats ----
        const totalSurahs = Object.keys(surahNames).length || 114;
        const totalVerses = Object.keys(quranData).length || 6236;

        let bookHtml = `<div class="book-container">`;
        bookHtml += `<div class="book-header" style="justify-content: center !important;">Cover</div>`;
        bookHtml += `<div class="book-page">`;
        bookHtml += `<div class="book-cover">`;

        // ---- Logo as clean link (same style as "Read the Full Book") ----
        // --- MODIFIED: image path to images/ ---
        bookHtml += `<a href="#" id="coverLogoLink" class="link cover-logo-link">`;
        bookHtml += `<img src="images/keytab_trnsprnt.png" alt="Keytab Logo" class="cover-logo-main" />`;
        bookHtml += `</a>`;

        // ---- Title & Subtitle ----
        bookHtml += `<div class="cover-sub">The Book · القرآن الكريم</div>`;
        bookHtml += `<div style="font-size:0.9rem; color:#a0aec0; margin:0.5rem 0;">49‑EZ Transliteration</div>`;
        bookHtml += `<div class="cover-verse">"The Criterion – Furqan"</div>`;

        // ---- Stats ----
        bookHtml += `<div class="cover-stats">`;
        bookHtml += `<span class="stat-item">${totalSurahs} Surahs</span>`;
        bookHtml += `<span class="stat-dot">•</span>`;
        bookHtml += `<span class="stat-item">604 Pages</span>`;
        bookHtml += `<span class="stat-dot">•</span>`;
        bookHtml += `<span class="stat-item">${totalVerses} Verses</span>`;
        bookHtml += `</div>`;

        bookHtml += `</div>`;
        bookHtml += `</div>`;
        bookHtml += `<div class="book-footer">— 49 Cipher · Keytab —</div>`;
        bookHtml += `</div>`;

        let navHtml = `<div class="book-nav-outer">`;
        navHtml += `<button class="nav-btn" disabled>`;
        navHtml += `<span class="arrow">‹</span> Previous`;
        navHtml += `</button>`;
        navHtml += `<div class="page-indicator">Cover</div>`;
        navHtml += `<button class="nav-btn" id="nextFromCoverBtn">`;
        navHtml += `Next <span class="arrow">›</span>`;
        navHtml += `</button>`;
        navHtml += `</div>`;

        let goToHtml = `<div class="book-go-to-outer" style="opacity:0.3;pointer-events:none;">`;
        goToHtml += `<label for="goToPageInputCover">Go to page:</label>`;
        goToHtml += `<input type="number" id="goToPageInputCover" name="goToPageInputCover" min="1" max="604" value="1" disabled />`;
        goToHtml += `<button disabled>Go</button>`;
        goToHtml += `</div>`;

        resultsContainer.innerHTML =
            `<div style="max-width:900px; width:100%; margin:0 auto; display:flex; flex-direction:column;">` +
                bookHtml + navHtml + goToHtml +
            `</div>`;

        // ---- Event listeners ----
        document.getElementById('nextFromCoverBtn').addEventListener('click', function() {
            console.log('🔄 Next from Cover clicked – going to page 1');
            goToPage(1);
        });

        document.getElementById('coverLogoLink').addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🔄 Logo clicked – going to page 1');
            goToPage(1);
        });

        fitContentToContainer();
    }

    // ============================================================
    // DISPLAY A GLOBAL PAGE (1–604) WITH SURAH HEADERS
    // ============================================================

    function goToPage(pageNum) {
        console.log(`📖 goToPage called with pageNum: ${pageNum}`);
        if (pageNum < 1 || pageNum > 604) {
            console.warn(`❌ Invalid page number: ${pageNum}`);
            return;
        }

        if (!pagesData[pageNum] || pagesData[pageNum].length === 0) {
            console.warn(`⚠️ pagesData[${pageNum}] is empty – building fallback...`);
            const fallbackVerses = [];
            for (const [key, page] of Object.entries(pageMap)) {
                if (page === pageNum) {
                    const parts = key.split(':');
                    if (parts.length === 2) {
                        const surah = parseInt(parts[0]);
                        const verse = parseInt(parts[1]);
                        const text = quranData[key] || `[${key}]`;
                        fallbackVerses.push({ surah, verse, text });
                    }
                }
            }
            fallbackVerses.sort((a, b) => a.surah - b.surah || a.verse - b.verse);
            pagesData[pageNum] = fallbackVerses;
            console.log(`✅ Built fallback for page ${pageNum}: ${fallbackVerses.length} verses.`);
        }

        isCover = false;
        currentPage = pageNum;
        hideError();
        resultsTitle.style.display = 'none';

        const verses = pagesData[pageNum];
        console.log(`📄 Page ${pageNum} has ${verses.length} verses`);

        const uniqueSurahs = [...new Set(verses.map(v => v.surah))];
        console.log(`📄 Surahs on this page:`, uniqueSurahs);

        function processTextWithStyling(text) {
            const tashkilChars = ['°', '_', '-', '²', '~', '=', '¯', '·', '¨'];
            const tafkhimChar = '^';
            let result = '';
            let i = 0;
            while (i < text.length) {
                const char = text[i];
                if (char >= '0' && char <= '9' && i + 1 < text.length && text[i + 1] === '·') {
                    result += `<span class="num-49">${char}·</span>`;
                    i += 2;
                    continue;
                }
                if (char >= '0' && char <= '9') {
                    result += `<span class="num-49">${char}</span>`;
                    i++;
                    continue;
                }
                if (char === tafkhimChar) {
                    result += `<span class="tafkhim">${char}</span>`;
                    i++;
                    continue;
                }
                if (tashkilChars.includes(char)) {
                    result += `<span class="tashkil">${char}</span>`;
                    i++;
                    continue;
                }
                result += char;
                i++;
            }
            return result;
        }

        let bookHtml = `<div class="book-container">`;

        let headerTags = '';
        uniqueSurahs.forEach((s, idx) => {
            const name = surahNames[s] || `Surah ${s}`;
            const isActive = verses.some(v => v.surah === s && v.verse === 1);
            headerTags += `<span class="surah-tag ${isActive ? 'active' : ''}">${name}</span>`;
        });

        bookHtml += `<div class="book-header">${headerTags}</div>`;
        bookHtml += `<div class="book-page">`;

        if (verses.length === 0) {
            bookHtml += `<div class="keytab-empty">No verses on this page.</div>`;
        } else {
            let currentSurahInPage = null;

            verses.forEach((v, index) => {
                if (v.surah !== currentSurahInPage) {
                    currentSurahInPage = v.surah;
                    const surahName = surahNames[v.surah] || `Surah ${v.surah}`;
                    const hasVerseOne = verses.some(verse => verse.surah === v.surah && verse.verse === 1);

                    if (hasVerseOne) {
                        const surahNum = v.surah.toString().padStart(3, ' ');
                        bookHtml += `<div class="surah-name-inside">`;
                        bookHtml += `<span class="ornament">✦</span>`;
                        bookHtml += `<span class="surah-number">${surahNum}</span>`;
                        bookHtml += `<span class="surah-name-text">${surahName}</span>`;
                        bookHtml += `<span class="ornament">✦</span>`;
                        bookHtml += `</div>`;

                        if (v.surah !== 1 && v.surah !== 9) {
                            const basmalaText = 'b_¯(1)~sm_ L.²-h_ (L.)¨~r²-7m--n_ (L.)¨~r²-7__m_';
                            bookHtml += `<div class="basmala-line">${processTextWithStyling(basmalaText)}</div>`;
                        }

                        bookHtml += `<span class="surah-gap"></span>`;
                    }
                }

                const words = v.text.split(' ');
                const wrappedWords = words.map(word => {
                    const processedWord = processTextWithStyling(word);
                    return `<span style="white-space: nowrap; display: inline-block;">${processedWord}</span>`;
                }).join(' ');

                bookHtml += `<span class="verse-line">`;
                bookHtml += `<span class="verse-number">[${v.verse}]</span>`;
                bookHtml += wrappedWords;
                bookHtml += `</span>`;
                if (index < verses.length - 1) {
                    bookHtml += ` `;
                }
            });
        }

        bookHtml += `</div>`;

        let footerParts = [];
        uniqueSurahs.forEach((s) => {
            const name = surahNames[s] || `Surah ${s}`;
            const surahVerses = verses.filter(v => v.surah === s);
            const verseNums = surahVerses.map(v => v.verse).sort((a,b) => a-b);
            const range = verseNums.length === 1 ? `${verseNums[0]}` : `${verseNums[0]}–${verseNums[verseNums.length-1]}`;
            footerParts.push(`<span class="footer-item"><span class="footer-surah">${name}</span> <span class="footer-range">${range}</span></span>`);
        });
        const footerText = footerParts.join(' · ') + ` · <span class="footer-count">${verses.length} verses</span>`;

        bookHtml += `<div class="book-footer">${footerText}</div>`;
        bookHtml += `</div>`;

        let navHtml = `<div class="book-nav-outer">`;
        navHtml += `<button class="nav-btn" id="prevPageBtn" ${currentPage === 1 ? 'disabled' : ''}>`;
        navHtml += `<span class="arrow">‹</span> Previous`;
        navHtml += `</button>`;
        navHtml += `<div class="page-indicator">Page ${currentPage} of 604</div>`;
        navHtml += `<button class="nav-btn" id="nextPageBtn" ${currentPage === 604 ? 'disabled' : ''}>`;
        navHtml += `Next <span class="arrow">›</span>`;
        navHtml += `</button>`;
        navHtml += `</div>`;

        let goToHtml = `<div class="book-go-to-outer">`;
        goToHtml += `<label for="goToPageInput">Go to page:</label>`;
        goToHtml += `<input type="number" id="goToPageInput" name="goToPageInput" min="1" max="604" value="${currentPage}" />`;
        goToHtml += `<button id="goToPageBtn">Go</button>`;
        goToHtml += `</div>`;

        resultsContainer.innerHTML = bookHtml + navHtml + goToHtml;

        document.getElementById('prevPageBtn').addEventListener('click', function() {
            console.log('🔄 Previous page clicked');
            if (currentPage > 1) goToPage(currentPage - 1);
        });

        document.getElementById('nextPageBtn').addEventListener('click', function() {
            console.log('🔄 Next page clicked');
            if (currentPage < 604) goToPage(currentPage + 1);
        });

        document.getElementById('goToPageBtn').addEventListener('click', function() {
            const input = document.getElementById('goToPageInput');
            let p = parseInt(input.value);
            console.log(`🔄 Go to page input: ${p}`);
            if (p >= 1 && p <= 604) goToPage(p);
        });

        document.getElementById('goToPageInput').addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                console.log('🔄 Enter pressed in go to page input');
                document.getElementById('goToPageBtn').click();
            }
        });

        console.log('📊 Calling fitContentToContainer() after rendering page');
        fitContentToContainer();
    }

    // ============================================================
    // SEARCH VERSE / SURAH
    // ============================================================

    function searchVerse(ref) {
        console.log(`🔍 searchVerse called with ref: "${ref}"`);
        if (!dataLoaded) {
            console.warn('⏳ Data not loaded yet, storing pending ref');
            showError('Data is still loading. Please wait.');
            pendingRef = ref;
            return;
        }
        if (Object.keys(quranData).length === 0) {
            showError('No data loaded. Please check the console for errors.');
            return;
        }

        if (!pagesLoaded) {
            console.warn('⏳ Page map not loaded yet, storing pending ref');
            pendingRef = ref;
            showLoading();
            return;
        }

        const parsed = parseVerseRange(ref);
        if (!parsed) {
            showError('Invalid format. Use "surah" (e.g., "1"), "surah:verse" (e.g., "1:1"), or "surah:start-end" (e.g., "1:1-7").');
            return;
        }

        const { surah, start, end } = parsed;
        const firstKey = surah + ':' + start;
        const page = pageMap[firstKey];
        console.log(`🔍 Searching for "${ref}" → firstKey: ${firstKey}, page: ${page}`);
        if (!page) {
            showError(`No page found for "${firstKey}".`);
            return;
        }

        goToPage(page);
        input.value = ref;
    }

    // ============================================================
    // HELPER FUNCTIONS
    // ============================================================

    function parseVerseRange(ref) {
        ref = ref.trim();
        if (!ref) return null;

        if (/^\d+$/.test(ref)) {
            const surah = parseInt(ref);
            const verses = verseCache[surah] || [];
            if (verses.length === 0) return null;
            return { surah: surah, start: Math.min(...verses), end: Math.max(...verses) };
        }

        const rangeMatch = ref.match(/^(\d+):(\d+)-(\d+)$/);
        if (rangeMatch) {
            return { surah: parseInt(rangeMatch[1]), start: parseInt(rangeMatch[2]), end: parseInt(rangeMatch[3]) };
        }
        const singleMatch = ref.match(/^(\d+):(\d+)$/);
        if (singleMatch) {
            return { surah: parseInt(singleMatch[1]), start: parseInt(singleMatch[2]), end: parseInt(singleMatch[2]) };
        }
        return null;
    }

    function showError(msg) {
        errorText.textContent = msg || 'Verse not found.';
        errorMessage.classList.add('visible');
        resultsContainer.innerHTML = '';
        resultsTitle.style.display = 'none';
    }

    function hideError() {
        errorMessage.classList.remove('visible');
    }

    function showLoading() {
        loadingIndicator.classList.add('visible');
        resultsContainer.innerHTML = '';
        resultsTitle.style.display = 'none';
        hideError();
    }

    function hideLoading() {
        loadingIndicator.classList.remove('visible');
    }

    // ============================================================
    // RANDOM VERSE
    // ============================================================

    function getRandomVerse() {
        if (!dataLoaded || Object.keys(quranData).length === 0) {
            showError('Data is still loading or empty.');
            return;
        }

        const keys = Object.keys(quranData);
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        input.value = randomKey;
        searchVerse(randomKey);
    }

    // ============================================================
    // SURAH SELECTOR, AUTOCOMPLETE & DISPLAY MODE FILTERS
    // ============================================================

    function setupDisplayModeFilters() {
        const buttons = document.querySelectorAll('.mode-btn');
        console.log(`🔧 Setting up display mode filters, found ${buttons.length} buttons`);
        buttons.forEach(btn => {
            btn.addEventListener('click', function() {
                const clickedMode = this.dataset.mode;
                console.log(`🔁 Display mode button clicked: "${clickedMode}"`);

                buttons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                const triggerText = document.querySelector('.custom-select-text');
                const hiddenInput = document.getElementById('surahSelect');
                console.log(`📊 Before reset – triggerText: "${triggerText?.textContent}", hiddenInput: "${hiddenInput?.value}"`);

                console.log(`🔄 Resetting dropdown state for mode switch`);
                if (triggerText) triggerText.textContent = '— Select Surah —';
                if (hiddenInput) hiddenInput.value = '';
                const options = document.querySelectorAll('.custom-select-option');
                options.forEach(o => o.classList.remove('selected'));

                displayMode = clickedMode;
                console.log(`📌 displayMode set to: "${displayMode}"`);

                console.log(`📦 Rebuilding dropdown with new mode...`);
                populateSurahSelector();

                const suggestions = document.getElementById('suggestions');
                if (suggestions) suggestions.style.display = 'none';
                console.log(`✅ Mode switch complete`);
            });
        });
    }

    function populateSurahSelector() {
        const optionsContainer = document.getElementById('surahSelectOptions');
        const triggerText = document.querySelector('.custom-select-text');
        const hiddenInput = document.getElementById('surahSelect');
        const trigger = document.getElementById('surahSelectTrigger');

        console.log(`📦 Populating Surah selector with mode: "${displayMode}"`);

        if (!optionsContainer) {
            console.warn('❌ optionsContainer not found');
            return;
        }

        // Ensure dropdown is closed and hidden
        optionsContainer.classList.remove('open');
        optionsContainer.style.display = 'none';
        if (trigger) trigger.classList.remove('open');

        optionsContainer.innerHTML = '';

        // Default option
        const defaultOption = document.createElement('div');
        defaultOption.className = 'custom-select-option selected';
        defaultOption.dataset.value = '';
        defaultOption.innerHTML = `<span class="option-left"><span class="option-name">— Select Surah —</span></span>`;
        optionsContainer.appendChild(defaultOption);
        console.log(`  Added default option`);

        if (!surahNamesList || surahNamesList.length === 0) {
            console.warn('⚠️ surahNamesList is empty – cannot populate dropdown');
            return;
        }
        console.log(`  Adding ${surahNamesList.length} surahs...`);

        let optionCount = 0;
        surahNamesList.forEach(s => {
            const option = document.createElement('div');
            option.className = 'custom-select-option';
            option.dataset.value = s.id;

            let nameDisplay = '';
            let subDisplay = '';
            if (displayMode === 'translit') {
                nameDisplay = s.translit;
                subDisplay = s.english;
            } else if (displayMode === 'english') {
                nameDisplay = s.meaning;
                subDisplay = s.translit;
            } else {
                nameDisplay = s.arabic;
                subDisplay = s.english;
            }

            option.innerHTML = `
                <span class="option-left">
                    <span class="option-id">${s.id}</span>
                    <span class="option-name">${nameDisplay}</span>
                </span>
                <span class="option-sub">${subDisplay}</span>
            `;
            optionsContainer.appendChild(option);
            optionCount++;
        });

        console.log(`✅ Populated ${optionCount} options`);

        // ---- Click on option ----
        optionsContainer.querySelectorAll('.custom-select-option').forEach(opt => {
            opt.addEventListener('click', function() {
                const value = this.dataset.value;
                const text = this.querySelector('.option-name').textContent;
                console.log(`🖱️ Option clicked: value="${value}", text="${text}"`);
                if (triggerText) triggerText.textContent = text || '— Select Surah —';
                if (hiddenInput) hiddenInput.value = value;
                optionsContainer.querySelectorAll('.custom-select-option').forEach(o => o.classList.remove('selected'));
                this.classList.add('selected');
                optionsContainer.classList.remove('open');
                optionsContainer.style.display = 'none';
                if (trigger) trigger.classList.remove('open');
                if (value) {
                    console.log(`🔍 Searching for surah: ${value}`);
                    searchVerse(value);
                }
            });
        });

        // ---- Toggle dropdown on trigger click ----
        if (trigger) {
            trigger.removeEventListener('click', trigger._listener);
            trigger._listener = function(e) {
                e.stopPropagation();
                const isOpen = optionsContainer.classList.toggle('open');
                this.classList.toggle('open');
                optionsContainer.style.display = isOpen ? 'block' : 'none';
                console.log('Dropdown toggled:', isOpen ? 'OPEN' : 'CLOSED');
            };
            trigger.addEventListener('click', trigger._listener);
        }

        // ---- Close dropdown on outside click ----
        if (window._outsideClickListener) {
            document.removeEventListener('click', window._outsideClickListener);
        }
        window._outsideClickListener = function(e) {
            const wrapper = document.querySelector('.custom-select');
            if (wrapper && !wrapper.contains(e.target)) {
                const options = document.getElementById('surahSelectOptions');
                const trigger = document.getElementById('surahSelectTrigger');
                if (options) {
                    options.classList.remove('open');
                    options.style.display = 'none';
                }
                if (trigger) trigger.classList.remove('open');
                console.log('Dropdown closed (outside click)');
            }
        };
        document.addEventListener('click', window._outsideClickListener);
    }

    function setupAutocomplete() {
        const input = document.getElementById('verseInput');
        const suggestions = document.getElementById('suggestions');
        if (!input || !suggestions) return;

        input.addEventListener('input', function() {
            const query = this.value.trim().toLowerCase();
            if (query.length < 1) {
                suggestions.style.display = 'none';
                return;
            }

            let matches = surahNamesList.filter(s => {
                const translitMatch = s.translit && s.translit.toLowerCase().includes(query);
                const englishMatch = s.english && s.english.toLowerCase().includes(query);
                const meaningMatch = s.meaning && s.meaning.toLowerCase().includes(query);
                const arabicMatch = s.arabic && s.arabic.includes(query);
                const idMatch = s.id.toString() === query;
                return translitMatch || englishMatch || meaningMatch || arabicMatch || idMatch;
            });

            if (matches.length === 0) {
                suggestions.style.display = 'none';
                return;
            }

            let html = '';
            matches.slice(0, 8).forEach(s => {
                let nameDisplay = '';
                let subDisplay = '';
                if (displayMode === 'translit') {
                    nameDisplay = s.translit;
                    subDisplay = s.arabic;
                } else if (displayMode === 'english') {
                    nameDisplay = s.english + (s.meaning ? ` (${s.meaning})` : '');
                    subDisplay = s.translit;
                } else {
                    nameDisplay = s.arabic;
                    subDisplay = s.translit;
                }
                html += `<div class="suggestion-item" data-ref="${s.id}">
                    <span class="suggestion-num">${s.id}</span>
                    <span class="suggestion-name">${nameDisplay}</span>
                    <span class="suggestion-eng">${subDisplay}</span>
                </div>`;
            });

            suggestions.innerHTML = html;
            suggestions.style.display = 'block';

            suggestions.querySelectorAll('.suggestion-item').forEach(el => {
                el.addEventListener('click', function() {
                    const ref = this.dataset.ref;
                    input.value = ref;
                    suggestions.style.display = 'none';
                    searchVerse(ref);
                });
            });
        });

        input.addEventListener('blur', function() {
            setTimeout(() => { suggestions.style.display = 'none'; }, 200);
        });
    }

    function setupQuickNav() {
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const type = this.dataset.type;
                const value = this.dataset.value;
                if (type === 'surah') {
                    searchVerse(value);
                }
            });
        });
    }

    // ============================================================
    // QUICK ACCESS BUTTONS (Event Delegation)
    // ============================================================

    function setupQuickAccess() {
        const grid = document.querySelector('.examples-grid');
        if (!grid) return;
        grid.addEventListener('click', function(e) {
            const btn = e.target.closest('.example-btn');
            if (btn) {
                const ref = btn.getAttribute('data-ref');
                if (ref) {
                    console.log(`🔍 Quick Access clicked: "${ref}"`);
                    const input = document.getElementById('verseInput');
                    if (input) input.value = ref;
                    searchVerse(ref);
                }
            }
        });
    }

    // ============================================================
    // PHONETICS TOOLTIP – Hover Popup
    // ============================================================

    function setupPhoneticsTooltip() {
        const tooltip = document.getElementById('phoneticsTooltip');
        if (!tooltip) {
            console.warn('⚠️ Tooltip element not found');
            return;
        }

        console.log('✅ Phonetics tooltip setup starting...');

        const symbolSpan = document.getElementById('tooltipSymbol');
        const englishSpan = document.getElementById('tooltipEnglish');
        const arabicSpan = document.getElementById('tooltipArabic');
        const descSpan = document.getElementById('tooltipDescription');
        const examplesSpan = document.getElementById('tooltipExamples');

        const items = document.querySelectorAll('.ref-grid .item, .ref-section .item');
        console.log(`📄 Found ${items.length} legend items`);

        let activeItem = null;

        items.forEach(item => {
            // Set data-symbol from the .symbol child
            const symbolEl = item.querySelector('.symbol');
            if (symbolEl) {
                const symbol = symbolEl.textContent.trim();
                item.dataset.symbol = symbol;
            }

            // ---- Mouse enter ----
            item.addEventListener('mouseenter', function(e) {
                const symbol = this.dataset.symbol;
                if (!symbol) return;

                const data = phoneticsData[symbol];
                if (!data) {
                    console.warn(`⚠️ No data for symbol: "${symbol}"`);
                    return;
                }

                // Populate tooltip
                symbolSpan.textContent = symbol;
                englishSpan.textContent = data.english || '—';
                arabicSpan.textContent = data.arabic || '—';
                descSpan.textContent = data.description || '—';
                examplesSpan.textContent = data.examples ? data.examples.join(' · ') : '—';

                // Show tooltip
                tooltip.style.display = 'block';
                activeItem = this;
                positionTooltip(e.clientX, e.clientY);
            });

            // ---- Mouse move ----
            item.addEventListener('mousemove', function(e) {
                if (tooltip.style.display === 'block') {
                    positionTooltip(e.clientX, e.clientY);
                }
            });

            // ---- Mouse leave ----
            item.addEventListener('mouseleave', function() {
                tooltip.style.display = 'none';
                activeItem = null;
            });
        });

        function positionTooltip(x, y) {
            const offsetX = 15;
            const offsetY = 15;

            // Get tooltip dimensions
            const tooltipWidth = tooltip.offsetWidth || 280;
            const tooltipHeight = tooltip.offsetHeight || 200;

            let left = x + offsetX;
            let top = y + offsetY;

            // Keep within viewport
            if (left + tooltipWidth > window.innerWidth - 10) {
                left = x - tooltipWidth - offsetX;
            }
            if (top + tooltipHeight > window.innerHeight - 10) {
                top = y - tooltipHeight - offsetY;
            }
            if (left < 10) left = 10;
            if (top < 10) top = 10;

            tooltip.style.left = Math.round(left) + 'px';
            tooltip.style.top = Math.round(top) + 'px';
        }

        console.log('✅ Phonetics tooltip initialized');
    }

    // ============================================================
    // EVENTS
    // ============================================================

    goBtn.addEventListener('click', function() {
        const ref = input.value.trim();
        if (ref) searchVerse(ref);
        else showError('Please enter a verse reference.');
    });

    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') goBtn.click();
    });

    randomBtn.addEventListener('click', getRandomVerse);

    // ============================================================
    // START
    // ============================================================

    setupQuickAccess();
    setupQuickNav();

    loadQuranBook();

})();