// js/game-tebak-huruf.js
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
let currentLevel = 1;
let currentScore = 0;
let currentQuestion = 0;
let totalQuestions = 10;
let correctAnswers = 0;
let gameData = null;

// Audio variables
let backgroundMusic = null;
let clickSound = null;
let correctSound = null;
let completionSound = null;
let clappingSound = null;

// Game data for different levels
const gameLevels = {
    1: {
        letters: ['A', 'B', 'C', 'D', 'E'],
        objects: {
            'A': { name: 'Apel', image: '../img/apel.png' },
            'B': { name: 'Bola', image: '../img/bola.png' },
            'C': { name: 'Cicak', image: '../img/cicak.png' },
            'D': { name: 'Dadu', image: '../img/dadu.png' },
            'E': { name: 'Es Krim', image: '../img/es-krim.png' }
        }
    },
    2: {
        letters: ['F', 'G', 'H', 'I', 'J'],
        objects: {
            'F': { name: 'Foto', image: '../img/foto.png' },
            'G': { name: 'Gajah', image: '../img/gajah.png' },
            'H': { name: 'Hiu', image: '../img/hiu.png' },
            'I': { name: 'Ikan', image: '../img/ikan.png' },
            'J': { name: 'Jagung', image: '../img/jagung.png' }
        }
    },
    3: {
        letters: ['K', 'L', 'M', 'N', 'O'],
        objects: {
            'K': { name: 'Kucing', image: '../img/kucing.png' },
            'L': { name: 'Lemon', image: '../img/lemon.png' },
            'M': { name: 'Mobil', image: '../img/mobil.png' },
            'N': { name: 'Naga', image: '../img/naga.png' },
            'O': { name: 'Owl', image: '../img/owl.png' }
        }
    },
    4: {
        letters: ['P', 'Q', 'R', 'S', 'T'],
        objects: {
            'P': { name: 'Pisang', image: '../img/pisang.png' },
            'Q': { name: 'Queen', image: '../img/queen.png' },
            'R': { name: 'Rusa', image: '../img/rusa.png' },
            'S': { name: 'Sun', image: '../img/sun.png' },
            'T': { name: 'Topi', image: '../img/topi.png' }
        }
    },
    5: {
        letters: ['U', 'V', 'W', 'X', 'Y', 'Z'],
        objects: {
            'U': { name: 'Ubur', image: '../img/ubur.png' },
            'V': { name: 'Violet', image: '../img/violet.png' },
            'W': { name: 'Wortel', image: '../img/wortel.png' },
            'X': { name: 'Xylophone', image: '../img/xylophone.png' },
            'Y': { name: 'Yoyo', image: '../img/yoyo.png' },
            'Z': { name: 'Zebra', image: '../img/zebra.png' }
        }
    }
};

// Variables untuk mencegah soal double
let usedLetters = [];
let currentCorrectLetter = '';

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 Tebak Huruf Game loaded successfully!');
    initGame();
});

async function initGame() {
    // Get level from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    currentLevel = parseInt(urlParams.get('level')) || 1;
    
    await initUserData();
    loadGameData();
    initAudio();
    startGame();
}

