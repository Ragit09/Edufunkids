// js/game-hitung-cepat.js
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
let totalQuestions = 15;
let correctAnswers = 0;
let timer = 60;
let timerInterval = null;

// Audio variables
let backgroundMusic = null;
let clickSound = null;
let correctSound = null;
let completionSound = null;
let clappingSound = null;

// Game data for different levels
const gameLevels = {
    1: {
        type: 'addition',
        range: [1, 10],
        description: 'Penjumlahan Dasar (1-10)'
    },
    2: {
        type: 'subtraction',
        range: [1, 10],
        description: 'Pengurangan Sederhana (1-10)'
    },
    3: {
        type: 'addition',
        range: [10, 20],
        description: 'Penjumlahan Lanjut (10-20)'
    },
    4: {
        type: 'subtraction',
        range: [10, 20],
        description: 'Pengurangan Lanjut (10-20)'
    },
    5: {
        type: 'mixed',
        range: [1, 20],
        description: 'Campuran Penjumlahan & Pengurangan'
    }
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 Hitung Cepat Game loaded successfully!');
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
                        console.log('User data loaded in game:', userData);
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
    // Update UI
    document.getElementById('currentLevel').textContent = currentLevel;
    document.getElementById('currentScore').textContent = currentScore;
}

function startGame() {
    currentQuestion = 0;
    correctAnswers = 0;
    currentScore = 0;
    timer = 60;
    
    updateScore();
    updateTimer();
    startTimer();
    nextQuestion();
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timer--;
        updateTimer();
        
        if (timer <= 0) {
            endGame();
        }
    }, 1000);
}

function updateTimer() {
    const timerElement = document.getElementById('timer');
    const timerDisplay = document.querySelector('.timer-display');
    
    timerElement.textContent = timer;
    
    // Update timer color based on remaining time
    timerDisplay.className = 'timer-display';
    if (timer <= 10) {
        timerDisplay.classList.add('danger');
    } else if (timer <= 30) {
        timerDisplay.classList.add('warning');
    }
}

function nextQuestion() {
    if (currentQuestion >= totalQuestions) {
        endGame();
        return;
    }
    
    currentQuestion++;
    updateProgress();
    
    // Generate math problem based on level
    const problem = generateMathProblem();
    
    // Display problem
    document.getElementById('mathProblem').textContent = problem.question + ' = ?';
    
    // Generate options
    generateOptions(problem.correctAnswer, problem.type);
}

function generateMathProblem() {
    const levelData = gameLevels[currentLevel];
    const [min, max] = levelData.range;
    
    let a, b, question, correctAnswer, type;
    
    if (levelData.type === 'mixed') {
        type = Math.random() > 0.5 ? 'addition' : 'subtraction';
    } else {
        type = levelData.type;
    }
    
    if (type === 'addition') {
        a = Math.floor(Math.random() * (max - min + 1)) + min;
        b = Math.floor(Math.random() * (max - min + 1)) + min;
        question = `${a} + ${b}`;
        correctAnswer = a + b;
    } else {
        // Subtraction - ensure positive result
        a = Math.floor(Math.random() * (max - min + 1)) + min;
        b = Math.floor(Math.random() * (a - min + 1)) + min;
        question = `${a} - ${b}`;
        correctAnswer = a - b;
    }
    
    return { question, correctAnswer, type };
}

