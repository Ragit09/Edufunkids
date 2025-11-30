import { auth, db } from '../js/firebaseConfig.js';
import { 
    doc, 
    getDoc,
    updateDoc,
    arrayUnion,
    increment,
    setDoc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// Global variables
let currentMaterial = null;
let currentLevel = 1;
let currentStep = 0;
let totalSteps = 7;
let userData = null;
let materialsData = {};
let currentQuizAnswers = [];
let soundVolume = 0.7;
let pointsEarned = 0;

// Inisialisasi ketika DOM selesai dimuat
document.addEventListener('DOMContentLoaded', function() {
    console.log('📚 Learning Materials page loaded!');
    
    initLearningPage();
});

// Fungsi utama untuk inisialisasi halaman belajar
async function initLearningPage() {
    hideLoadingSpinner();
    await checkAuthentication();
    await loadUserData();
    await loadMaterialsData();
    
    // Check if material parameter is provided in URL
    const urlParams = new URLSearchParams(window.location.search);
    const materialParam = urlParams.get('material');
    
    if (materialParam && materialsData[materialParam]) {
        // Directly go to level selection for the specified material
        selectMaterial(materialParam);
    } else {
        initMaterialSelection();
    }
    
    initEventListeners();
    
    console.log('✅ Learning page initialized successfully');
}

// Fungsi untuk menyembunyikan loading spinner
function hideLoadingSpinner() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        setTimeout(() => {
            spinner.classList.add('fade-out');
            setTimeout(() => {
                spinner.style.display = 'none';
            }, 500);
        }, 1000);
    }
}

// Fungsi untuk cek autentikasi
async function checkAuthentication() {
    return new Promise((resolve) => {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                console.log('✅ User authenticated:', user.email);
                resolve(user);
            } else {
                console.log('❌ User not authenticated, redirecting...');
                window.location.href = 'login.html';
            }
        });
    });
}

// Fungsi untuk load data user
async function loadUserData() {
    try {
        const user = auth.currentUser;
        if (user) {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                userData = userDoc.data();
                console.log('✅ User data loaded:', userData);
                console.log('📊 Completed levels:', userData.completedLevels);
                console.log('🔓 Unlocked levels:', userData.unlockedLevels);
                
                // Update unlocked levels based on completed levels
                await updateUnlockedLevelsFromCompleted();
            } else {
                console.log('❌ No user data found, creating new user data...');
                // Initialize user data if doesn't exist
                await initializeUserData(user);
            }
        }
    } catch (error) {
        console.error('❌ Error loading user data:', error);
    }
}

// Fungsi untuk inisialisasi data user baru
async function initializeUserData(user) {
    try {
        const initialUserData = {
            childName: user.displayName || 'Anak Cerdas',
            email: user.email,
            points: 0,
            completedLevels: [],
            unlockedLevels: {
                huruf: [1],
                angka: [1],
                warna: [1],
                hijaiyah: [1]
            },
            progress: {},
            achievements: [],
            avatar: '👦',
            lastCompleted: null,
            createdAt: new Date()
        };
        
        await setDoc(doc(db, "users", user.uid), initialUserData);
        userData = initialUserData;
        console.log('✅ New user data initialized');
    } catch (error) {
        console.error('❌ Error initializing user data:', error);
    }
}

// Fungsi untuk update unlocked levels berdasarkan completed levels
async function updateUnlockedLevelsFromCompleted() {
    try {
        const user = auth.currentUser;
        if (!user || !userData) return;

        const unlockedLevels = {
            huruf: [1],
            angka: [1],
            warna: [1],
            hijaiyah: [1]
        };

        // Update unlocked levels based on completed levels
        if (userData.completedLevels) {
            userData.completedLevels.forEach(levelKey => {
                const [category, , level] = levelKey.split('_');
                const levelNum = parseInt(level);
                const nextLevel = levelNum + 1;
                
                if (unlockedLevels[category] && !unlockedLevels[category].includes(nextLevel)) {
                    unlockedLevels[category].push(nextLevel);
                }
            });
        }

        // Update user data
        userData.unlockedLevels = unlockedLevels;
        
        // Update in Firestore
        await updateDoc(doc(db, "users", user.uid), {
            unlockedLevels: unlockedLevels
        });

        console.log('✅ Unlocked levels updated:', unlockedLevels);
    } catch (error) {
        console.error('❌ Error updating unlocked levels:', error);
    }
}