async function initUserData() {
    return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        userData = userDoc.data();
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

function initAudio() {
    backgroundMusic = document.getElementById('backgroundMusic');
    clickSound = document.getElementById('clickSound');
    correctSound = document.getElementById('correctSound');
    completionSound = document.getElementById('completionSound');
    clappingSound = document.getElementById('clappingSound');
    
    // Set volume
    backgroundMusic.volume = 0.5;
    clickSound.volume = 0.7;
    correctSound.volume = 0.7;
    completionSound.volume = 0.8;
    clappingSound.volume = 0.8;
    
    // Start background music
    backgroundMusic.play().catch(e => {
        console.log('Autoplay prevented, waiting for user interaction');
    });
}

function loadGameData() {
    gameData = gameLevels[currentLevel];
    
    // Update UI
    document.getElementById('currentLevel').textContent = currentLevel;
    document.getElementById('currentScore').textContent = currentScore;
    
    if (!gameData) {
        console.error('Game data not found for level:', currentLevel);
        return;
    }
}

function startGame() {
    currentQuestion = 0;
    correctAnswers = 0;
    currentScore = 0;
    usedLetters = []; // Reset used letters
    updateScore();
    nextQuestion();
}

function nextQuestion() {
    if (currentQuestion >= totalQuestions) {
        endGame();
        return;
    }
    
    currentQuestion++;
    updateProgress();
    
    // Get random letter that hasn't been used recently
    const availableLetters = gameData.letters.filter(letter => !usedLetters.includes(letter));
    let randomLetter;
    
    if (availableLetters.length > 0) {
        randomLetter = availableLetters[Math.floor(Math.random() * availableLetters.length)];
    } else {
        // Jika semua huruf sudah digunakan, reset dan mulai lagi
        usedLetters = [];
        randomLetter = gameData.letters[Math.floor(Math.random() * gameData.letters.length)];
    }
    
    // Simpan huruf yang digunakan
    usedLetters.push(randomLetter);
    currentCorrectLetter = randomLetter;
    
    const correctObject = gameData.objects[randomLetter];
    
    // Display question - TIDAK MENAMPILKAN HURUF LAGI
    document.getElementById('questionText').textContent = `huruf apakah yang dimulai benda ini?`;
    
    // Display image (using placeholder if image not found)
    const imageElement = document.getElementById('objectImage');
    imageElement.src = correctObject.image;
    imageElement.alt = correctObject.name;
    imageElement.onerror = function() {
        this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y4ZjlmYSIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM2YzE3YzMiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj4kewogICAgICBjb3JyZWN0T2JqZWN0Lm5hbWUKICAgIH08L3RleHQ+PC9zdmc+';
    };
    
    // Generate options
    generateOptions(randomLetter, correctObject.name);
}

function generateOptions(correctLetter, correctAnswer) {
    const optionsGrid = document.getElementById('optionsGrid');
    const optionsCount = 4; // SELALU 4 PILIHAN
    
    // Create options array with correct answer
    let options = [correctAnswer];
    
    // Add wrong options from current level first
    const allObjects = Object.values(gameData.objects).map(obj => obj.name);
    const wrongObjects = allObjects.filter(name => name !== correctAnswer);
    
    // Ambil maksimal 3 pilihan salah dari level saat ini
    let wrongOptionsFromLevel = [];
    while (wrongOptionsFromLevel.length < 3 && wrongObjects.length > 0) {
        const randomIndex = Math.floor(Math.random() * wrongObjects.length);
        const wrongOption = wrongObjects.splice(randomIndex, 1)[0];
        wrongOptionsFromLevel.push(wrongOption);
    }
    
    options = options.concat(wrongOptionsFromLevel);
    
    // Jika masih kurang dari 4 pilihan, tambahkan dari level lain
    if (options.length < optionsCount) {
        const additionalOptions = getAdditionalOptions(correctAnswer, options);
        const needed = optionsCount - options.length;
        
        for (let i = 0; i < needed && i < additionalOptions.length; i++) {
            options.push(additionalOptions[i]);
        }
    }
    
    // Shuffle options
    options = shuffleArray(options);
    
    // Generate HTML untuk options
    optionsGrid.innerHTML = '';
    
    // Baris pertama (2 pilihan)
    let firstRowHTML = '';
    for (let i = 0; i < 2; i++) {
        firstRowHTML += `
            <div class="col-6">
                <button class="option-btn w-100" onclick="checkAnswer('${options[i]}', '${correctAnswer}')">
                    ${options[i]}
                </button>
            </div>
        `;
    }
    
    // Baris kedua (2 pilihan)
    let secondRowHTML = '';
    for (let i = 2; i < 4; i++) {
        secondRowHTML += `
            <div class="col-6">
                <button class="option-btn w-100" onclick="checkAnswer('${options[i]}', '${correctAnswer}')">
                    ${options[i]}
                </button>
            </div>
        `;
    }
    
    optionsGrid.innerHTML = firstRowHTML + secondRowHTML;
}

function getAdditionalOptions(correctAnswer, existingOptions) {
    let allPossibleOptions = [];
    
    // Kumpulkan semua objek dari semua level kecuali yang sudah ada
    for (let level = 1; level <= 5; level++) {
        const levelObjects = Object.values(gameLevels[level].objects).map(obj => obj.name);
        const filteredObjects = levelObjects.filter(name => 
            name !== correctAnswer && !existingOptions.includes(name)
        );
        allPossibleOptions = allPossibleOptions.concat(filteredObjects);
    }
    
    // Hapus duplikat dan acak
    allPossibleOptions = [...new Set(allPossibleOptions)];
    return shuffleArray(allPossibleOptions);
}

function checkAnswer(selectedAnswer, correctAnswer) {
    const isCorrect = selectedAnswer === correctAnswer;
    const optionButtons = document.querySelectorAll('.option-btn');
    
    // Play click sound
    playSound(clickSound);
    
    // Disable all buttons
    optionButtons.forEach(btn => {
        btn.disabled = true;
        btn.style.cursor = 'not-allowed';
    });
    
    // Highlight correct and incorrect answers
    optionButtons.forEach(btn => {
        if (btn.textContent.trim() === correctAnswer) {
            btn.classList.add('correct');
        } else if (btn.textContent.trim() === selectedAnswer && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });
    
    // Show feedback - TAMPILKAN HURUF YANG BENAR
    const feedbackMessage = document.getElementById('feedbackMessage');
    const correctLetter = currentCorrectLetter;
    feedbackMessage.textContent = isCorrect ? 
        `Benar! 🎉 ${correctAnswer} dimulai dengan huruf ${correctLetter}` : 
        `Salah! 😢 ${correctAnswer} dimulai dengan huruf ${correctLetter}`;
    feedbackMessage.className = `feedback-message show ${isCorrect ? 'correct' : 'incorrect'}`;
    
    // Update score
    if (isCorrect) {
        // Play correct sound
        playSound(correctSound);
        correctAnswers++;
        currentScore += 10;
        updateScore();
    }
    
    // Next question after delay
    setTimeout(() => {
        feedbackMessage.classList.remove('show');
        nextQuestion();
    }, 2000);
}

function updateProgress() {
    const progressPercent = (currentQuestion / totalQuestions) * 100;
    document.getElementById('gameProgressBar').style.width = `${progressPercent}%`;
    document.getElementById('progressText').textContent = `${currentQuestion}/${totalQuestions}`;
}

function updateScore() {
    document.getElementById('currentScore').textContent = currentScore;
}

function endGame() {
    // Stop background music
    if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    }
    
    // Play completion sounds
    playSound(completionSound);
    setTimeout(() => {
        playSound(clappingSound);
    }, 500);
    
    // Calculate stars based on performance
    const accuracy = (correctAnswers / totalQuestions) * 100;
    let stars = 1;
    
    if (accuracy === 100) stars = 3;
    else if (accuracy >= 80) stars = 3;
    else if (accuracy >= 60) stars = 2;
    else stars = 1;
    
    // Calculate points
    const basePoints = currentLevel * 10;
    const bonusPoints = Math.floor(currentScore * (stars / 3));
    const totalPoints = basePoints + bonusPoints;
    
    // Show result modal
    showResultModal(stars, totalPoints);
    
    // Save game progress
    saveGameProgress(stars, totalPoints);
}

function showResultModal(stars, totalPoints) {
    const modal = new bootstrap.Modal(document.getElementById('resultModal'));
    const modalBody = document.querySelector('#resultModal .modal-body');
    
    // Calculate performance message based on accuracy
    const accuracy = (correctAnswers / totalQuestions) * 100;
    let resultTitle = '';
    let resultMessage = '';
    
    if (accuracy === 100) {
        resultTitle = 'Luar Biasa! 🎉';
        resultMessage = 'Kamu jago mengenal huruf!';
    } else if (accuracy >= 80) {
        resultTitle = 'Bagus! 👍';
        resultMessage = 'Terus berlatih ya!';
    } else {
        resultTitle = 'Coba Lagi! 💪';
        resultMessage = 'Jangan menyerah!';
    }
    
    // Update modal content
    modalBody.innerHTML = `
        <div class="text-center">
            <div class="trophy-icon trophy-rotate">
                <i class="bi bi-trophy-fill"></i>
            </div>
            <h3 id="resultTitle" class="mb-2">${resultTitle}</h3>
            <p id="resultMessage" class="text-muted mb-4">${resultMessage}</p>
            <div class="score-summary">
                <div class="score-item">
                    <span>Soal Dijawab:</span>
                    <strong class="text-primary">${correctAnswers}</strong>/<span>${totalQuestions}</span>
                </div>
                <div class="score-item">
                    <span>Skor Akhir:</span>
                    <strong class="text-primary">${currentScore}</strong>
                </div>
                <div class="score-item">
                    <span>Poin:</span>
                    <strong class="text-success">+${totalPoints}</strong>
                </div>
            </div>
            
            <!-- Star Rating -->
            <div class="star-rating">
                <div class="d-flex justify-content-center mb-2">
                    ${Array.from({length: 3}, (_, i) => 
                        `<i class="bi bi-star-fill star ${i < stars ? 'filled' : ''}"></i>`
                    ).join('')}
                </div>
                <p class="text-muted mb-0">${getStarMessage(stars)}</p>
            </div>
            
            <!-- Tombol Aksi -->
            <div class="mt-4">
                ${currentLevel < 5 ? 
                    `<button class="btn btn-primary me-2" onclick="nextLevel()" style="padding: 0.7rem 1.5rem; border-radius: 25px;">
                        <i class="bi bi-arrow-right me-1"></i>Level Berikutnya
                    </button>` : 
                    ''
                }
                <button class="btn btn-secondary" onclick="exitGame()" style="padding: 0.7rem 1.5rem; border-radius: 25px;">
                    <i class="bi bi-house me-1"></i>Kembali
                </button>
            </div>
        </div>
    `;
    
    modal.show();
}

function getStarMessage(stars) {
    switch(stars) {
        case 3:
            return 'Sempurna! Semua jawaban benar! 🌟';
        case 2:
            return 'Bagus! Hampir sempurna! ✨';
        case 1:
            return 'Lumayan! Terus berlatih! 💪';
        default:
            return 'Pertahankan semangat belajar! 📚';
    }
}

async function saveGameProgress(stars, pointsEarned) {
    if (!userData || !auth.currentUser) return;
    
    try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const gameId = 'tebak-huruf';
        
        // Initialize game progress if not exists
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
        
        // Update completed levels
        if (!gameProgress.completedLevels.includes(currentLevel)) {
            gameProgress.completedLevels.push(currentLevel);
        }
        
        // Update stars for this level
        gameProgress[`level${currentLevel}Stars`] = Math.max(
            gameProgress[`level${currentLevel}Stars`] || 0,
            stars
        );
        
        // Update highest score
        gameProgress.highestScore = Math.max(gameProgress.highestScore, currentScore);
        
        // Update total stars
        gameProgress.totalStars = Object.keys(gameProgress)
            .filter(key => key.startsWith('level') && key.endsWith('Stars'))
            .reduce((total, key) => total + (gameProgress[key] || 0), 0);
        
        // Check for badges
        checkAndAwardBadges(gameProgress);
        
        // Update user points
        const newPoints = (userData.points || 0) + pointsEarned;
        
        // Update Firestore
        await updateDoc(userRef, {
            points: newPoints,
            [`gameProgress.${gameId}`]: gameProgress
        });
        
        console.log('Game progress saved successfully');
        
    } catch (error) {
        console.error('Error saving game progress:', error);
    }
}

