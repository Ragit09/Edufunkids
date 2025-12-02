// js/dashboard.js - JavaScript untuk Dashboard EduFunKids

import { auth, db } from './firebaseConfig.js';
import { 
    signOut,
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { 
    doc, 
    getDoc,
    updateDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// Global variables
let userData = null;
let backgroundMusic = null;

// Inisialisasi ketika DOM selesai dimuat
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏠 EduFunKids Dashboard loaded successfully!');
    
    initDashboard();
});

// Fungsi utama untuk inisialisasi dashboard
async function initDashboard() {
    // Sembunyikan loading spinner
    hideLoadingSpinner();
    
    // Inisialisasi background music
    initBackgroundMusic();
    
    // Inisialisasi semua komponen
    initNavigation();
    await initUserData();
    initEventListeners();
    loadDashboardContent();
    
    console.log('✅ Dashboard initialized successfully');
}

// Fungsi untuk inisialisasi background music
function initBackgroundMusic() {
    backgroundMusic = new Audio('../music/SongDashboard.mp3');
    backgroundMusic.loop = true;
    
    // Set volume default 50% atau dari localStorage
    const savedMusicVolume = localStorage.getItem('edu_music_volume');
    if (savedMusicVolume !== null) {
        backgroundMusic.volume = parseFloat(savedMusicVolume);
    } else {
        backgroundMusic.volume = 0.5; // 50% default
        localStorage.setItem('edu_music_volume', '0.5');
    }
    
    // Cek apakah musik dienable
    const musicEnabled = localStorage.getItem('edu_music_enabled');
    if (musicEnabled === 'false') {
        console.log('🔇 Background music disabled by settings');
        return;
    }
    
    // Auto play music dengan user interaction
    document.addEventListener('click', startBackgroundMusic, { once: true });
    document.addEventListener('keydown', startBackgroundMusic, { once: true });
    document.addEventListener('touchstart', startBackgroundMusic, { once: true });
}

// Fungsi untuk memulai background music
function startBackgroundMusic() {
    if (backgroundMusic && backgroundMusic.volume > 0) {
        backgroundMusic.play().catch(error => {
            console.log('❌ Autoplay prevented:', error);
        });
    }
}

// Fungsi untuk update volume music
function updateBackgroundMusicVolume() {
    if (backgroundMusic) {
        const savedMusicVolume = localStorage.getItem('edu_music_volume');
        const musicEnabled = localStorage.getItem('edu_music_enabled');
        
        if (savedMusicVolume !== null) {
            backgroundMusic.volume = parseFloat(savedMusicVolume);
            
            // Jika volume 0, pause music. Jika > 0 dan belum diputar, play music
            if (backgroundMusic.volume > 0 && backgroundMusic.paused && musicEnabled !== 'false') {
                backgroundMusic.play().catch(console.error);
            } else if (backgroundMusic.volume === 0 || musicEnabled === 'false') {
                backgroundMusic.pause();
            }
        }
    }
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

// Fungsi untuk inisialisasi navigasi
function initNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    const seeAllLinks = document.querySelectorAll('.see-all.nav-link-click');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.querySelector('.compact-sidebar');
    
    // Navigation click handler
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Get target section
            const targetSection = this.getAttribute('data-section');
            
            // Update page title
            updatePageTitle(targetSection);
            
            // Show target section
            showSection(targetSection);
            
            // Close sidebar on mobile
            if (window.innerWidth < 992) {
                sidebar.classList.remove('mobile-open');
            }
            
            // Play click sound
            playSound('clickSound');
        });
    });
    
    // See All links click handler
    seeAllLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetSection = this.getAttribute('data-section');
            
            // Update navigation
            navLinks.forEach(nav => nav.classList.remove('active'));
            document.querySelector(`[data-section="${targetSection}"]`).classList.add('active');
            
            // Update page title and show section
            updatePageTitle(targetSection);
            showSection(targetSection);
            
            // Play click sound
            playSound('clickSound');
        });
    });
    
    // Mobile menu toggle
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('mobile-open');
            playSound('clickSound');
        });
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
        if (window.innerWidth < 992 && 
            !sidebar.contains(e.target) && 
            !mobileMenuToggle.contains(e.target) &&
            sidebar.classList.contains('mobile-open')) {
            sidebar.classList.remove('mobile-open');
        }
    });
}

// Fungsi untuk update judul halaman
function updatePageTitle(section) {
    const pageTitle = document.getElementById('pageTitle');
    const titles = {
        'home': 'Beranda',
        'materials': 'Materi Belajar',
        'games': 'Game Edukasi',
        'progress': 'Perkembangan Belajar',
        'achievements': 'Pencapaian & Lencana'
    };
    
    if (pageTitle && titles[section]) {
        pageTitle.textContent = titles[section];
    }
}

// Fungsi untuk menampilkan section
function showSection(sectionId) {
    const sections = document.querySelectorAll('.content-section');
    
    // Hide all sections
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Load section content if needed
        loadSectionContent(sectionId);
        
        // Jika kembali ke home, update game progress
        if (sectionId === 'home') {
            setTimeout(() => {
                updateGameProgressDisplay(userData);
                updateHomeStats(userData);
                updateContinueLearning(userData);
            }, 100);
        }
    }
}

// Fungsi untuk load konten section
function loadSectionContent(sectionId) {
    switch(sectionId) {
        case 'materials':
            loadMaterialsContent();
            break;
        case 'games':
            loadGamesContent();
            break;
        case 'progress':
            loadProgressContent();
            break;
        case 'achievements':
            loadAchievementsContent();
            break;
        case 'home':
            updateHomeStats();
            updateGameProgressDisplay();
            break;
    }
}