// Fungsi untuk load data materi dengan level dan konten visual
async function loadMaterialsData() {
    materialsData = {
        huruf: {
            title: 'Huruf ABC',
            description: 'Belajar mengenal huruf A sampai Z',
            icon: 'bi-fonts',
            color: 'primary',
            category: 'huruf',
            levels: [
                {
                    number: 1,
                    title: 'Level 1: Huruf A-I',
                    description: 'Belajar huruf A sampai I',
                    unlocked: true,
                    completed: false,
                    steps: 3,
                    quizzes: 1
                },
                {
                    number: 2,
                    title: 'Level 2: Huruf J-R',
                    description: 'Belajar huruf J sampai R',
                    unlocked: false,
                    completed: false,
                    steps: 3,
                    quizzes: 1
                },
                {
                    number: 3,
                    title: 'Level 3: Huruf S-Z',
                    description: 'Belajar huruf S sampai Z',
                    unlocked: false,
                    completed: false,
                    steps: 3,
                    quizzes: 1
                }
            ],
            steps: {
                1: [
                    {
                        title: 'Huruf A, B, C',
                        type: 'letter',
                        content: 'Mari belajar tiga huruf pertama: A, B, dan C!',
                        visual: '🅰️🅱️🅲️',
                        items: [
                            { char: 'A', example: '🍎 Apel', sound: 'A' },
                            { char: 'B', example: '🎈 Balon', sound: 'B' },
                            { char: 'C', example: '🪱 Cacing ', sound: 'C' }
                        ]
                    },
                    {
                        title: 'Huruf D, E, F',
                        type: 'letter',
                        content: 'Sekarang belajar huruf D, E, dan F!',
                        visual: '🅳🅴🅵',
                        items: [
                            { char: 'D', example: '🐑 Domba', sound: 'D' },
                            { char: 'E', example: '🦅 Elang', sound: 'E' },
                            { char: 'F', example: '🐟 Ikan', sound: 'F' }
                        ]
                    },
                    {
                        title: 'Huruf G, H, I',
                        type: 'letter',
                        content: 'Mari lanjutkan dengan huruf G, H, dan I!',
                        visual: '🅶🅷🅸',
                        items: [
                            { char: 'G', example: '🐘 Gajah', sound: 'G' },
                            { char: 'H', example: '🐅 Harimau', sound: 'H' },
                            { char: 'I', example: '🐠 Ikan', sound: 'I' }
                        ]
                    },
                    {
                        title: 'Kuis Huruf Level 1',
                        type: 'quiz',
                        content: 'Ayo uji pengetahuanmu tentang huruf A-I!',
                        questions: [
                            {
                                question: 'Huruf apakah ini? 🍎',
                                options: ['A', 'B', 'C', 'D'],
                                correct: 0,
                                explanation: 'Benar! 🍎 adalah Apel yang dimulai dengan huruf A'
                            },
                            {
                                question: 'Huruf pertama dari kata "Ikan"?',
                                options: ['F', 'I', 'K', 'A'],
                                correct: 1,
                                explanation: 'Benar! Ikan dimulai dengan huruf I'
                            },
                            {
                                question: 'Huruf manakah untuk gambar ini? 🪱',
                                options: ['B', 'C', 'D', 'E'],
                                correct: 1,
                                explanation: 'Benar! 🪱 adalah Cacing yang dimulai dengan huruf C'
                            }
                        ]
                    }
                ],
                2: [
                    {
                        title: 'Huruf J, K, L',
                        type: 'letter',
                        content: 'Mari belajar huruf J, K, dan L!',
                        visual: '🅹🅺🅻',
                        items: [
                            { char: 'J', example: '🧃 Jus', sound: 'J' },
                            { char: 'K', example: '🔑 Kunci', sound: 'K' },
                            { char: 'L', example: '🐬 Lumba-Lumba', sound: 'L' }
                        ]
                    },
                    {
                        title: 'Huruf M, N, O',
                        type: 'letter',
                        content: 'Sekarang belajar huruf M, N, dan O!',
                        visual: '🅼🅽🅾',
                        items: [
                            { char: 'M', example: '🕊️ Merpati', sound: 'M' },
                            { char: 'N', example: '🐉 Naga', sound: 'N' },
                            { char: 'O', example: '🧠 Otak', sound: 'O' }
                        ]
                    },
                    {
                        title: 'Huruf P, Q, R',
                        type: 'letter',
                        content: 'Mari lanjutkan dengan huruf P, Q, dan R!',
                        visual: '🅿️🆀🆁',
                        items: [
                            { char: 'P', example: '🐧 Penguin', sound: 'P' },
                            { char: 'Q', example: '📖 Qur-an ', sound: 'Q' },
                            { char: 'R', example: '🍞 Roti', sound: 'R' }
                        ]
                    },
                    {
                        title: 'Kuis Huruf Level 2',
                        type: 'quiz',
                        content: 'Ayo uji pengetahuanmu tentang huruf J-R!',
                        questions: [
                            {
                                question: 'Huruf pertama dari kata "Kunci"?',
                                options: ['K', 'J', 'L', 'M'],
                                correct: 0,
                                explanation: 'Benar! Kunci dimulai dengan huruf K'
                            },
                            {
                                question: 'Huruf apakah ini? 🐧',
                                options: ['P', 'Q', 'R', 'S'],
                                correct: 0,
                                explanation: 'Benar! Penguin dimulai dengan huruf P'
                            },
                            {
                                question: 'Huruf pertama dari kata "Ratu"?',
                                options: ['R', 'Q', 'P', 'O'],
                                correct: 0,
                                explanation: 'Benar! Ratu dimulai dengan huruf R'
                            }
                        ]
                    }
                ],
                3: [
                    {
                        title: 'Huruf S, T, U',
                        type: 'letter',
                        content: 'Mari belajar huruf S, T, dan U!',
                        visual: '🆂🆃🆄',
                        items: [
                            { char: 'S', example: '🚲 Sepeda', sound: 'S' },
                            { char: 'T', example: '🎒 Tas', sound: 'T' },
                            { char: 'U', example: '💵 Uang', sound: 'U' }
                        ]
                    },
                    {
                        title: 'Huruf V, W, X',
                        type: 'letter',
                        content: 'Sekarang belajar huruf V, W, dan X!',
                        visual: '🆅🆆🆇',
                        items: [
                            { char: 'V', example: '💊 Vitamin', sound: 'V' },
                            { char: 'W', example: '🛜 Wifi', sound: 'W' },
                            { char: 'X', example: '🩻 x-ray', sound: 'X' }
                        ]
                    },
                    {
                        title: 'Huruf Y, Z',
                        type: 'letter',
                        content: 'Mari selesaikan dengan huruf Y dan Z!',
                        visual: '🆈🆉',
                        items: [
                            { char: 'Y', example: '🪀 Yoyo', sound: 'Y' },
                            { char: 'Z', example: '🦓 Zebra', sound: 'Z' }
                        ]
                    },
                    {
                        title: 'Kuis Huruf Level 3',
                        type: 'quiz',
                        content: 'Ayo uji pengetahuanmu tentang huruf S-Z!',
                        questions: [
                            {
                                question: 'Huruf pertama dari kata "Zebra"?',
                                options: ['Z', 'Y', 'X', 'W'],
                                correct: 0,
                                explanation: 'Benar! Zebra dimulai dengan huruf Z'
                            },
                            {
                                question: 'Huruf apakah ini? 🎒',
                                options: ['V', 'S', 'U', 'T'],
                                correct: 3,
                                explanation: 'Benar! Tas dimulai dengan huruf 🎒'
                            },
                            {
                                question: 'Huruf pertama dari kata "Vitamin"?',
                                options: ['W', 'V', 'X', 'Y'],
                                correct: 1,
                                explanation: 'Benar! 💊 dimulai dengan huruf V'
                            }
                        ]
                    }
                ]
            }
        },
        angka: {
            title: 'Angka 1-20',
            description: 'Mengenal angka dan berhitung dasar',
            icon: 'bi-123',
            color: 'success',
            category: 'angka',
            levels: [
                {
                    number: 1,
                    title: 'Level 1: Angka 1-5',
                    description: 'Belajar angka 1 sampai 5',
                    unlocked: true,
                    completed: false,
                    steps: 3,
                    quizzes: 1
                },
                {
                    number: 2,
                    title: 'Level 2: Angka 6-10',
                    description: 'Belajar angka 6 sampai 10',
                    unlocked: false,
                    completed: false,
                    steps: 3,
                    quizzes: 1
                },
                {
                    number: 3,
                    title: 'Level 3: Angka 11-15',
                    description: 'Belajar angka 11 sampai 15',
                    unlocked: false,
                    completed: false,
                    steps: 3,
                    quizzes: 1
                },
                {
                    number: 4,
                    title: 'Level 4: Angka 16-20',
                    description: 'Belajar angka 16 sampai 20',
                    unlocked: false,
                    completed: false,
                    steps: 3,
                    quizzes: 1
                }
            ],
            steps: {
                1: [
                    {
                        title: 'Angka 1 dan 2',
                        type: 'number',
                        content: 'Mari belajar angka 1 dan 2!',
                        visual: '1️⃣2️⃣',
                        items: [
                            { number: 1, example: '🍎 Satu Apel', sound: 'Satu' },
                            { number: 2, example: '👦👧 Dua Anak', sound: 'Dua' }
                        ]
                    },
                    {
                        title: 'Angka 3 dan 4',
                        type: 'number',
                        content: 'Sekarang belajar angka 3 dan 4!',
                        visual: '3️⃣4️⃣',
                        items: [
                            { number: 3, example: '😸😾😼 Tiga Kucing', sound: 'Tiga' },
                            { number: 4, example: '🚗🚗🚗🚗 Empat Mobil', sound: 'Empat' }
                        ]
                    },
                    {
                        title: 'Angka 5',
                        type: 'number',
                        content: 'Mari belajar angka 5!',
                        visual: '5️⃣',
                        items: [
                            { number: 5, example: '✋ Lima Jari', sound: 'Lima' }
                        ]
                    },
                    {
                        title: 'Kuis Angka Level 1',
                        type: 'quiz',
                        content: 'Ayo uji pengetahuanmu tentang angka 1-5!',
                        questions: [
                            {
                                question: 'Berapa jumlah apel ini? 🍎🍎',
                                options: ['1', '2', '3', '4'],
                                correct: 1,
                                explanation: 'Benar! Ada dua apel 🍎🍎'
                            },
                            {
                                question: 'Angka manakah untuk tiga kucing? 😸😾😼',
                                options: ['1', '2', '3', '4'],
                                correct: 2,
                                explanation: 'Benar! Tiga kucing berarti angka 3'
                            },
                            {
                                question: 'Berapa jumlah balon ini? 🎈🎈🎈🎈🎈',
                                options: ['3', '4', '5', '6'],
                                correct: 2,
                                explanation: 'Benar! Ada lima balon 🎈🎈🎈🎈🎈'
                            }
                        ]
                    }
                ],
                2: [
                    {
                        title: 'Angka 6 dan 7',
                        type: 'number',
                        content: 'Mari belajar angka 6 dan 7!',
                        visual: '6️⃣7️⃣',
                        items: [
                            { number: 6, example: '🐛🐛🐛🐛🐛🐛 Enam Ulat', sound: 'Enam' },
                            { number: 7, example: '🌈 Tujuh Warna', sound: 'Tujuh' }
                        ]
                    },
                    {
                        title: 'Angka 8 dan 9',
                        type: 'number',
                        content: 'Sekarang belajar angka 8 dan 9!',
                        visual: '8️⃣9️⃣',
                        items: [
                            { number: 8, example: '🐙🐙🐙🐙🐙🐙🐙🐙 Delapan Gurita', sound: 'Delapan' },
                            { number: 9, example: '⚽⚽⚽⚽⚽⚽⚽⚽⚽ Sembilan Bola', sound: 'Sembilan' }
                        ]
                    },
                    {
                        title: 'Angka 10',
                        type: 'number',
                        content: 'Mari belajar angka 10!',
                        visual: '🔟',
                        items: [
                            { number: 10, example: ' ✋🤚Sepuluh Jari', sound: 'Sepuluh' }
                        ]
                    },
                    {
                        title: 'Kuis Angka Level 2',
                        type: 'quiz',
                        content: 'Ayo uji pengetahuanmu tentang angka 6-10!',
                        questions: [
                            {
                                question: 'Berapa jumlah ulat ini? 🐛🐛🐛🐛🐛🐛',
                                options: ['5', '6', '7', '8'],
                                correct: 1,
                                explanation: 'Benar! Ada enam ulat 🐛🐛🐛🐛🐛🐛'
                            },
                            {
                                question: 'Angka manakah untuk delapan gurita?',
                                options: ['10', '9', '8', '7'],
                                correct: 2,
                                explanation: 'Benar! Delapan gurita berarti angka 8'
                            },
                            {
                                question: 'Berapa jumlah bola ini? ⚽⚽⚽⚽⚽⚽⚽⚽⚽',
                                options: ['8', '9', '10', '11'],
                                correct: 2,
                                explanation: 'Benar! Ada sembilan bola ⚽⚽⚽⚽⚽⚽⚽⚽⚽'
                            }
                        ]
                    }
                ],
                3: [
                    {
                        title: 'Angka 11 dan 12',
                        type: 'number',
                        content: 'Mari belajar angka 11 dan 12!',
                        visual: '1️⃣1️⃣1️⃣2️⃣',
                        items: [
                            { number: 11, example: '⚽⚽⚽⚽⚽⚽⚽⚽⚽⚽⚽ Sebelas Bola', sound: 'Sebelas' },
                            { number: 12, example: '🕛 Dua Belas Jam', sound: 'Dua Belas' }
                        ]
                    },
                    {
                        title: 'Angka 13 dan 14',
                        type: 'number',
                        content: 'Sekarang belajar angka 13 dan 14!',
                        visual: '1️⃣3️⃣1️⃣4️⃣',
                        items: [
                            { number: 13, example: '🍀 Tiga Belas Daun', sound: 'Tiga Belas' },
                            { number: 14, example: '🐦🐦🐦🐦🐦🐦🐦🐦🐦🐦🐦🐦🐦🐦 Empat Belas Burung', sound: 'Empat Belas' }
                        ]
                    },
                    {
                        title: 'Angka 15',
                        type: 'number',
                        content: 'Mari belajar angka 15!',
                        visual: '1️⃣5️⃣',
                        items: [
                            { number: 15, example: '🕒 Tiga Sore', sound: 'Lima Belas' }
                        ]
                    },
                    {
                        title: 'Kuis Angka Level 3',
                        type: 'quiz',
                        content: 'Ayo uji pengetahuanmu tentang angka 11-15!',
                        questions: [
                            {
                                question: 'Berapa jumlah bola ini? ⚽⚽⚽⚽⚽⚽⚽⚽⚽⚽⚽',
                                options: ['10', '11', '12', '13'],
                                correct: 1,
                                explanation: 'Benar! Ada sebelas bola ⚽⚽⚽⚽⚽⚽⚽⚽⚽⚽⚽'
                            },
                            {
                                question: 'Angka manakah untuk tiga belas daun?',
                                options: ['13', '14', '15', '16'],
                                correct: 0,
                                explanation: 'Benar! Tiga belas daun berarti angka 13'
                            },
                            {
                                question: 'Berapa jumlah burung ini? 🐦🐦🐦🐦🐦🐦🐦🐦🐦🐦🐦🐦🐦🐦',
                                options: ['13', '14', '15', '16'],
                                correct: 1,
                                explanation: 'Benar! Ada empat belas burung 🐦🐦🐦🐦🐦🐦🐦🐦🐦🐦🐦🐦🐦🐦'
                            }
                        ]
                    }
                ],
                4: [
                    {
                        title: 'Angka 16 dan 17',
                        type: 'number',
                        content: 'Mari belajar angka 16 dan 17!',
                        visual: '1️⃣6️⃣1️⃣7️⃣',
                        items: [
                            { number: 16, example: '🍬🍬🍬🍬🍬🍬🍬🍬🍬🍬🍬🍬🍬🍬🍬🍬 Enam Belas Permen', sound: 'Enam Belas' },
                            { number: 17, example: '🌟 Tujuh Belas Bintang', sound: 'Tujuh Belas' }
                        ]
                    },
                    {
                        title: 'Angka 18 dan 19',
                        type: 'number',
                        content: 'Sekarang belajar angka 18 dan 19!',
                        visual: '1️⃣8️⃣1️⃣9️⃣',
                        items: [
                            { number: 18, example: '🎂 Delapan Belas Lilin', sound: 'Delapan Belas' },
                            { number: 19, example: '📚 Sembilan Belas Buku', sound: 'Sembilan Belas' }
                        ]
                    },
                    {
                        title: 'Angka 20',
                        type: 'number',
                        content: 'Mari belajar angka 20!',
                        visual: '2️⃣0️⃣',
                        items: [
                            { number: 20, example: '✋🤚✋🤚 Dua Puluh Jari', sound: 'Dua Puluh' }
                        ]
                    },
                    {
                        title: 'Kuis Angka Level 4',
                        type: 'quiz',
                        content: 'Ayo uji pengetahuanmu tentang angka 16-20!',
                        questions: [
                            {
                                question: 'Berapa jumlah permen ini? 🍬🍬🍬🍬🍬🍬🍬🍬🍬🍬🍬🍬🍬🍬🍬🍬',
                                options: ['15', '16', '17', '18'],
                                correct: 1,
                                explanation: 'Benar! Ada enam belas permen 🍬🍬🍬🍬🍬🍬🍬🍬🍬🍬🍬🍬🍬🍬🍬🍬'
                            },
                            {
                                question: 'Angka manakah untuk delapan belas lilin?',
                                options: ['18', '19', '20', '21'],
                                correct: 0,
                                explanation: 'Benar! Delapan belas lilin berarti angka 18'
                            },
                            {
                                question: 'Berapa jumlah buku ini? 📚📚📚📚📚📚📚📚📚📚📚📚📚📚📚📚📚📚📚',
                                options: ['18', '19', '20', '21'],
                                correct: 1,
                                explanation: 'Benar! Ada sembilan belas buku 📚📚📚📚📚📚📚📚📚📚📚📚📚📚📚📚📚📚📚'
                            }
                        ]
                    }
                ]
            }
        },
        warna: {
            title: 'Warna Dasar',
            description: 'Mengenal warna-warna pokok',
            icon: 'bi-palette',
            color: 'warning',
            category: 'warna',
            levels: [
                {
                    number: 1,
                    title: 'Level 1: Warna Primer',
                    description: 'Belajar warna merah, biru, kuning',
                    unlocked: true,
                    completed: false,
                    steps: 3,
                    quizzes: 1
                },
                {
                    number: 2,
                    title: 'Level 2: Warna Sekunder',
                    description: 'Belajar warna hijau, orange, ungu',
                    unlocked: false,
                    completed: false,
                    steps: 3,
                    quizzes: 1
                },
                {
                    number: 3,
                    title: 'Level 3: Warna Lainnya',
                    description: 'Belajar warna hitam, putih, coklat',
                    unlocked: false,
                    completed: false,
                    steps: 3,
                    quizzes: 1
                }
            ],
            steps: {
                1: [
                    {
                        title: 'Warna Merah',
                        type: 'color',
                        content: 'Mari belajar warna MERAH! Warna merah adalah warna yang cerah dan menarik.',
                        visual: '🔴',
                        items: [
                            { 
                                name: 'Merah', 
                                value: '#ff6b6b',
                                examples: [
                                    { image: '🍎', text: 'Apel warnanya merah' },
                                    { image: '🚗', text: 'Mobil merah' },
                                    { image: '🎈', text: 'Balon merah' }
                                ],
                                sound: 'Merah'
                            }
                        ]
                    },
                    {
                        title: 'Warna Biru',
                        type: 'color',
                        content: 'Sekarang belajar warna BIRU! Warna biru adalah warna langit dan laut.',
                        visual: '🔵',
                        items: [
                            { 
                                name: 'Biru', 
                                value: '#339af0',
                                examples: [
                                    { image: '🌊', text: 'Laut warnanya biru' },
                                    { image: '🛜', text: 'Jaringan Wifi' },
                                    { image: '👖', text: 'Celana jeans biru' }
                                ],
                                sound: 'Biru'
                            }
                        ]
                    },
                    {
                        title: 'Warna Kuning',
                        type: 'color',
                        content: 'Mari belajar warna KUNING! Warna kuning adalah warna matahari yang cerah.',
                        visual: '🟡',
                        items: [
                            { 
                                name: 'Kuning', 
                                value: '#fcc419',
                                examples: [
                                    { image: '🌞', text: 'Matahari warnanya kuning' },
                                    { image: '🍌', text: 'Pisang kuning' },
                                    { image: '🐥', text: 'Anak ayam kuning' }
                                ],
                                sound: 'Kuning'
                            }
                        ]
                    },
                    {
                        title: 'Kuis Warna Level 1',
                        type: 'quiz',
                        content: 'Ayo uji pengetahuanmu tentang warna primer!',
                        questions: [
                            {
                                question: 'Warna apakah ini? 🍎',
                                options: ['Merah', 'Biru', 'Kuning', 'Hijau'],
                                correct: 0,
                                explanation: 'Benar! Apel biasanya berwarna merah'
                            },
                            {
                                question: 'Warna matahari adalah?',
                                options: ['Biru', 'Kuning', 'Merah', 'Hijau'],
                                correct: 1,
                                explanation: 'Benar! Matahari berwarna kuning cerah'
                            },
                            {
                                question: 'Warna langit biasanya?',
                                options: ['Merah', 'Kuning', 'Biru', 'Ungu'],
                                correct: 2,
                                explanation: 'Benar! Langit berwarna biru'
                            }
                        ]
                    }
                ],
                2: [
                    {
                        title: 'Warna Hijau',
                        type: 'color',
                        content: 'Mari belajar warna HIJAU! Warna hijau adalah warna alam dan tumbuhan.',
                        visual: '🟢',
                        items: [
                            { 
                                name: 'Hijau', 
                                value: '#51cf66',
                                examples: [
                                    { image: '🌳', text: 'Pohon warnanya hijau' },
                                    { image: '🐸', text: 'Katak hijau' },
                                    { image: '🥦', text: 'Brokoli hijau' }
                                ],
                                sound: 'Hijau'
                            }
                        ]
                    },
                    {
                        title: 'Warna Orange',
                        type: 'color',
                        content: 'Sekarang belajar warna ORANGE! Warna orange adalah warna buah jeruk yang segar.',
                        visual: '🟠',
                        items: [
                            { 
                                name: 'Orange', 
                                value: '#ff922b',
                                examples: [
                                    { image: '🍊', text: 'Jeruk warnanya orange' },
                                    { image: '🎃', text: 'Labu orange' },
                                    { image: '🦊', text: 'Rubah orange' }
                                ],
                                sound: 'Orange'
                            }
                        ]
                    },
                    {
                        title: 'Warna Ungu',
                        type: 'color',
                        content: 'Mari belajar warna UNGU! Warna ungu adalah warna bunga dan buah anggur.',
                        visual: '🟣',
                        items: [
                            { 
                                name: 'Ungu', 
                                value: '#cc5de8',
                                examples: [
                                    { image: '🍇', text: 'Anggur warnanya ungu' },
                                    { image: '🪀', text: 'Yoyo' },
                                    { image: '🦄', text: 'Kuda Poni' }
                                ],
                                sound: 'Ungu'
                            }
                        ]
                    },
                    {
                        title: 'Kuis Warna Level 2',
                        type: 'quiz',
                        content: 'Ayo uji pengetahuanmu tentang warna sekunder!',
                        questions: [
                            {
                                question: 'Warna apakah ini? 🍊',
                                options: ['Orange', 'Hijau', 'Ungu', 'Kuning'],
                                correct: 0,
                                explanation: 'Benar! Jeruk berwarna orange'
                            },
                            {
                                question: 'Warna pohon biasanya?',
                                options: ['Orange', 'Hijau', 'Ungu', 'Merah'],
                                correct: 1,
                                explanation: 'Benar! Pohon berwarna hijau'
                            },
                            {
                                question: 'Warna anggur biasanya?',
                                options: ['Ungu', 'Hijau', 'Orange', 'Biru'],
                                correct: 0,
                                explanation: 'Benar! Anggur berwarna ungu'
                            }
                        ]
                    }
                ],
                3: [
                    {
                        title: 'Warna Hitam',
                        type: 'color',
                        content: 'Mari belajar warna HITAM! Warna hitam adalah warna malam dan kegelapan.',
                        visual: '⚫',
                        items: [
                            { 
                                name: 'Hitam', 
                                value: '#495057',
                                examples: [
                                    { image: '🐈‍⬛', text: 'Kucing hitam' },
                                    { image: '🌑', text: 'Malam hitam' },
                                    { image: '🐜', text: 'Semut' }
                                ],
                                sound: 'Hitam'
                            }
                        ]
                    },
                    {
                        title: 'Warna Putih',
                        type: 'color',
                        content: 'Sekarang belajar warna PUTIH! Warna putih adalah warna salju dan awan.',
                        visual: '⚪',
                        items: [
                            { 
                                name: 'Putih', 
                                value: '#f8f9fa',
                                examples: [
                                    { image: '☁️', text: 'Awan putih' },
                                    { image: '🐑', text: 'Domba putih' },
                                    { image: '📄', text: 'Kertas putih' }
                                ],
                                sound: 'Putih'
                            }
                        ]
                    },
                    {
                        title: 'Warna Coklat',
                        type: 'color',
                        content: 'Mari belajar warna COKLAT! Warna coklat adalah warna tanah dan kayu.',
                        visual: '🟤',
                        items: [
                            { 
                                name: 'Coklat', 
                                value: '#a17f1a',
                                examples: [
                                    { image: '🌰', text: 'Kacang coklat' },
                                    { image: '🐻', text: 'Beruang coklat' },
                                    { image: '🪵', text: 'Kayu coklat' }
                                ],
                                sound: 'Coklat'
                            }
                        ]
                    },
                    {
                        title: 'Kuis Warna Level 3',
                        type: 'quiz',
                        content: 'Ayo uji pengetahuanmu tentang warna lainnya!',
                        questions: [
                            {
                                question: 'Warna apakah ini? 🐈‍⬛',
                                options: ['Cokelat', 'Putih', 'Hitam ', 'Abu-abu'],
                                correct: 2,
                                explanation: 'Benar! Kucing hitam berwarna hitam'
                            },
                            {
                                question: 'Warna awan biasanya?',
                                options: ['Putih', 'Hitam', 'Coklat', 'Biru'],
                                correct: 0,
                                explanation: 'Benar! Awan berwarna putih'
                            },
                            {
                                question: 'Warna beruang biasanya?',
                                options: ['Hitam', 'Cokelat', 'Putih', 'Orange'],
                                correct: 1,
                                explanation: 'Benar! Beruang biasanya berwarna coklat'
                            }
                        ]
                    }
                ]
            }
        },
        hijaiyah: {
            title: 'Huruf Hijaiyah',
            description: 'Belajar membaca huruf Arab',
            icon: 'bi-translate',
            color: 'info',
            category: 'hijaiyah',
            levels: [
                {
                    number: 1,
                    title: 'Level 1: Hijaiyah 1-7',
                    description: 'Belajar huruf Alif sampai Kha',
                    unlocked: true,
                    completed: false,
                    steps: 3,
                    quizzes: 1
                },
                {
                    number: 2,
                    title: 'Level 2: Hijaiyah 8-14',
                    description: 'Belajar huruf Dal sampai Shad',
                    unlocked: false,
                    completed: false,
                    steps: 3,
                    quizzes: 1
                },
                {
                    number: 3,
                    title: 'Level 3: Hijaiyah 15-21',
                    description: 'Belajar huruf Dhad sampai Qaf',
                    unlocked: false,
                    completed: false,
                    steps: 3,
                    quizzes: 1
                }
            ],
            steps: {
                1: [
                    {
                        title: 'Alif, Ba, Ta',
                        type: 'hijaiyah',
                        content: 'Mari belajar tiga huruf hijaiyah pertama!',
                        visual: '📖',
                        items: [
                            { arabic: 'ا', latin: 'Alif', sound: 'Alif' },
                            { arabic: 'ب', latin: 'Ba', sound: 'Ba' },
                            { arabic: 'ت', latin: 'Ta', sound: 'Ta' }
                        ]
                    },
                    {
                        title: 'Tsa, Jim, Ha',
                        type: 'hijaiyah',
                        content: 'Sekarang belajar huruf Tsa, Jim, dan Ha!',
                        visual: '🕌',
                        items: [
                            { arabic: 'ث', latin: 'Tsa', sound: 'Tsa' },
                            { arabic: 'ج', latin: 'Jim', sound: 'Jim' },
                            { arabic: 'ح', latin: 'Ha', sound: 'Ha' }
                        ]
                    },
                    {
                        title: 'Kha',
                        type: 'hijaiyah',
                        content: 'Mari belajar huruf Kha!',
                        visual: '⭐',
                        items: [
                            { arabic: 'خ', latin: 'Kha', sound: 'Kha' }
                        ]
                    },
                    {
                        title: 'Kuis Hijaiyah Level 1',
                        type: 'quiz',
                        content: 'Ayo uji pengetahuanmu tentang huruf hijaiyah!',
                        questions: [
                            {
                                question: 'Huruf apakah ini? ا',
                                options: ['Alif', 'Ba', 'Ta', 'Tsa'],
                                correct: 0,
                                explanation: 'Benar! Ini adalah huruf Alif'
                            },
                            {
                                question: 'Huruf "Ba" ditulis seperti?',
                                options: ['ت', 'ب', 'ث', 'ج'],
                                correct: 1,
                                explanation: 'Benar! Ini adalah huruf Ba'
                            },
                            {
                                question: 'Manakah huruf Jim?',
                                options: ['ح', 'ج', 'خ', 'ت'],
                                correct: 1,
                                explanation: 'Benar! Ini adalah huruf Jim'
                            }
                        ]
                    }
                ],
                2: [
                    {
                        title: 'Dal, Dzal, Ra',
                        type: 'hijaiyah',
                        content: 'Mari belajar huruf Dal, Dzal, dan Ra!',
                        visual: '📖',
                        items: [
                            { arabic: 'د', latin: 'Dal', sound: 'Dal' },
                            { arabic: 'ذ', latin: 'Dzal', sound: 'Dzal' },
                            { arabic: 'ر', latin: 'Ra', sound: 'Ra' }
                        ]
                    },
                    {
                        title: 'Zai, Sin, Syin',
                        type: 'hijaiyah',
                        content: 'Sekarang belajar huruf Zai, Sin, dan Syin!',
                        visual: '🕌',
                        items: [
                            { arabic: 'ز', latin: 'Zai', sound: 'Zai' },
                            { arabic: 'س', latin: 'Sin', sound: 'Sin' },
                            { arabic: 'ش', latin: 'Syin', sound: 'Syin' }
                        ]
                    },
                    {
                        title: 'Shad',
                        type: 'hijaiyah',
                        content: 'Mari belajar huruf Shad!',
                        visual: '⭐',
                        items: [
                            { arabic: 'ص', latin: 'Shad', sound: 'Shad' }
                        ]
                    },
                    {
                        title: 'Kuis Hijaiyah Level 2',
                        type: 'quiz',
                        content: 'Ayo uji pengetahuanmu tentang huruf hijaiyah!',
                        questions: [
                            {
                                question: 'Huruf apakah ini? د',
                                options: ['Dal', 'Dzal', 'Ra', 'Zai'],
                                correct: 0,
                                explanation: 'Benar! Ini adalah huruf Dal'
                            },
                            {
                                question: 'Huruf "Sin" ditulis seperti?',
                                options: ['س', 'ش', 'ص', 'ض'],
                                correct: 0,
                                explanation: 'Benar! Ini adalah huruf Sin'
                            },
                            {
                                question: 'Manakah huruf Syin?',
                                options: ['س', 'ش', 'ص', 'ض'],
                                correct: 1,
                                explanation: 'Benar! Ini adalah huruf Syin'
                            }
                        ]
                    }
                ],
                3: [
                    {
                        title: 'Dhad, Tha, Zha',
                        type: 'hijaiyah',
                        content: 'Mari belajar huruf Dhad, Tha, dan Zha!',
                        visual: '📖',
                        items: [
                            { arabic: 'ض', latin: 'Dhad', sound: 'Dhad' },
                            { arabic: 'ط', latin: 'Tha', sound: 'Tha' },
                            { arabic: 'ظ', latin: 'Zha', sound: 'Zha' }
                        ]
                    },
                    {
                        title: 'Ain, Ghain, Fa',
                        type: 'hijaiyah',
                        content: 'Sekarang belajar huruf Ain, Ghain, dan Fa!',
                        visual: '🕌',
                        items: [
                            { arabic: 'ع', latin: 'Ain', sound: 'Ain' },
                            { arabic: 'غ', latin: 'Ghain', sound: 'Ghain' },
                            { arabic: 'ف', latin: 'Fa', sound: 'Fa' }
                        ]
                    },
                    {
                        title: 'Qaf',
                        type: 'hijaiyah',
                        content: 'Mari belajar huruf Qaf!',
                        visual: '⭐',
                        items: [
                            { arabic: 'ق', latin: 'Qaf', sound: 'Qaf' }
                        ]
                    },
                    {
                        title: 'Kuis Hijaiyah Level 3',
                        type: 'quiz',
                        content: 'Ayo uji pengetahuanmu tentang huruf hijaiyah!',
                        questions: [
                            {
                                question: 'Huruf apakah ini? ض',
                                options: ['Dhad', 'Tha', 'Zha', 'Ain'],
                                correct: 0,
                                explanation: 'Benar! Ini adalah huruf Dhad'
                            },
                            {
                                question: 'Huruf "Fa" ditulis seperti?',
                                options: ['ف', 'ق', 'ك', 'ل'],
                                correct: 0,
                                explanation: 'Benar! Ini adalah huruf Fa'
                            },
                            {
                                question: 'Manakah huruf Ghain?',
                                options: ['ع', 'غ', 'ف', 'ق'],
                                correct: 1,
                                explanation: 'Benar! Ini adalah huruf Ghain'
                            }
                        ]
                    }
                ]
            }
        }
    };

    // Update unlocked status based on user data
    updateMaterialsUnlockedStatus();
}