function checkAndAwardBadges(gameProgress) {
    const badges = gameProgress.badges || [];
    
    // Badge for completing all levels
    if (gameProgress.completedLevels.length >= 5 && !badges.includes('master-huruf')) {
        badges.push('master-huruf');
        showBadgeNotification('Lencana Master Huruf', 'Selamat! Kamu telah menyelesaikan semua level huruf!');
    }
    
    // Badge for getting perfect score
    if (gameProgress.highestScore >= 100 && !badges.includes('perfectionist')) {
        badges.push('perfectionist');
        showBadgeNotification('Lencana Perfectionist', 'Kamu mendapatkan skor sempurna!');
    }
    
    gameProgress.badges = badges;
}

function showBadgeNotification(title, message) {
    // Create notification
    const notification = document.createElement('div');
    notification.className = 'alert alert-warning alert-dismissible fade show position-fixed';
    notification.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        border: none;
        border-radius: 15px;
    `;
    
    notification.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="bi bi-trophy-fill me-2" style="font-size: 1.5rem;"></i>
            <div class="flex-grow-1">
                <strong>${title}</strong><br>
                <small>${message}</small>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

function nextLevel() {
    // Stop background music
    if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    }
    
    const nextLevel = currentLevel + 1;
    if (nextLevel <= 5) {
        window.location.href = `game-tebak-huruf.html?level=${nextLevel}`;
    } else {
        exitGame();
    }
}

function exitGame() {
    // Stop background music
    if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    }
    window.location.href = 'games-dashboard.html';
}

// Utility function to shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Utility function to play sound
function playSound(audioElement) {
    if (audioElement) {
        audioElement.currentTime = 0;
        audioElement.play().catch(e => {
            console.log('Audio play failed:', e);
        });
    }
}

// Global functions
window.checkAnswer = checkAnswer;
window.nextLevel = nextLevel;
window.exitGame = exitGame;