// Fungsi untuk inisialisasi data user
async function initUserData() {
    return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log('✅ User logged in:', user.email);
                
                try {
                    // Get user data from Firestore
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    
                    if (userDoc.exists()) {
                        userData = userDoc.data();
                        console.log('📊 User data loaded:', userData);
                        
                        // Initialize unlockedLevels if doesn't exist
                        if (!userData.unlockedLevels) {
                            userData.unlockedLevels = {
                                huruf: [1],
                                angka: [1], 
                                warna: [1],
                                hijaiyah: [1]
                            };
                            // Save to Firestore
                            await updateDoc(doc(db, "users", user.uid), {
                                unlockedLevels: userData.unlockedLevels
                            });
                            console.log('🔓 Initialized unlocked levels');
                        }
                        
                        // Initialize gameProgress if doesn't exist
                        if (!userData.gameProgress) {
                            userData.gameProgress = {
                                'tebak-huruf': {
                                    completedLevels: [],
                                    badges: [],
                                    highestScore: 0,
                                    totalStars: 0
                                },
                                'hitung-cepat': {
                                    completedLevels: [],
                                    badges: [],
                                    highestScore: 0,
                                    totalQuestions: 0
                                },
                                'mewarnai': {
                                    completedLevels: [],
                                    badges: [],
                                    highestScore: 0,
                                    totalStars: 0
                                }
                            };
                            // Save to Firestore
                            await updateDoc(doc(db, "users", user.uid), {
                                gameProgress: userData.gameProgress
                            });
                            console.log('🎮 Initialized game progress');
                        }
                        
                        // Initialize completedLevels if doesn't exist
                        if (!userData.completedLevels) {
                            userData.completedLevels = [];
                        }
                        
                        // Initialize points if doesn't exist
                        if (userData.points === undefined) {
                            userData.points = 0;
                            await updateDoc(doc(db, "users", user.uid), {
                                points: 0
                            });
                        }
                        
                        updateUserInterface(userData, user.email);
                        
                        // Update game progress di home section setelah data dimuat
                        setTimeout(() => {
                            updateGameProgressDisplay(userData);
                        }, 500);
                        
                        resolve(userData);
                    } else {
                        console.log('❌ No user data found, creating new user data...');
                        // Create initial user data
                        await initializeUserData(user);
                        resolve(userData);
                    }
                } catch (error) {
                    console.error('❌ Error getting user data:', error);
                    showNotification('Gagal memuat data pengguna', 'error');
                    resolve(null);
                }
            } else {
                // Redirect to login if not authenticated
                console.log('❌ User not authenticated, redirecting to login...');
                window.location.href = 'login.html';
                resolve(null);
            }
        });
    });
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
            gameProgress: {
                'tebak-huruf': {
                    completedLevels: [],
                    badges: [],
                    highestScore: 0,
                    totalStars: 0
                },
                'hitung-cepat': {
                    completedLevels: [],
                    badges: [],
                    highestScore: 0,
                    totalQuestions: 0
                },
                'mewarnai': {
                    completedLevels: [],
                    badges: [],
                    highestScore: 0,
                    totalStars: 0
                }
            },
            progress: {},
            achievements: [],
            avatar: '👦',
            lastCompleted: null,
            createdAt: new Date()
        };
        
        await setDoc(doc(db, "users", user.uid), initialUserData);
        userData = initialUserData;
        console.log('✅ New user data initialized in Firebase');
    } catch (error) {
        console.error('❌ Error initializing user data:', error);
        showNotification('Gagal membuat data pengguna baru', 'error');
    }
}

// Fungsi untuk update UI dengan data user
function updateUserInterface(userData, userEmail) {
    // Update mini profile in sidebar
    const miniAvatar = document.getElementById('sidebarMiniAvatar');
    const miniName = document.getElementById('sidebarMiniName');
    const sidebarPoints = document.getElementById('sidebarPoints');
    
    if (miniAvatar && userData.avatar) {
        miniAvatar.textContent = userData.avatar;
    }
    
    if (miniName && userData.childName) {
        miniName.textContent = userData.childName;
    }
    
    if (sidebarPoints && userData.points !== undefined) {
        sidebarPoints.textContent = userData.points;
    }
    
    // Update user name in welcome banner
    const welcomeName = document.getElementById('welcomeName');
    if (welcomeName && userData.childName) {
        welcomeName.textContent = userData.childName;
    }
    
    // Update user avatar in welcome banner
    const welcomeAvatar = document.getElementById('welcomeAvatar');
    if (welcomeAvatar && userData.avatar) {
        welcomeAvatar.textContent = userData.avatar;
    }
    
    // Update points in welcome banner
    const welcomePoints = document.getElementById('welcomePoints');
    if (welcomePoints && userData.points !== undefined) {
        welcomePoints.textContent = userData.points;
    }
    
    // Update home statistics
    updateHomeStats(userData);
    
    // Update continue learning section
    updateContinueLearning(userData);
    
    // Update game progress in home section
    updateGameProgressDisplay(userData);
}