// Fungsi untuk update status unlocked berdasarkan data user
function updateMaterialsUnlockedStatus() {
    if (!userData || !userData.unlockedLevels) return;

    Object.keys(materialsData).forEach(materialKey => {
        const material = materialsData[materialKey];
        const unlockedLevels = userData.unlockedLevels[material.category] || [];
        
        material.levels.forEach(level => {
            // Update unlocked status
            level.unlocked = unlockedLevels.includes(level.number);
            
            // Update completed status
            const levelKey = `${material.category}_level_${level.number}`;
            level.completed = userData.completedLevels?.includes(levelKey) || false;
        });
    });

    console.log('✅ Materials unlocked status updated');
}

// Fungsi untuk inisialisasi pemilihan materi
function initMaterialSelection() {
    const materialsGrid = document.querySelector('.materials-grid');
    if (!materialsGrid) return;

    materialsGrid.innerHTML = Object.keys(materialsData).map(key => {
        const material = materialsData[key];
        
        // Hitung progress berdasarkan level yang diselesaikan
        let completedLevels = 0;
        if (userData?.completedLevels) {
            completedLevels = material.levels.filter(level => 
                userData.completedLevels.includes(`${material.category}_level_${level.number}`)
            ).length;
        }
        
        const progressPercent = (completedLevels / material.levels.length) * 100;

        return `
            <div class="material-card" onclick="selectMaterial('${key}')">
                <div class="material-icon bg-${material.color}">
                    <i class="bi ${material.icon}"></i>
                </div>
                <h3>${material.title}</h3>
                <p>${material.description}</p>
                <div class="material-meta">
                    <span class="badge bg-light text-dark">
                        <i class="bi bi-layer-forward"></i> ${material.levels.length} Level
                    </span>
                    <span class="badge bg-light text-dark">
                        <i class="bi bi-question-circle"></i> ${material.levels.length} Kuis
                    </span>
                </div>
                <div class="material-progress">
                    <div class="progress-text">Progress: ${completedLevels}/${material.levels.length} Level</div>
                    <div class="progress">
                        <div class="progress-bar bg-${material.color}" style="width: ${progressPercent}%"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Fungsi untuk memilih materi
function selectMaterial(materialKey) {
    currentMaterial = materialsData[materialKey];
    
    // Update UI
    document.getElementById('materialTitle').textContent = currentMaterial.title;
    document.getElementById('levelSelectionTitle').textContent = `Pilih Level - ${currentMaterial.title}`;
    
    // Show level selection section
    showSection('levelSelection');
    
    // Load levels
    loadLevels();
    
    // Play click sound
    playSound('clickSound');
}

// Fungsi untuk load level selection
function loadLevels() {
    const levelsGrid = document.querySelector('.levels-grid');
    if (!levelsGrid || !currentMaterial) return;

    levelsGrid.innerHTML = currentMaterial.levels.map(level => {
        const isUnlocked = level.unlocked;
        const isCompleted = level.completed;
        
        console.log(`Level ${level.number}: unlocked=${isUnlocked}, completed=${isCompleted}`);
        
        return `
            <div class="level-card ${isUnlocked ? '' : 'locked'} ${isCompleted ? 'completed' : ''}" 
                 onclick="${isUnlocked ? `selectLevel(${level.number})` : ''}">
                <div class="level-number">${level.number}</div>
                ${isCompleted ? '<div class="completion-badge"><i class="bi bi-check-circle-fill"></i></div>' : ''}
                <h4>${level.title}</h4>
                <p>${level.description}</p>
                <div class="level-stats">
                    <div class="level-stat">
                        <i class="bi bi-book"></i>
                        <span>${level.steps} Materi</span>
                    </div>
                    <div class="level-stat">
                        <i class="bi bi-question-circle"></i>
                        <span>${level.quizzes} Kuis</span>
                    </div>
                </div>
                ${!isUnlocked ? '<div class="locked-overlay">🔒</div>' : ''}
            </div>
        `;
    }).join('');
}

// Fungsi untuk memilih level
function selectLevel(levelNumber) {
    currentLevel = levelNumber;
    currentStep = 0;
    
    // Update UI
    document.getElementById('currentStep').textContent = '1';
    
    // Calculate total steps for this level
    const steps = currentMaterial.steps[currentLevel];
    totalSteps = steps ? steps.length : 7;
    document.getElementById('totalSteps').textContent = totalSteps.toString();
    
    // Show learning content section
    showSection('learningContent');
    
    // Load first step
    loadStepContent();
    
    // Play click sound
    playSound('clickSound');
}

// Fungsi untuk load konten step
function loadStepContent() {
    const stepContent = document.getElementById('stepContent');
    const steps = currentMaterial.steps[currentLevel];
    
    if (!steps || !steps[currentStep]) {
        console.error('Step not found');
        return;
    }

    const step = steps[currentStep];
    let contentHTML = '';
    
    if (step.type === 'quiz') {
        // Show quiz section for quiz steps
        showSection('quizSection');
        loadQuizContent(step);
        return;
    }
    
    switch(step.type) {
        case 'letter':
            contentHTML = createLetterStep(step);
            break;
        case 'number':
            contentHTML = createNumberStep(step);
            break;
        case 'color':
            contentHTML = createColorStep(step);
            break;
        case 'hijaiyah':
            contentHTML = createHijaiyahStep(step);
            break;
        default:
            contentHTML = createBasicStep(step);
    }
    
    stepContent.innerHTML = contentHTML;
    updateProgressBar();
    updateNavigationButtons();
}

// Fungsi untuk membuat step huruf dengan visual
function createLetterStep(step) {
    return `
        <div class="step-content">
            <h2 class="step-title">${step.title}</h2>
            <div class="step-image">${step.visual}</div>
            <p class="step-description">${step.content}</p>
            
            <div class="instruction-text">
                🔊 Klik setiap huruf untuk mendengar pengucapannya!
            </div>
            
            <div class="interactive-element">
                <div class="letter-grid">
                    ${step.items.map(item => `
                        <div class="letter-item" onclick="playLetterSound('${item.char}', '${item.sound}')">
                            <div class="letter-char">${item.char}</div>
                            <div class="sound-icon">
                                <i class="bi bi-volume-up"></i>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="visual-example">
                <h5>💡 Contoh Penggunaan:</h5>
                ${step.items.map(item => `
                    <div class="example-item">
                        <div class="example-char">${item.char}</div>
                        <div>${item.example}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Fungsi untuk membuat step angka dengan visual
function createNumberStep(step) {
    return `
        <div class="step-content">
            <h2 class="step-title">${step.title}</h2>
            <div class="step-image">${step.visual}</div>
            <p class="step-description">${step.content}</p>
            
            <div class="instruction-text">
                🔊 Klik setiap angka untuk mendengar pengucapannya!
            </div>
            
            <div class="interactive-element">
                <div class="number-grid">
                    ${step.items.map(item => `
                        <div class="number-item" onclick="playNumberSound(${item.number}, '${item.sound}')">
                            <div class="number-char">${item.number}</div>
                            <div class="sound-icon">
                                <i class="bi bi-volume-up"></i>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="visual-example">
                <h5>🎯 Latihan Berhitung:</h5>
                ${step.items.map(item => `
                    <div class="counting-item">
                        <div class="counting-visual">${item.example.split(' ')[0]}</div>
                        <div class="counting-number">${item.number}</div>
                        <div>${item.example}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Fungsi untuk membuat step warna dengan visual
function createColorStep(step) {
    return `
        <div class="step-content">
            <h2 class="step-title">${step.title}</h2>
            <div class="step-image">${step.visual}</div>
            <p class="step-description">${step.content}</p>
            
            <div class="instruction-text">
                🔊 Klik setiap warna untuk mendengar penjelasannya!
            </div>
            
            <div class="interactive-element">
                <div class="color-grid">
                    ${step.items.map(item => `
                        <div class="color-item" 
                             style="background-color: ${item.value};"
                             onclick="playColorSound('${item.name}', '${item.sound}')">
                            ${item.name}
                            <div class="sound-icon">
                                <i class="bi bi-volume-up"></i>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="visual-example">
                <h5>🌈 Contoh Benda Berwarna ${step.items[0].name}:</h5>
                <div class="color-examples-grid">
                    ${step.items[0].examples.map(example => `
                        <div class="color-example-item">
                            <div class="color-example-image">${example.image}</div>
                            <div>${example.text}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

// Fungsi untuk membuat step hijaiyah
function createHijaiyahStep(step) {
    return `
        <div class="step-content">
            <h2 class="step-title">${step.title}</h2>
            <div class="step-image">${step.visual}</div>
            <p class="step-description">${step.content}</p>
            
            <div class="instruction-text">
                🔊 Klik setiap huruf untuk mendengar pengucapannya!
            </div>
            
            <div class="interactive-element">
                <div class="hijaiyah-grid">
                    ${step.items.map(item => `
                        <div class="hijaiyah-item" onclick="playHijaiyahSound('${item.arabic}', '${item.latin}', '${item.sound}')">
                            <div class="arabic">${item.arabic}</div>
                            <div class="sound-icon">
                                <i class="bi bi-volume-up"></i>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="visual-example">
                <h5>📚 Huruf Hijaiyah:</h5>
                ${step.items.map(item => `
                    <div class="hijaiyah-example-item">
                        <div class="hijaiyah-char">${item.arabic}</div>
                        <div class="hijaiyah-latin">${item.latin}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Fungsi untuk membuat step basic
function createBasicStep(step) {
    return `
        <div class="step-content">
            <h2 class="step-title">${step.title}</h2>
            <div class="step-image">${step.visual}</div>
            <p class="step-description">${step.content}</p>
        </div>
    `;
}

// Fungsi untuk load konten kuis
function loadQuizContent(quizStep) {
    const quizContent = document.getElementById('quizContent');
    currentQuizAnswers = [];
    
    quizContent.innerHTML = `
        <div class="step-content">
            <h2 class="step-title">${quizStep.title}</h2>
            <div class="step-image">❓</div>
            <p class="step-description">${quizStep.content}</p>
            
            <div class="instruction-text">
                🎯 Pilih jawaban yang benar untuk setiap pertanyaan!
            </div>
            
            ${quizStep.questions.map((question, index) => `
                <div class="quiz-question" id="question-${index}">
                    <h5>${index + 1}. ${question.question}</h5>
                    <div class="quiz-options">
                        ${question.options.map((option, optIndex) => `
                            <div class="quiz-option" 
                                 onclick="selectQuizAnswer(${index}, ${optIndex})"
                                 data-question="${index}" 
                                 data-answer="${optIndex}">
                                ${option}
                            </div>
                        `).join('')}
                    </div>
                    <div class="quiz-feedback" id="feedback-${index}" style="display: none;"></div>
                </div>
            `).join('')}
        </div>
    `;
}

// Fungsi untuk memilih jawaban kuis
function selectQuizAnswer(questionIndex, answerIndex) {
    const options = document.querySelectorAll(`#question-${questionIndex} .quiz-option`);
    
    // Reset all options for this question
    options.forEach(option => {
        option.classList.remove('selected');
    });
    
    // Select the clicked option
    options[answerIndex].classList.add('selected');
    
    // Store the answer
    currentQuizAnswers[questionIndex] = answerIndex;
    
    // Play click sound
    playSound('clickSound');
}

// Fungsi untuk submit kuis
async function submitQuiz() {
    const quizStep = currentMaterial.steps[currentLevel][currentStep];
    let correctAnswers = 0;
    let totalQuestions = quizStep.questions.length;
    
    quizStep.questions.forEach((question, index) => {
        const userAnswer = currentQuizAnswers[index];
        const feedback = document.getElementById(`feedback-${index}`);
        const options = document.querySelectorAll(`#question-${index} .quiz-option`);
        
        // Reset options
        options.forEach(option => {
            option.classList.remove('correct', 'incorrect');
        });
        
        if (userAnswer === undefined) {
            // No answer selected
            feedback.innerHTML = '<span style="color: orange;">⚠️ Pilih jawaban dulu!</span>';
            feedback.style.display = 'block';
        } else if (userAnswer === question.correct) {
            // Correct answer
            options[userAnswer].classList.add('correct');
            feedback.innerHTML = `<span style="color: green;">✅ Benar! ${question.explanation}</span>`;
            feedback.style.display = 'block';
            feedback.classList.add('correct');
            correctAnswers++;
        } else {
            // Wrong answer
            options[userAnswer].classList.add('incorrect');
            options[question.correct].classList.add('correct');
            feedback.innerHTML = `<span style="color: red;">❌ Salah. ${question.explanation}</span>`;
            feedback.style.display = 'block';
            feedback.classList.add('incorrect');
        }
    });
    
    // Calculate points based on correct answers (5 points per correct answer)
    pointsEarned = correctAnswers * 5;
    
    // Always proceed to completion screen after quiz
    playSound('correctSound');
    setTimeout(() => {
        completeLevel();
    }, 1500);
}

// Fungsi untuk navigasi step
function nextStep() {
    const steps = currentMaterial.steps[currentLevel];
    
    if (currentStep < steps.length - 1) {
        currentStep++;
        document.getElementById('currentStep').textContent = (currentStep + 1).toString();
        
        if (steps[currentStep].type === 'quiz') {
            showSection('quizSection');
            loadQuizContent(steps[currentStep]);
        } else {
            showSection('learningContent');
            loadStepContent();
        }
        
        playSound('clickSound');
    } else {
        // Level completed
        completeLevel();
    }
}

function previousStep() {
    if (currentStep > 0) {
        currentStep--;
        document.getElementById('currentStep').textContent = (currentStep + 1).toString();
        showSection('learningContent');
        loadStepContent();
        playSound('clickSound');
    }
}

// Fungsi untuk menyelesaikan level
async function completeLevel() {
    try {
        const user = auth.currentUser;
        if (user && currentMaterial) {
            const progressKey = `${currentMaterial.category}_level_${currentLevel}`;
            
            // Check if level already completed
            const isAlreadyCompleted = userData?.completedLevels?.includes(progressKey);
            
            if (!isAlreadyCompleted) {
                console.log(`🎉 Completing level: ${progressKey}`);
                
                // Update progress di Firestore
                const updateData = {
                    [`progress.${progressKey}`]: true,
                    points: increment(pointsEarned),
                    completedLevels: arrayUnion(progressKey),
                    lastCompleted: new Date()
                };
                
                // Unlock next level if exists
                const nextLevel = currentLevel + 1;
                if (currentMaterial.levels[nextLevel - 1]) {
                    const nextLevelKey = `${currentMaterial.category}_level_${nextLevel}`;
                    console.log(`🔓 Unlocking next level: ${nextLevelKey}`);
                    
                    // Add to unlocked levels
                    if (!userData.unlockedLevels) {
                        userData.unlockedLevels = {};
                    }
                    if (!userData.unlockedLevels[currentMaterial.category]) {
                        userData.unlockedLevels[currentMaterial.category] = [];
                    }
                    
                    if (!userData.unlockedLevels[currentMaterial.category].includes(nextLevel)) {
                        userData.unlockedLevels[currentMaterial.category].push(nextLevel);
                        updateData[`unlockedLevels.${currentMaterial.category}`] = arrayUnion(nextLevel);
                    }
                    
                    // Update local data
                    currentMaterial.levels[nextLevel - 1].unlocked = true;
                }
                
                await updateDoc(doc(db, "users", user.uid), updateData);
                
                // Update local user data
                if (!userData.completedLevels) userData.completedLevels = [];
                if (!userData.completedLevels.includes(progressKey)) {
                    userData.completedLevels.push(progressKey);
                }
                
                userData.points = (userData.points || 0) + pointsEarned;
                
                console.log('✅ Level completed successfully');
                console.log('📊 Updated completed levels:', userData.completedLevels);
                console.log('🔓 Updated unlocked levels:', userData.unlockedLevels);
            } else {
                console.log('ℹ️ Level already completed');
            }
            
            // Show completion screen
            showCompletionScreen();
            playSound('completionSound');
        }
    } catch (error) {
        console.error('❌ Error completing level:', error);
        showNotification('Gagal menyimpan progress. Silakan coba lagi.', 'error');
    }
}

// Fungsi untuk update progress bar
function updateProgressBar() {
    const steps = currentMaterial.steps[currentLevel];
    const progressPercent = ((currentStep + 1) / steps.length) * 100;
    document.getElementById('learningProgress').style.width = `${progressPercent}%`;
}

// Fungsi untuk update tombol navigasi
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const completeBtn = document.getElementById('completeBtn');
    
    prevBtn.disabled = currentStep === 0;
    
    const steps = currentMaterial.steps[currentLevel];
    if (currentStep === steps.length - 1) {
        nextBtn.style.display = 'none';
        completeBtn.style.display = 'block';
    } else {
        nextBtn.style.display = 'block';
        completeBtn.style.display = 'none';
    }
}

// Fungsi untuk menyelesaikan materi
async function completeMaterial() {
    await completeLevel();
}

// Fungsi untuk menampilkan layar penyelesaian
function showCompletionScreen() {
    const message = pointsEarned === 15 
        ? `Kamu telah menyelesaikan Level ${currentLevel} materi "${currentMaterial.title}" dengan sempurna!` 
        : `Kamu telah menyelesaikan Level ${currentLevel} materi "${currentMaterial.title}" dengan baik!`;
    
    // Check if next level is unlocked
    const nextLevel = currentLevel + 1;
    const hasNextLevel = currentMaterial.levels[nextLevel - 1];
    const isNextLevelUnlocked = hasNextLevel && currentMaterial.levels[nextLevel - 1].unlocked;
    
    document.getElementById('completionMessage').textContent = message;
    document.getElementById('pointsEarned').textContent = `+${pointsEarned} Poin`;
    
    // Show next level unlocked message if applicable
    const nextLevelUnlockedElement = document.getElementById('nextLevelUnlocked');
    const continueNextLevelBtn = document.getElementById('continueNextLevelBtn');
    
    if (isNextLevelUnlocked) {
        nextLevelUnlockedElement.style.display = 'block';
        continueNextLevelBtn.style.display = 'block';
        document.getElementById('nextLevelNumber').textContent = nextLevel;
        console.log(`🎊 Next level ${nextLevel} is unlocked!`);
    } else {
        nextLevelUnlockedElement.style.display = 'none';
        continueNextLevelBtn.style.display = 'none';
    }
    
    showSection('completionScreen');
}

// Fungsi untuk melanjutkan ke level berikutnya
function continueToNextLevel() {
    const nextLevel = currentLevel + 1;
    if (currentMaterial.levels[nextLevel - 1] && currentMaterial.levels[nextLevel - 1].unlocked) {
        console.log(`➡️ Continuing to level ${nextLevel}`);
        selectLevel(nextLevel);
    } else {
        console.log('❌ Next level is not unlocked yet');
        showNotification('Level berikutnya belum terbuka.', 'warning');
    }
}

// Fungsi untuk memilih materi baru
function selectNewMaterial() {
    playSound('clickSound');
    showSection('materialSelection');
    initMaterialSelection();
}

// Fungsi untuk kembali ke dashboard
function goBackToDashboard() {
    playSound('clickSound');
    setTimeout(() => {
        window.location.href = 'dashboard.html#materi';
    }, 500);
}

// Fungsi untuk menampilkan section
function showSection(sectionId) {
    document.querySelectorAll('.material-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
}

// Fungsi untuk memainkan sound effect
function playSound(soundId) {
    const sound = document.getElementById(soundId);
    if (sound) {
        sound.volume = soundVolume;
        sound.currentTime = 0;
        
        const playPromise = sound.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log('Sound play failed:', error);
            });
        }
    }
}

// Fungsi untuk suara huruf dengan text-to-speech perempuan
function playLetterSound(letter, text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.rate = 0.8;
    utterance.pitch = 1.2;
    
    // Try to use female voice
    const voices = speechSynthesis.getVoices();
    const femaleVoice = voices.find(voice => 
        voice.lang.includes('id') && voice.name.toLowerCase().includes('female')
    ) || voices.find(voice => voice.lang.includes('id'));
    
    if (femaleVoice) {
        utterance.voice = femaleVoice;
    }
    
    speechSynthesis.speak(utterance);
    
    // Visual feedback
    event.target.classList.add('playing');
    setTimeout(() => {
        event.target.classList.remove('playing');
    }, 600);
    
    // HAPUS: playSound('correctSound');
}

// Fungsi untuk suara angka
function playNumberSound(number, text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.rate = 0.8;
    utterance.pitch = 1.2;
    
    const voices = speechSynthesis.getVoices();
    const femaleVoice = voices.find(voice => 
        voice.lang.includes('id') && voice.name.toLowerCase().includes('female')
    ) || voices.find(voice => voice.lang.includes('id'));
    
    if (femaleVoice) {
        utterance.voice = femaleVoice;
    }
    
    speechSynthesis.speak(utterance);
    
    // Visual feedback
    event.target.classList.add('playing');
    setTimeout(() => {
        event.target.classList.remove('playing');
    }, 600);
    
    // HAPUS: playSound('correctSound');
}

// Fungsi untuk suara warna
function playColorSound(colorName, text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.rate = 0.8;
    utterance.pitch = 1.2;
    
    const voices = speechSynthesis.getVoices();
    const femaleVoice = voices.find(voice => 
        voice.lang.includes('id') && voice.name.toLowerCase().includes('female')
    ) || voices.find(voice => voice.lang.includes('id'));
    
    if (femaleVoice) {
        utterance.voice = femaleVoice;
    }
    
    speechSynthesis.speak(utterance);
    
    // Visual feedback
    event.target.classList.add('playing');
    setTimeout(() => {
        event.target.classList.remove('playing');
    }, 600);
    
    // HAPUS: playSound('correctSound');
}

// Fungsi untuk suara hijaiyah
function playHijaiyahSound(letter, latinName, text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.rate = 0.8;
    utterance.pitch = 1.2;
    
    const voices = speechSynthesis.getVoices();
    const femaleVoice = voices.find(voice => 
        voice.lang.includes('id') && voice.name.toLowerCase().includes('female')
    ) || voices.find(voice => voice.lang.includes('id'));
    
    if (femaleVoice) {
        utterance.voice = femaleVoice;
    }
    
    speechSynthesis.speak(utterance);
    
    // Visual feedback
    event.target.classList.add('playing');
    setTimeout(() => {
        event.target.classList.remove('playing');
    }, 600);
    
    // HAPUS: playSound('correctSound');
}

// Fungsi untuk inisialisasi event listeners
function initEventListeners() {
    // Load voices when available
    speechSynthesis.onvoiceschanged = function() {
        console.log('Voices loaded:', speechSynthesis.getVoices().length);
    };
}

// Global functions untuk akses dari HTML
window.selectMaterial = selectMaterial;
window.selectLevel = selectLevel;
window.nextStep = nextStep;
window.previousStep = previousStep;
window.completeMaterial = completeMaterial;
window.selectNewMaterial = selectNewMaterial;
window.goBackToDashboard = goBackToDashboard;
window.playLetterSound = playLetterSound;
window.playNumberSound = playNumberSound;
window.playColorSound = playColorSound;
window.playHijaiyahSound = playHijaiyahSound;
window.selectQuizAnswer = selectQuizAnswer;
window.submitQuiz = submitQuiz;
window.continueToNextLevel = continueToNextLevel;
window.playSound = playSound;
