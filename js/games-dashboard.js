// js/games-dashboard.js
import { auth, db } from './firebaseConfig.js';
import { 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { 
    doc, 
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

let userData = null;
let currentGame = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 Games Dashboard loaded successfully!');
    initGamesDashboard();
});

async function initGamesDashboard() {
    hideLoadingSpinner();
    await initUserData();
    initEventListeners();
    loadGamesProgress();
}

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

async function initUserData() {
    return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        userData = userDoc.data();
                        console.log('User data loaded:', userData); // Edit
                        updateGameInterface();
                        resolve(userData);
                    }
                } catch (error) {
                    console.error('Error getting user data:', error);
                    resolve(null);
                }
            } else {
                window.location.href = 'login.html';
                resolve(null);
            }
        });
    });
}

function updateGameInterface() {
    // Update points display
    const gamePoints = document.getElementById('gamePoints');
    if (gamePoints && userData.points !== undefined) {
        gamePoints.textContent = userData.points;
    }
}

function initEventListeners() {
    // Event listeners for game cards
    const gameCards = document.querySelectorAll('.game-selection-card');
    gameCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.classList.add('pulse');
        });
        
        card.addEventListener('mouseleave', function() {
            this.classList.remove('pulse');
        });
    });
}

function loadGamesProgress() {
    if (!userData) return;

    const games = ['tebak-huruf', 'hitung-cepat', 'mewarnai'];
    
    games.forEach(game => {
        updateGameProgress(game);
    });
}

function updateGameProgress(gameId) {
    if (!userData.gameProgress) {
        userData.gameProgress = {};
    }
    
    if (!userData.gameProgress[gameId]) {
        userData.gameProgress[gameId] = {
            completedLevels: [],
            badges: [],
            highestScore: 0,
            totalStars: 0
        };
    }
    
    const progress = userData.gameProgress[gameId];
    const completedLevels = progress.completedLevels || [];
    const badges = progress.badges || [];
    
    // Calculate progress percentage
    const totalLevels = 5;
    const progressPercent = (completedLevels.length / totalLevels) * 100;
    
    // Update progress bar
    const progressBar = document.getElementById(`${gameId}-progress`);
    const progressText = document.getElementById(`${gameId}-progress-text`);
    const badgesText = document.getElementById(`${gameId}-badges`);
    
    if (progressBar) {
        progressBar.style.width = `${progressPercent}%`;
    }
    
    if (progressText) {
        progressText.textContent = `${Math.round(progressPercent)}% selesai`;
    }
    
    if (badgesText) {
        badgesText.textContent = `${badges.length}/2 Lencana`;
    }
}

function selectGame(gameId) {
    currentGame = gameId;
    showLevelSelection(gameId);
    playSound('clickSound');
}

function showLevelSelection(gameId) {
    const modal = new bootstrap.Modal(document.getElementById('levelSelectionModal'));
    const modalTitle = document.getElementById('levelModalTitle');
    const levelsGrid = document.getElementById('levelsGrid');
    
    // Set modal title
    const gameTitles = {
        'tebak-huruf': 'Tebak Huruf',
        'hitung-cepat': 'Hitung Cepat',
        'mewarnai': 'Mewarnai'
    };
    
    modalTitle.textContent = `Pilih Level - ${gameTitles[gameId]}`;
    
    // Generate levels
    levelsGrid.innerHTML = generateLevelsHTML(gameId);
    
    // Show modal
    modal.show();
}

function generateLevelsHTML(gameId) {
    if (!userData.gameProgress) {
        userData.gameProgress = {};
    }
    
    if (!userData.gameProgress[gameId]) {
        userData.gameProgress[gameId] = {
            completedLevels: [],
            badges: [],
            highestScore: 0,
            totalStars: 0
        };
    }
    
    const gameProgress = userData.gameProgress[gameId];
    const completedLevels = gameProgress.completedLevels || [];
    
    console.log(`Game Progress for ${gameId}:`, gameProgress); // Debug
    
    let levelsHTML = '';
    
    for (let level = 1; level <= 5; level++) {
        const isCompleted = completedLevels.includes(level);
        const isUnlocked = level === 1 || completedLevels.includes(level - 1);
        
        // Hitung jumlah bintang berdasarkan performa
        const stars = calculateStars(gameId, level, gameProgress);
        
        const levelData = getLevelData(gameId, level);
        
        levelsHTML += `
            <div class="col-md-6 col-lg-4 mb-3">
                <div class="level-card ${isUnlocked ? '' : 'locked'}" 
                     onclick="${isUnlocked ? `startLevel('${gameId}', ${level})` : ''}">
                    <div class="level-number">
                        ${level}
                    </div>
                    <h5 class="level-title">${levelData.title}</h5>
                    <p class="level-description">${levelData.description}</p>
                    
                    <div class="level-stars">
                        ${generateStars(stars)}
                    </div>
                    
                    <div class="level-reward">
                        ${levelData.reward}
                    </div>
                    
                    ${!isUnlocked ? '<div class="mt-2"><i class="bi bi-lock-fill text-muted"></i> Terkunci</div>' : ''}
                    ${isCompleted ? '<div class="mt-2"><i class="bi bi-check-circle-fill text-success"></i> Selesai</div>' : ''}
                </div>
            </div>
        `;
    }
    
    return levelsHTML;
}