// Fungsi untuk menghitung statistik dari progress user
function calculateUserStats(userData) {
    const completedLevels = userData?.completedLevels || [];
    const achievements = userData?.achievements || [];
    
    // Hitung progress per kategori berdasarkan level yang diselesaikan
    const categoryProgress = {
        huruf: 0,
        angka: 0,
        warna: 0,
        hijaiyah: 0
    };
    
    // Hitung jumlah level yang diselesaikan per kategori
    const totalLevelsPerCategory = {
        huruf: 3,
        angka: 4,
        warna: 3,
        hijaiyah: 3
    };
    
    completedLevels.forEach(level => {
        if (level.includes('huruf')) {
            const completed = (userData.completedLevels.filter(l => l.includes('huruf')).length / totalLevelsPerCategory.huruf) * 100;
            categoryProgress.huruf = Math.min(completed, 100);
        }
        if (level.includes('angka')) {
            const completed = (userData.completedLevels.filter(l => l.includes('angka')).length / totalLevelsPerCategory.angka) * 100;
            categoryProgress.angka = Math.min(completed, 100);
        }
        if (level.includes('warna')) {
            const completed = (userData.completedLevels.filter(l => l.includes('warna')).length / totalLevelsPerCategory.warna) * 100;
            categoryProgress.warna = Math.min(completed, 100);
        }
        if (level.includes('hijaiyah')) {
            const completed = (userData.completedLevels.filter(l => l.includes('hijaiyah')).length / totalLevelsPerCategory.hijaiyah) * 100;
            categoryProgress.hijaiyah = Math.min(completed, 100);
        }
    });
    
    // Hitung statistik game
    const gameStats = calculateGameStats(userData);
    
    // Hitung statistik lainnya
    const completedMaterials = completedLevels.length;
    const completedQuizzes = completedLevels.length; // Asumsi setiap level memiliki 1 kuis
    const achievementsCount = achievements.length + gameStats.totalBadges;
    const totalPoints = userData.points || 0;
    
    return {
        completedMaterials,
        completedQuizzes,
        achievementsCount,
        totalPoints,
        categoryProgress,
        gameStats
    };
}

// Fungsi untuk menghitung statistik game
function calculateGameStats(userData) {
    const gameProgress = userData?.gameProgress || {};
    let totalGameLevels = 0;
    let completedGameLevels = 0;
    let totalBadges = 0;
    let totalGamePoints = 0;
    
    // Hitung statistik untuk setiap game
    Object.values(gameProgress).forEach(game => {
        if (game && game.completedLevels) {
            totalGameLevels += 5; // 5 level per game
            completedGameLevels += game.completedLevels.length;
        }
        if (game && game.badges) {
            totalBadges += game.badges.length;
        }
        if (game && game.highestScore) {
            totalGamePoints += game.highestScore;
        }
    });
    
    return {
        totalGameLevels,
        completedGameLevels,
        totalBadges,
        totalGamePoints,
        gameCompletionRate: totalGameLevels > 0 ? (completedGameLevels / totalGameLevels) * 100 : 0
    };
}

// Fungsi untuk update statistik home
function updateHomeStats(userData = null) {
    if (!userData) userData = window.userData;
    if (!userData) return;
    
    const stats = calculateUserStats(userData);
    
    const completedMaterials = document.getElementById('completedMaterials');
    const completedQuizzes = document.getElementById('completedQuizzes');
    const achievementsCount = document.getElementById('achievementsCount');
    const totalPoints = document.getElementById('totalPoints');
    
    if (completedMaterials) completedMaterials.textContent = stats.completedMaterials;
    if (completedQuizzes) completedQuizzes.textContent = stats.completedQuizzes;
    if (achievementsCount) achievementsCount.textContent = stats.achievementsCount;
    if (totalPoints) totalPoints.textContent = stats.totalPoints;
    
    // Re-initialize counters
    initCounters();
}