function generateOptions(correctAnswer, type) {
    const optionsGrid = document.getElementById('optionsGrid');
    const optionsCount = 4;
    
    // Create options array with correct answer
    let options = [correctAnswer];
    
    // Add wrong options
    const range = type === 'addition' ? 10 : 5;
    while (options.length < optionsCount) {
        let wrongAnswer;
        do {
            wrongAnswer = correctAnswer + Math.floor(Math.random() * range * 2) - range;
            // Ensure positive numbers for subtraction
            if (type === 'subtraction' && wrongAnswer < 0) {
                wrongAnswer = Math.abs(wrongAnswer);
            }
        } while (options.includes(wrongAnswer) || wrongAnswer === correctAnswer);
        
        options.push(wrongAnswer);
    }
    
    // Shuffle options
    options = shuffleArray(options);
    
    // Generate HTML for options
    optionsGrid.innerHTML = '';
    options.forEach((option, index) => {
        const optionHTML = `
            <div class="col-6">
                <button class="option-btn w-100" onclick="checkAnswer(${option}, ${correctAnswer})">
                    ${option}
                </button>
            </div>
        `;
        optionsGrid.innerHTML += optionHTML;
    });
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
        const btnValue = parseInt(btn.textContent);
        if (btnValue === correctAnswer) {
            btn.classList.add('correct');
            btn.classList.add('pulse');
        } else if (btnValue === selectedAnswer && !isCorrect) {
            btn.classList.add('incorrect');
            btn.classList.add('shake');
        }
    });
    
    // Update score
    if (isCorrect) {
        // Play correct sound
        playSound(correctSound);
        correctAnswers++;
        // Score based on remaining time and level
        const timeBonus = Math.floor(timer / 10);
        const levelMultiplier = currentLevel;
        currentScore += 10 + timeBonus + levelMultiplier;
        updateScore();
    }
    
    // Next question after delay
    setTimeout(() => {
        nextQuestion();
    }, 1500);
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
    clearInterval(timerInterval);
    
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
    
    // Calculate stars based on performance - SISTEM BINTANG KONSISTEN DENGAN DASHBOARD
    const accuracy = (correctAnswers / totalQuestions) * 100;
    let stars = calculateStarsBasedOnScore(currentScore);
    
    // Calculate points
    const basePoints = currentLevel * 15;
    const scorePoints = Math.floor(currentScore / 10);
    const accuracyBonus = correctAnswers > 0 ? Math.floor((correctAnswers / totalQuestions) * 50) : 0;
    const totalPoints = basePoints + scorePoints + accuracyBonus;
    
    // Show result modal
    showResultModal(totalPoints, stars);
    
    // Save game progress
    saveGameProgress(totalPoints, stars);
}

function calculateStarsBasedOnScore(score) {
    // Sistem bintang konsisten dengan games-dashboard
    let stars = 1; // Default 1 bintang
    
    if (score >= 200) stars = 3;      // Skor ≥200: 3 bintang
    else if (score >= 150) stars = 2; // Skor 150-199: 2 bintang
    else if (score >= 100) stars = 1; // Skor 100-149: 1 bintang
    // Kurang dari 100 tetap 1 bintang (sebagai penyelesaian level)
    
    console.log(`Score: ${score}, Stars: ${stars}`);
    return stars;
}

function showResultModal(totalPoints, stars) {
    const modal = new bootstrap.Modal(document.getElementById('resultModal'));
    const resultTitle = document.getElementById('resultTitle');
    const resultMessage = document.getElementById('resultMessage');
    const questionsAnswered = document.getElementById('questionsAnswered');
    const finalScore = document.getElementById('finalScore');
    const earnedPoints = document.getElementById('earnedPoints');
    const totalQuestionsElement = document.getElementById('totalQuestions');
    
    // Update modal content
    const accuracy = (correctAnswers / totalQuestions) * 100;
    if (accuracy >= 80) {
        resultTitle.textContent = 'Luar Biasa! 🎉';
        resultMessage.textContent = 'Kamu jago matematika!';
    } else if (accuracy >= 60) {
        resultTitle.textContent = 'Bagus! 👍';
        resultMessage.textContent = 'Terus berlatih ya!';
    } else {
        resultTitle.textContent = 'Coba Lagi! 💪';
        resultMessage.textContent = 'Jangan menyerah!';
    }
    
    questionsAnswered.textContent = correctAnswers;
    totalQuestionsElement.textContent = totalQuestions;
    finalScore.textContent = currentScore;
    earnedPoints.textContent = `+${totalPoints}`;
    
    // Add star rating to modal - KONSISTEN DENGAN TAMPILAN DASHBOARD
    const starRatingHTML = `
        <div class="star-rating">
            <div class="d-flex justify-content-center mb-2">
                ${generateStarsHTML(stars)}
            </div>
            <p class="text-muted mb-0">${getStarMessage(stars)}</p>
        </div>
    `;
    
    // Insert star rating after score summary
    const scoreSummary = document.querySelector('.score-summary');
    if (scoreSummary) {
        // Remove existing star rating if any
        const existingStarRating = document.querySelector('.star-rating');
        if (existingStarRating) {
            existingStarRating.remove();
        }
        scoreSummary.insertAdjacentHTML('afterend', starRatingHTML);
    }
    
    modal.show();
}

function generateStarsHTML(stars) {
    let starsHTML = '';
    for (let i = 1; i <= 3; i++) {
        const starClass = i <= stars ? 'filled' : '';
        starsHTML += `<i class="bi bi-star-fill star ${starClass}"></i>`;
    }
    return starsHTML;
}

function getStarMessage(stars) {
    switch(stars) {
        case 3:
            return 'Sempurna! Skor tinggi sekali! 🌟';
        case 2:
            return 'Bagus! Hampir sempurna! ✨';
        case 1:
            return 'Lumayan! Terus berlatih! 💪';
        default:
            return 'Pertahankan semangat belajar! 📚';
    }
}