function calculateStars(gameId, level, gameProgress) {
    console.log(`Calculating stars for ${gameId} level ${level}:`, gameProgress); // Debug
    
    // Jika level belum diselesaikan, return 0 bintang
    if (!gameProgress.completedLevels || !gameProgress.completedLevels.includes(level)) {
        console.log(`Level ${level} not completed, returning 0 stars`);
        return 0;
    }
    
    // Untuk game Tebak Huruf, hitung bintang berdasarkan akurasi
    if (gameId === 'tebak-huruf') {
        const levelStars = gameProgress[`level${level}Stars`] || 0;
        console.log(`Tebak Huruf Level ${level} stars: ${levelStars}`);
        return levelStars;
    }
    
    // Untuk game Hitung Cepat, hitung bintang berdasarkan skor
    if (gameId === 'hitung-cepat') {
        const levelScores = gameProgress.levelScores || {};
        const levelScore = levelScores[level] || 0;
        
        console.log(`Hitung Cepat Level ${level} score: ${levelScore}`);
        
        // Tentukan bintang berdasarkan skor (maksimal skor sekitar 300)
        let stars = 0;
        if (levelScore >= 200) stars = 3;
        else if (levelScore >= 150) stars = 2;
        else if (levelScore >= 100) stars = 1;
        
        console.log(`Calculated stars: ${stars}`);
        return stars;
    }
    
    // Untuk game Mewarnai, hitung bintang berdasarkan skor artistik
    if (gameId === 'mewarnai') {
        const levelStars = gameProgress[`level${level}Stars`] || 0;
        console.log(`Mewarnai Level ${level} stars: ${levelStars}`);
        return levelStars;
    }
    
    // Default: 1 bintang untuk level yang diselesaikan
    console.log(`Default 1 star for completed level ${level}`);
    return 1;
}

function getLevelData(gameId, level) {
    const levelData = {
        'tebak-huruf': {
            1: { title: 'Huruf A-E', description: 'Tebak huruf A sampai E', reward: '+10 Poin' },
            2: { title: 'Huruf F-J', description: 'Tebak huruf F sampai J', reward: '+15 Poin' },
            3: { title: 'Huruf K-O', description: 'Tebak huruf K sampai O', reward: '+20 Poin' },
            4: { title: 'Huruf P-T', description: 'Tebak huruf P sampai T', reward: '+25 Poin' },
            5: { title: 'Huruf U-Z', description: 'Tebak huruf U sampai Z', reward: 'Lencana Huruf' }
        },
        'hitung-cepat': {
            1: { title: 'Penjumlahan Dasar', description: '1 + 1 sampai 5 + 5', reward: '+10 Poin' },
            2: { title: 'Pengurangan Sederhana', description: '10 - 1 sampai 10 - 5', reward: '+15 Poin' },
            3: { title: 'Penjumlahan Lanjut', description: 'Angka 1-20', reward: '+20 Poin' },
            4: { title: 'Pengurangan Lanjut', description: 'Angka 10-20', reward: '+25 Poin' },
            5: { title: 'Campuran', description: 'Berhitung campuran', reward: 'Lencana Matematika' }
        },
        'mewarnai': {
            1: { title: 'Buah-buahan', description: 'Warnai gambar buah', reward: '+10 Poin' },
            2: { title: 'Hewan Lucu', description: 'Warnai gambar hewan', reward: '+15 Poin' },
            3: { title: 'Rumah ', description: 'Warnai gambar Rumah', reward: '+20 Poin' },
            4: { title: 'Pemandangan', description: 'Warnai pemandangan', reward: '+25 Poin' },
            5: { title: 'Kreasi Bebas', description: 'Warnai gambar bebas', reward: 'Lencana Seni' }
        }
    };
    
    return levelData[gameId][level] || { title: `Level ${level}`, description: 'Tantangan seru!', reward: '+10 Poin' };
}

function generateStars(count) {
    let starsHTML = '';
    for (let i = 1; i <= 3; i++) {
        starsHTML += `<i class="bi bi-star-fill star ${i <= count ? 'filled' : ''}"></i>`;
    }
    return starsHTML;
}

function startLevel(gameId, level) {
    console.log(`Starting ${gameId} level ${level}`);
    playSound('clickSound');
    
    // Redirect to the actual game page
    setTimeout(() => {
        window.location.href = `game-${gameId}.html?level=${level}`;
    }, 500);
}

function goBackToDashboard() {
    playSound('clickSound');
    window.location.href = 'dashboard.html';
}

function playSound(soundId) {
    console.log('Sound effect:', soundId);
    // Sound effects will be implemented later
}

// Global functions
window.selectGame = selectGame;
window.startLevel = startLevel;
window.goBackToDashboard = goBackToDashboard;