// Fungsi untuk update continue learning section
function updateContinueLearning(userData = null) {
    if (!userData) userData = window.userData;
    if (!userData) return;
    
    const continueLearningGrid = document.getElementById('continueLearningGrid');
    if (!continueLearningGrid) return;
    
    const stats = calculateUserStats(userData);
    const completedLevels = userData?.completedLevels || [];
    
    const materials = [
        {
            id: 'huruf',
            title: 'Huruf ABC',
            description: 'Belajar mengenal huruf A sampai Z dengan gambar dan suara',
            icon: 'bi-fonts',
            color: 'primary',
            progress: stats.categoryProgress.huruf,
            totalSteps: 100,
            levels: 3
        },
        {
            id: 'angka',
            title: 'Angka 1-20',
            description: 'Mengenal angka dan berhitung dasar dengan visual menarik',
            icon: 'bi-123',
            color: 'success',
            progress: stats.categoryProgress.angka,
            totalSteps: 100,
            levels: 4
        },
        {
            id: 'warna',
            title: 'Warna Dasar',
            description: 'Mengenal warna-warna pokok dengan contoh benda sehari-hari',
            icon: 'bi-palette',
            color: 'warning',
            progress: stats.categoryProgress.warna,
            totalSteps: 100,
            levels: 3
        },
        {
            id: 'hijaiyah',
            title: 'Huruf Hijaiyah',
            description: 'Belajar membaca huruf Arab dengan cara yang menyenangkan',
            icon: 'bi-translate',
            color: 'info',
            progress: stats.categoryProgress.hijaiyah,
            totalSteps: 100,
            levels: 3
        }
    ];
    
    // Filter materials that are in progress (progress > 0 and < totalSteps)
    const inProgressMaterials = materials.filter(material => 
        material.progress > 0 && material.progress < material.totalSteps
    );
    
    // If no materials in progress, show recommended materials
    const displayMaterials = inProgressMaterials.length > 0 ? inProgressMaterials : materials.slice(0, 2);
    
    continueLearningGrid.innerHTML = displayMaterials.map(material => {
        const progressPercent = material.progress;
        return `
            <div class="col-md-6 mb-3">
                <div class="learning-card">
                    <div class="card-icon bg-${material.color}">
                        <i class="bi ${material.icon}"></i>
                    </div>
                    <div class="card-content">
                        <h6>${material.title}</h6>
                        <p>${material.description}</p>
                        <div class="progress">
                            <div class="progress-bar" style="width: ${progressPercent}%"></div>
                        </div>
                        <small>${Math.round(material.progress)}% selesai</small>
                        <div class="mt-2">
                            <button class="btn btn-primary btn-sm" onclick="startLearning('${material.id}')">
                                ${material.progress > 0 ? 'Lanjutkan' : 'Mulai'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Fungsi untuk update display progress game di home section
function updateGameProgressDisplay(userData = null) {
    if (!userData) userData = window.userData;
    if (!userData) return;
    
    const gameProgress = userData.gameProgress || {};
    
    // Update semua game cards di home section
    updateHomeGameCard('tebak-huruf', gameProgress['tebak-huruf']);
    updateHomeGameCard('hitung-cepat', gameProgress['hitung-cepat']);
    updateHomeGameCard('mewarnai', gameProgress['mewarnai']);
}

// Fungsi untuk update progress pada game card di home section
function updateHomeGameCard(gameId, gameData) {
    if (!gameData) {
        // Inisialisasi data default jika tidak ada
        gameData = {
            completedLevels: [],
            badges: [],
            highestScore: 0,
            totalStars: 0
        };
    }
    
    const completedLevels = gameData.completedLevels || [];
    const progressPercent = (completedLevels.length / 5) * 100;
    const badgesCount = gameData.badges ? gameData.badges.length : 0;
    
    console.log(`Updating home ${gameId} progress: ${progressPercent}%, badges: ${badgesCount}`);
    
    // Cari game card di home section dan update progress-nya
    const gameCards = document.querySelectorAll('#home .game-card');
    gameCards.forEach(card => {
        const button = card.querySelector('button');
        if (button && button.getAttribute('onclick')?.includes('goToGamesDashboard')) {
            const gameIcon = card.querySelector('.game-icon i');
            if (!gameIcon) return;
            
            // Identifikasi game berdasarkan icon
            const isTebakHuruf = gameIcon.classList.contains('bi-fonts');
            const isHitungCepat = gameIcon.classList.contains('bi-calculator');
            const isMewarnai = gameIcon.classList.contains('bi-palette');
            
            let shouldUpdate = false;
            if (gameId === 'tebak-huruf' && isTebakHuruf) shouldUpdate = true;
            if (gameId === 'hitung-cepat' && isHitungCepat) shouldUpdate = true;
            if (gameId === 'mewarnai' && isMewarnai) shouldUpdate = true;
            
            if (shouldUpdate) {
                // Update progress bar
                const progressBar = card.querySelector('.progress-bar');
                if (progressBar) {
                    progressBar.style.width = `${progressPercent}%`;
                }
                
                // Update badge count
                const badgeCountSpan = card.querySelector('.badge-count');
                if (badgeCountSpan) {
                    // Tentukan jumlah maksimal lencana berdasarkan game
                    let maxBadges = 2; // Default
                    if (gameId === 'mewarnai') maxBadges = 3;
                    badgeCountSpan.textContent = `${badgesCount}/${maxBadges}`;
                }
                
                // Update progress text
                const progressText = card.querySelector('.progress-text');
                if (progressText) {
                    progressText.textContent = `${Math.round(progressPercent)}% selesai`;
                }
                
                // Update game title (opsional, untuk memastikan game yang benar)
                const gameTitle = card.querySelector('h6');
                if (gameTitle) {
                    if (gameId === 'tebak-huruf') gameTitle.textContent = 'Tebak Huruf';
                    if (gameId === 'hitung-cepat') gameTitle.textContent = 'Hitung Cepat';
                    if (gameId === 'mewarnai') gameTitle.textContent = 'Mewarnai';
                }
            }
        }
    });
}

// Fungsi untuk inisialisasi event listeners
function initEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Settings button
    const settingsBtn = document.querySelector('.settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function() {
            playSound('clickSound');
        });
    }
    
    // Game card click handlers
    const gameCards = document.querySelectorAll('.game-card');
    gameCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Cegah trigger jika yang diklik adalah button
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                return;
            }
            
            const button = this.querySelector('button');
            if (button) {
                const onclickAttr = button.getAttribute('onclick');
                if (onclickAttr) {
                    const gameId = onclickAttr.match(/'([^']+)'/)[1];
                    goToGamesDashboard();
                }
            }
        });
    });
    
    // Game button click handlers
    const gameButtons = document.querySelectorAll('.game-card button');
    gameButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent card click event
            goToGamesDashboard();
        });
    });
}

// Fungsi untuk handle logout
async function handleLogout() {
    try {
        // Stop background music sebelum logout
        if (backgroundMusic) {
            backgroundMusic.pause();
            backgroundMusic.currentTime = 0;
        }
        
        await signOut(auth);
        console.log('✅ User logged out successfully');
        showNotification('Logout berhasil!', 'success');
        
        // Redirect to login page after short delay
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        
    } catch (error) {
        console.error('❌ Logout error:', error);
        showNotification('Gagal logout. Silakan coba lagi.', 'error');
    }
}

// Fungsi untuk navigasi ke game dashboard
function goToGamesDashboard() {
    playSound('clickSound');
    showNotification('Membuka Game Dashboard...', 'info');
    
    setTimeout(() => {
        window.location.href = 'games-dashboard.html';
    }, 500);
}

// Fungsi untuk load dashboard content
function loadDashboardContent() {
    // Load initial content for home section
    loadSectionContent('home');
    
    // Initialize counters animation
    initCounters();
    
    // Update game progress setelah semua konten dimuat
    setTimeout(() => {
        updateGameProgressDisplay(userData);
    }, 500);
}

// Fungsi untuk animasi counter
function initCounters() {
    const counters = document.querySelectorAll('.counter');
    
    counters.forEach(counter => {
        const target = parseInt(counter.textContent) || 0;
        let current = 0;
        const increment = target / 100;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                counter.textContent = target;
                clearInterval(timer);
            } else {
                counter.textContent = Math.floor(current);
            }
        }, 20);
    });
}

// Fungsi untuk load materials content
function loadMaterialsContent() {
    const materialsGrid = document.querySelector('.materials-grid');
    if (!materialsGrid) return;
    
    const stats = calculateUserStats(userData);
    
    // Materials data
    const materials = [
        {
            id: 'huruf',
            title: 'Huruf ABC',
            description: 'Belajar mengenal huruf A sampai Z dengan gambar dan suara',
            icon: 'bi-fonts',
            color: 'primary',
            progress: stats.categoryProgress.huruf,
            category: 'huruf',
            totalSteps: 100,
            levels: 3
        },
        {
            id: 'angka',
            title: 'Angka 1-20',
            description: 'Mengenal angka dan berhitung dasar dengan visual menarik',
            icon: 'bi-123',
            color: 'success',
            progress: stats.categoryProgress.angka,
            category: 'angka',
            totalSteps: 100,
            levels: 4
        },
        {
            id: 'warna',
            title: 'Warna Dasar',
            description: 'Mengenal warna-warna pokok dengan contoh benda sehari-hari',
            icon: 'bi-palette',
            color: 'warning',
            progress: stats.categoryProgress.warna,
            category: 'warna',
            totalSteps: 100,
            levels: 3
        },
        {
            id: 'hijaiyah',
            title: 'Huruf Hijaiyah',
            description: 'Belajar membaca huruf Arab dengan cara yang menyenangkan',
            icon: 'bi-translate',
            color: 'info',
            progress: stats.categoryProgress.hijaiyah,
            category: 'hijaiyah',
            totalSteps: 100,
            levels: 3
        }
    ];
    
    materialsGrid.innerHTML = materials.map(material => {
        const progressPercent = material.progress;
        return `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="learning-card">
                    <div class="card-icon bg-${material.color}">
                        <i class="bi ${material.icon}"></i>
                    </div>
                    <div class="card-content">
                        <h6>${material.title}</h6>
                        <p>${material.description}</p>
                        <div class="material-meta">
                            <span class="badge bg-light text-dark">
                                <i class="bi bi-layer-forward"></i> ${material.levels} Level
                            </span>
                            <span class="badge bg-light text-dark">
                                <i class="bi bi-question-circle"></i> ${material.levels} Kuis
                            </span>
                        </div>
                        <div class="progress mt-2">
                            <div class="progress-bar" style="width: ${progressPercent}%"></div>
                        </div>
                        <small>${Math.round(material.progress)}% selesai</small>
                        <div class="mt-2">
                            <span class="badge bg-${material.color}">${material.category}</span>
                            <button class="btn btn-primary btn-sm float-end" onclick="startLearning('${material.id}')">
                                ${material.progress > 0 ? 'Lanjutkan' : 'Mulai'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Fungsi untuk load games content
function loadGamesContent() {
    const gamesCatalog = document.querySelector('.games-catalog');
    if (!gamesCatalog) return;
    
    const gameProgress = userData?.gameProgress || {};
    
    // Sample games data dengan progress
    const games = [
        {
            id: 'tebak-huruf',
            title: 'Tebak Huruf',
            description: 'Tebak huruf dari gambar dan suara',
            icon: 'bi-fonts',
            color: 'primary',
            category: 'Huruf',
            progress: gameProgress['tebak-huruf'] ? (gameProgress['tebak-huruf'].completedLevels.length / 5) * 100 : 0,
            badges: gameProgress['tebak-huruf'] ? gameProgress['tebak-huruf'].badges.length : 0
        },
        {
            id: 'hitung-cepat',
            title: 'Hitung Cepat',
            description: 'Latihan berhitung dengan waktu',
            icon: 'bi-123',
            color: 'success',
            category: 'Angka',
            progress: gameProgress['hitung-cepat'] ? (gameProgress['hitung-cepat'].completedLevels.length / 5) * 100 : 0,
            badges: gameProgress['hitung-cepat'] ? gameProgress['hitung-cepat'].badges.length : 0
        },
        {
            id: 'mewarnai',
            title: 'Mewarnai Online',
            description: 'Warnai gambar dengan kreativitasmu',
            icon: 'bi-palette',
            color: 'warning',
            category: 'Warna',
            progress: gameProgress['mewarnai'] ? (gameProgress['mewarnai'].completedLevels.length / 5) * 100 : 0,
            badges: gameProgress['mewarnai'] ? gameProgress['mewarnai'].badges.length : 0
        },
        {
            id: 'hafalan-hijaiyah',
            title: 'Hafalan Hijaiyah',
            description: 'Hafal dan kenali huruf hijaiyah',
            icon: 'bi-translate',
            color: 'info',
            category: 'Hijaiyah',
            progress: 0,
            badges: 0
        },
        {
            id: 'puzzle-gambar',
            title: 'Puzzle Gambar',
            description: 'Susun potongan gambar menjadi utuh',
            icon: 'bi-puzzle',
            color: 'danger',
            category: 'Puzzle',
            progress: 0,
            badges: 0
        },
        {
            id: 'memory-game',
            title: 'Memory Game',
            description: 'Temukan pasangan gambar yang sama',
            icon: 'bi-images',
            color: 'secondary',
            category: 'Memori',
            progress: 0,
            badges: 0
        }
    ];
    
    gamesCatalog.innerHTML = games.map(game => {
        const progressPercent = game.progress;
        const badgesCount = game.badges || 0;
        const maxBadges = game.id === 'mewarnai' ? 3 : 2;
        
        return `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="game-card" data-game="${game.id}">
                    <div class="game-icon bg-${game.color}">
                        <i class="bi ${game.icon}"></i>
                    </div>
                    <div class="game-content">
                        <h6>${game.title}</h6>
                        <p>${game.description}</p>
                        <div class="game-progress-info">
                            <div class="progress mb-2">
                                <div class="progress-bar" style="width: ${progressPercent}%"></div>
                            </div>
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="badge bg-${game.color}">${game.category}</span>
                                <small class="text-muted progress-text">${Math.round(game.progress)}% selesai</small>
                            </div>
                            <div class="d-flex justify-content-between align-items-center mt-1">
                                <small class="text-muted">
                                    <i class="bi bi-trophy-fill text-warning"></i>
                                    <span class="badge-count">${badgesCount}/${maxBadges}</span> Lencana
                                </small>
                            </div>
                        </div>
                        <div class="mt-3">
                            <button class="btn btn-primary btn-sm w-100" onclick="goToGamesDashboard()">
                                Main Sekarang
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Fungsi untuk load progress content
function loadProgressContent() {
    const progressCharts = document.querySelector('.progress-charts');
    if (!progressCharts) return;
    
    const stats = calculateUserStats(userData);
    const gameStats = stats.gameStats;
    const totalProgress = Object.values(stats.categoryProgress).reduce((a, b) => a + b, 0) / Object.keys(stats.categoryProgress).length;
    const completedMaterials = stats.completedMaterials;
    
    progressCharts.innerHTML = `
        <div class="row">
            <div class="col-md-6 mb-4">
                <div class="stat-card text-center">
                    <div class="stat-icon bg-primary">
                        <i class="bi bi-graph-up"></i>
                    </div>
                    <div class="stat-info">
                        <h2>${Math.round(totalProgress)}%</h2>
                        <p>Progress Belajar Keseluruhan</p>
                    </div>
                </div>
            </div>
            <div class="col-md-6 mb-4">
                <div class="stat-card text-center">
                    <div class="stat-icon bg-success">
                        <i class="bi bi-check-circle"></i>
                    </div>
                    <div class="stat-info">
                        <h2>${completedMaterials}</h2>
                        <p>Level Diselesaikan</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-6 mb-4">
                <div class="stat-card text-center">
                    <div class="stat-icon bg-warning">
                        <i class="bi bi-controller"></i>
                    </div>
                    <div class="stat-info">
                        <h2>${gameStats.completedGameLevels}/${gameStats.totalGameLevels}</h2>
                        <p>Level Game Selesai</p>
                    </div>
                </div>
            </div>
            <div class="col-md-6 mb-4">
                <div class="stat-card text-center">
                    <div class="stat-icon bg-info">
                        <i class="bi bi-trophy"></i>
                    </div>
                    <div class="stat-info">
                        <h2>${gameStats.totalBadges}</h2>
                        <p>Lencana Game</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-12">
                <div class="stat-card">
                    <h6 class="text-center mb-4">Progress per Kategori</h6>
                    <div class="mt-3">
                        <div class="d-flex justify-content-between mb-2">
                            <span>Huruf ABC</span>
                            <span>${Math.round(stats.categoryProgress.huruf)}%</span>
                        </div>
                        <div class="progress mb-3">
                            <div class="progress-bar bg-primary" style="width: ${stats.categoryProgress.huruf}%"></div>
                        </div>
                        
                        <div class="d-flex justify-content-between mb-2">
                            <span>Angka 1-20</span>
                            <span>${Math.round(stats.categoryProgress.angka)}%</span>
                        </div>
                        <div class="progress mb-3">
                            <div class="progress-bar bg-success" style="width: ${stats.categoryProgress.angka}%"></div>
                        </div>
                        
                        <div class="d-flex justify-content-between mb-2">
                            <span>Warna Dasar</span>
                            <span>${Math.round(stats.categoryProgress.warna)}%</span>
                        </div>
                        <div class="progress mb-3">
                            <div class="progress-bar bg-warning" style="width: ${stats.categoryProgress.warna}%"></div>
                        </div>
                        
                        <div class="d-flex justify-content-between mb-2">
                            <span>Huruf Hijaiyah</span>
                            <span>${Math.round(stats.categoryProgress.hijaiyah)}%</span>
                        </div>
                        <div class="progress">
                            <div class="progress-bar bg-info" style="width: ${stats.categoryProgress.hijaiyah}%"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mt-4">
            <div class="col-12">
                <div class="stat-card">
                    <h6 class="text-center mb-4">Statistik Game</h6>
                    <div class="row text-center">
                        <div class="col-md-3 mb-3">
                            <div class="stat-item">
                                <h4 class="text-primary">${gameStats.completedGameLevels}</h4>
                                <small>Level Game Selesai</small>
                            </div>
                        </div>
                        <div class="col-md-3 mb-3">
                            <div class="stat-item">
                                <h4 class="text-success">${gameStats.totalBadges}</h4>
                                <small>Lencana Game</small>
                            </div>
                        </div>
                        <div class="col-md-3 mb-3">
                            <div class="stat-item">
                                <h4 class="text-warning">${Math.round(gameStats.gameCompletionRate)}%</h4>
                                <small>Progress Game</small>
                            </div>
                        </div>
                        <div class="col-md-3 mb-3">
                            <div class="stat-item">
                                <h4 class="text-info">${gameStats.totalGamePoints}</h4>
                                <small>Total Poin Game</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Data lencana yang tersedia
const availableBadges = {
    // Lencana untuk Tebak Huruf
    'master-huruf': {
        title: 'Master Huruf',
        description: 'Selesaikan semua level Tebak Huruf',
        icon: 'bi-fonts',
        color: 'primary',
        game: 'tebak-huruf'
    },
    'perfectionist': {
        title: 'Perfectionist',
        description: 'Dapatkan skor sempurna di game Tebak Huruf',
        icon: 'bi-star-fill',
        color: 'warning',
        game: 'tebak-huruf'
    },
    
    // Lencana untuk Hitung Cepat
    'matematika-master': {
        title: 'Master Matematika',
        description: 'Selesaikan semua level Hitung Cepat',
        icon: 'bi-calculator',
        color: 'success',
        game: 'hitung-cepat'
    },
    'cepat-tangan': {
        title: 'Cepat Tangan',
        description: 'Selesaikan Hitung Cepat dengan sangat cepat',
        icon: 'bi-lightning',
        color: 'danger',
        game: 'hitung-cepat'
    },
    
    // Lencana untuk Mewarnai
    'seniman-muda': {
        title: 'Seniman Muda',
        description: 'Selesaikan semua level Mewarnai',
        icon: 'bi-palette',
        color: 'warning',
        game: 'mewarnai'
    },
    'warna-master': {
        title: 'Master Warna',
        description: 'Dapatkan skor tinggi di game Mewarnai',
        icon: 'bi-brush',
        color: 'info',
        game: 'mewarnai'
    },
    'bintang-emas': {
        title: 'Bintang Emas',
        description: 'Dapatkan banyak bintang sempurna',
        icon: 'bi-stars',
        color: 'warning',
        game: 'mewarnai'
    },
    
    // Lencana pencapaian umum
    'pembelajar-aktif': {
        title: 'Pembelajar Aktif',
        description: 'Selesaikan 5 level materi',
        icon: 'bi-book',
        color: 'primary'
    },
    'pembelajar-handal': {
        title: 'Pembelajar Handal',
        description: 'Selesaikan 10 level materi',
        icon: 'bi-book-half',
        color: 'primary'
    },
    'kolektor-poin': {
        title: 'Kolektor Poin',
        description: 'Kumpulkan 100 poin',
        icon: 'bi-coin',
        color: 'warning'
    },
    'ahli-poin': {
        title: 'Ahli Poin',
        description: 'Kumpulkan 500 poin',
        icon: 'bi-stars',
        color: 'warning'
    },
    'kolektor-lencana': {
        title: 'Kolektor Lencana',
        description: 'Dapatkan 3 lencana game',
        icon: 'bi-trophy',
        color: 'warning'
    },
    'pemain-game-handal': {
        title: 'Pemain Game Handal',
        description: 'Selesaikan 10 level game',
        icon: 'bi-controller',
        color: 'success'
    },
    'master-edufunkids': {
        title: 'Master EduFunKids',
        description: 'Selesaikan semua materi',
        icon: 'bi-trophy-fill',
        color: 'warning'
    },
    'master-game': {
        title: 'Master Game',
        description: 'Selesaikan semua level game',
        icon: 'bi-joystick',
        color: 'primary'
    }
};

// Fungsi untuk mendapatkan semua lencana user
function getUserBadges(userData) {
    const badges = [];
    const gameProgress = userData?.gameProgress || {};
    
    // Kumpulkan semua lencana dari semua game
    Object.values(gameProgress).forEach(game => {
        if (game && game.badges) {
            game.badges.forEach(badgeId => {
                if (availableBadges[badgeId]) {
                    badges.push({
                        ...availableBadges[badgeId],
                        id: badgeId,
                        unlocked: true,
                        unlockedDate: new Date()
                    });
                }
            });
        }
    });
    
    // Tambahkan lencana pencapaian umum
    const stats = calculateUserStats(userData);
    
    // Pembelajar Aktif
    if (stats.completedMaterials >= 5) {
        badges.push({
            ...availableBadges['pembelajar-aktif'],
            id: 'pembelajar-aktif',
            unlocked: true
        });
    }
    
    // Pembelajar Handal
    if (stats.completedMaterials >= 10) {
        badges.push({
            ...availableBadges['pembelajar-handal'],
            id: 'pembelajar-handal',
            unlocked: true
        });
    }
    
    // Kolektor Poin
    if (stats.totalPoints >= 100) {
        badges.push({
            ...availableBadges['kolektor-poin'],
            id: 'kolektor-poin',
            unlocked: true
        });
    }
    
    // Ahli Poin
    if (stats.totalPoints >= 500) {
        badges.push({
            ...availableBadges['ahli-poin'],
            id: 'ahli-poin',
            unlocked: true
        });
    }
    
    // Kolektor Lencana
    if (stats.gameStats.totalBadges >= 3) {
        badges.push({
            ...availableBadges['kolektor-lencana'],
            id: 'kolektor-lencana',
            unlocked: true
        });
    }
    
    // Pemain Game Handal
    if (stats.gameStats.completedGameLevels >= 10) {
        badges.push({
            ...availableBadges['pemain-game-handal'],
            id: 'pemain-game-handal',
            unlocked: true
        });
    }
    
    // Master EduFunKids
    if (Object.values(stats.categoryProgress).every(progress => progress >= 100)) {
        badges.push({
            ...availableBadges['master-edufunkids'],
            id: 'master-edufunkids',
            unlocked: true
        });
    }
    
    // Master Game
    if (stats.gameStats.completedGameLevels >= stats.gameStats.totalGameLevels && stats.gameStats.totalGameLevels > 0) {
        badges.push({
            ...availableBadges['master-game'],
            id: 'master-game',
            unlocked: true
        });
    }
    
    // Hapus duplikat berdasarkan ID
    const uniqueBadges = [];
    const seenIds = new Set();
    
    badges.forEach(badge => {
        if (!seenIds.has(badge.id)) {
            seenIds.add(badge.id);
            uniqueBadges.push(badge);
        }
    });
    
    return uniqueBadges;
}

// Fungsi untuk load achievements content
function loadAchievementsContent() {
    const achievementsGrid = document.querySelector('.achievements-grid');
    if (!achievementsGrid) return;
    
    const userBadges = getUserBadges(userData);
    const totalBadges = Object.keys(availableBadges).length;
    
    // Jika belum ada lencana, tampilkan pesan
    if (userBadges.length === 0) {
        achievementsGrid.innerHTML = `
            <div class="col-12 text-center">
                <div class="empty-state">
                    <i class="bi bi-trophy" style="font-size: 4rem; color: #6c757d;"></i>
                    <h5 class="mt-3">Belum Ada Lencana</h5>
                    <p class="text-muted">Mainkan game dan selesaikan materi untuk mendapatkan lencana pertama!</p>
                    <div class="mt-3">
                        <button class="btn btn-primary me-2" onclick="showSection('materials')">Mulai Belajar</button>
                        <button class="btn btn-success" onclick="goToGamesDashboard()">Main Game</button>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    
    // Tampilkan progress koleksi lencana
    const progressPercent = (userBadges.length / totalBadges) * 100;
    
    achievementsGrid.innerHTML = `
        <div class="col-12 mb-4">
            <div class="badge-collection-progress">
                <h5 class="text-center mb-3">Koleksi Lencana</h5>
                <div class="progress mb-2">
                    <div class="progress-bar bg-warning" style="width: ${progressPercent}%"></div>
                </div>
                <div class="text-center">
                    <small class="text-muted">${userBadges.length} dari ${totalBadges} lencana terkumpul</small>
                </div>
            </div>
        </div>
        
        ${userBadges.map(badge => `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="badge-card ${badge.unlocked ? 'unlocked' : 'locked'}">
                    <div class="badge-icon bg-${badge.color}">
                        <i class="bi ${badge.icon}"></i>
                    </div>
                    <div class="badge-content">
                        <h6>${badge.title}</h6>
                        <p class="badge-description">${badge.description}</p>
                        ${badge.game ? `<span class="badge-game">${getGameName(badge.game)}</span>` : ''}
                        <div class="badge-status">
                            <span class="badge ${badge.unlocked ? 'bg-success' : 'bg-secondary'}">
                                ${badge.unlocked ? '✓ Terkumpul' : 'Terkunci'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('')}
        
        <!-- Tampilkan lencana yang belum terkumpul -->
        <div class="col-12 mt-4">
            <h6 class="text-center mb-3">Lencana yang Belum Terkumpul</h6>
            <div class="row">
                ${Object.entries(availableBadges)
                    .filter(([badgeId]) => !userBadges.find(b => b.id === badgeId))
                    .map(([badgeId, badge]) => `
                    <div class="col-md-6 col-lg-4 mb-3">
                        <div class="badge-card locked">
                            <div class="badge-icon bg-secondary">
                                <i class="bi ${badge.icon}"></i>
                            </div>
                            <div class="badge-content">
                                <h6>${badge.title}</h6>
                                <p class="badge-description">${badge.description}</p>
                                ${badge.game ? `<span class="badge-game">${getGameName(badge.game)}</span>` : ''}
                                <div class="badge-status">
                                    <span class="badge bg-secondary">
                                        🔒 Terkunci
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Helper function untuk mendapatkan nama game
function getGameName(gameId) {
    const gameNames = {
        'tebak-huruf': 'Tebak Huruf',
        'hitung-cepat': 'Hitung Cepat',
        'mewarnai': 'Mewarnai'
    };
    return gameNames[gameId] || gameId;
}

// Fungsi untuk memulai belajar
function startLearning(materialId) {
    console.log('Starting learning for:', materialId);
    // Play click sound
    playSound('clickSound');
    // Redirect to learning materials page with material parameter
    setTimeout(() => {
        window.location.href = `learning-materials.html?material=${materialId}`;
    }, 500);
}

// Fungsi untuk memulai game (diarahkan ke game dashboard)
function startGame(gameId) {
    console.log('Starting game:', gameId);
    playSound('clickSound');
    showNotification(`Membuka ${gameId}...`, 'info');
    
    // Redirect ke game dashboard
    setTimeout(() => {
        window.location.href = 'games-dashboard.html';
    }, 500);
}

// Fungsi untuk memainkan sound effect
function playSound(soundId) {
    // Sound effects sementara dinonaktifkan
    console.log('Sound effect:', soundId);
    return;
}

// Fungsi untuk menampilkan notifikasi
function showNotification(message, type = 'info', duration = 5000) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        max-width: 500px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        border: none;
        border-radius: 15px;
    `;
    
    const typeIcons = {
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'info': 'ℹ️'
    };
    
    notification.innerHTML = `
        <div class="d-flex align-items-center">
            <span class="me-2" style="font-size: 1.2rem;">${typeIcons[type] || 'ℹ️'}</span>
            <span class="flex-grow-1">${message}</span>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Initialize Bootstrap alert
    const bsAlert = new bootstrap.Alert(notification);
    
    // Auto remove after duration
    setTimeout(() => {
        if (notification.parentNode) {
            bsAlert.close();
        }
    }, duration);
    
    return notification;
}

// Global error handler
window.addEventListener('error', function(e) {
    console.error('❌ Global error in dashboard:', e.error);
    showNotification('Terjadi kesalahan. Silakan refresh halaman.', 'error');
});

// Global functions
window.startLearning = startLearning;
window.startGame = startGame;
window.playSound = playSound;
window.goToGamesDashboard = goToGamesDashboard;
window.showSection = showSection;
window.updateBackgroundMusicVolume = updateBackgroundMusicVolume;