async function saveGameProgress(pointsEarned, stars) {
    if (!userData || !auth.currentUser) return;
    
    try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const gameId = 'hitung-cepat';
        
        console.log('Saving game progress...');
        console.log('Current level:', currentLevel);
        console.log('Current score:', currentScore);
        console.log('Stars earned:', stars);
        
        // Initialize game progress if not exists
        if (!userData.gameProgress) {
            userData.gameProgress = {};
            console.log('Initialized gameProgress object');
        }
        if (!userData.gameProgress[gameId]) {
            userData.gameProgress[gameId] = {
                completedLevels: [],
                badges: [],
                highestScore: 0,
                totalQuestions: 0,
                levelScores: {},
                levelStars: {}
            };
            console.log('Initialized game progress for hitung-cepat');
        }
        
        const gameProgress = userData.gameProgress[gameId];
        
        // Update completed levels
        if (!gameProgress.completedLevels.includes(currentLevel)) {
            gameProgress.completedLevels.push(currentLevel);
            console.log(`Level ${currentLevel} added to completed levels`);
        }
        
        // Update highest score
        gameProgress.highestScore = Math.max(gameProgress.highestScore, currentScore);
        console.log(`Highest score updated: ${gameProgress.highestScore}`);
        
        // Update total questions answered
        gameProgress.totalQuestions = (gameProgress.totalQuestions || 0) + totalQuestions;
        
        // Simpan skor untuk level saat ini
        if (!gameProgress.levelScores) {
            gameProgress.levelScores = {};
            console.log('Initialized levelScores object');
        }
        
        const previousScore = gameProgress.levelScores[currentLevel] || 0;
        gameProgress.levelScores[currentLevel] = Math.max(previousScore, currentScore);
        
        console.log(`Level ${currentLevel} score saved: ${gameProgress.levelScores[currentLevel]} (previous: ${previousScore})`);
        console.log('All level scores:', gameProgress.levelScores);
        
        // Simpan bintang untuk level saat ini - KONSISTEN DENGAN DASHBOARD
        if (!gameProgress.levelStars) {
            gameProgress.levelStars = {};
            console.log('Initialized levelStars object');
        }
        
        const previousStars = gameProgress.levelStars[currentLevel] || 0;
        gameProgress.levelStars[currentLevel] = Math.max(previousStars, stars);
        
        console.log(`Level ${currentLevel} stars saved: ${gameProgress.levelStars[currentLevel]} (previous: ${previousStars})`);
        console.log('All level stars:', gameProgress.levelStars);
        
        // Check for badges
        checkAndAwardBadges(gameProgress);
        
        // Update user points
        const newPoints = (userData.points || 0) + pointsEarned;
        
        // Update Firestore
        await updateDoc(userRef, {
            points: newPoints,
            [`gameProgress.${gameId}`]: gameProgress
        });
        
        console.log('Game progress saved successfully to Firestore');
        console.log('Final game progress:', gameProgress);
        
    } catch (error) {
        console.error('Error saving game progress:', error);
    }
}

function checkAndAwardBadges(gameProgress) {
    const badges = gameProgress.badges || [];
    
    // Badge for completing all levels
    if (gameProgress.completedLevels.length >= 5 && !badges.includes('matematika-master')) {
        badges.push('matematika-master');
        showBadgeNotification('Lencana Master Matematika', 'Selamat! Kamu telah menyelesaikan semua level hitung cepat!');
    }
    
    // Badge for high score
    if (gameProgress.highestScore >= 200 && !badges.includes('cepat-tangan')) {
        badges.push('cepat-tangan');
        showBadgeNotification('Lencana Cepat Tangan', 'Kamu sangat cepat dalam berhitung!');
    }
    
    // Badge for perfect stars
    const totalStars = Object.values(gameProgress.levelStars || {}).reduce((sum, stars) => sum + stars, 0);
    if (totalStars >= 10 && !badges.includes('bintang-matematika')) {
        badges.push('bintang-matematika');
        showBadgeNotification('Lencana Bintang Matematika', 'Kamu mendapatkan banyak bintang sempurna!');
    }
    
    gameProgress.badges = badges;
}

function showBadgeNotification(title, message) {
    // Create notification
    const notification = document.createElement('div');
    notification.className = 'alert alert-success alert-dismissible fade show position-fixed';
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
            <i class="bi bi-calculator me-2" style="font-size: 1.5rem;"></i>
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
        window.location.href = `game-hitung-cepat.html?level=${nextLevel}`;
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