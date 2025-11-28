// js/game-mewarnai.js
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
let timer = 300; // 5 minutes
let timerInterval = null;
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let currentTool = 'brush';
let currentColor = '#ff0000';
let currentBrushSize = 5;
let drawingHistory = [];
let currentStep = 0;
let gameCompleted = false;

// Canvas context
let ctx = null;
let refCtx = null;

// Audio variables
let backgroundMusic = null;
let clickSound = null;
let correctSound = null;
let completionSound = null;
let clappingSound = null;

// Game data for different levels
const gameLevels = {
    1: {
        title: "Buah Apel",
        description: "Warnai buah apel dengan warna merah yang segar!",
        referenceImage: "../img/apel-outline.png",
        targetColors: {
            'apple': '#ff0000',
            'leaf': '#00ff00',
            'stem': '#8B4513'
        },
        hints: [
            "Gunakan warna merah untuk buah apel",
            "Daunnya berwarna hijau",
            "Tangkai berwarna coklat"
        ]
    },
    2: {
        title: "Kupu-kupu",
        description: "Buat kupu-kupu menjadi colorful dan cantik!",
        referenceImage: "../img/butterfly-outline.png",
        targetColors: {
            'wings': '#ffeb3b',
            'body': '#795548',
            'details': '#ff5722'
        },
        hints: [
            "Sayap bisa berwarna kuning atau warna cerah lainnya",
            "Badan kupu-kupu berwarna coklat",
            "Tambahkan pola warna-warni"
        ]
    },
    3: {
        title: "Rumah Impian",
        description: "Warnai rumah impianmu dengan warna favorit!",
        referenceImage: "../img/house-outline.png",
        targetColors: {
            'walls': '#87CEEB',
            'roof': '#ff0000',
            'door': '#8B4513',
            'windows': '#ffff00'
        },
        hints: [
            "Dinding rumah bisa biru langit",
            "Atap berwarna merah",
            "Pintu berwarna coklat kayu",
            "Jendela berwarna kuning"
        ]
    },
    4: {
        title: "Pemandangan Laut",
        description: "Ciptakan pemandangan laut yang indah!",
        referenceImage: "../img/beach-outline.png",
        targetColors: {
            'sky': '#87CEEB',
            'sea': '#0000ff',
            'sand': '#f4a460',
            'sun': '#ffff00'
        },
        hints: [
            "Langit berwarna biru cerah",
            "Laut berwarna biru tua",
            "Pasir pantai berwarna kuning kecoklatan",
            "Matahari berwarna kuning"
        ]
    },
    5: {
        title: "Hewan Laut",
        description: "Warnai ikan dan teman-teman lautnya!",
        referenceImage: "../img/fish-outline.png",
        targetColors: {
            'fish': '#ff6b6b',
            'bubbles': '#87CEEB',
            'coral': '#ff1493',
            'water': '#1e90ff'
        },
        hints: [
            "Ikan bisa berwarna merah atau orange",
            "Gelembung udara berwarna biru muda",
            "Karang laut berwarna pink cerah",
            "Air laut berwarna biru"
        ]
    }
};

// Color palette
const colorPalette = [
    { name: 'Merah', value: '#ff0000' },
    { name: 'Biru', value: '#0000ff' },
    { name: 'Hijau', value: '#00ff00' },
    { name: 'Kuning', value: '#ffff00' },
    { name: 'Ungu', value: '#800080' },
    { name: 'Orange', value: '#ffa500' },
    { name: 'Pink', value: '#ff69b4' },
    { name: 'Coklat', value: '#8B4513' },
    { name: 'Hitam', value: '#000000' },
    { name: 'Putih', value: '#ffffff' },
    { name: 'Abu-abu', value: '#808080' },
    { name: 'Emas', value: '#ffd700' }
];

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎨 Game Mewarnai loaded successfully!');
    initGame();
});

async function initGame() {
    // Get level from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    currentLevel = parseInt(urlParams.get('level')) || 1;
    
    await initUserData();
    initCanvas();
    initBackgroundMusic();
    loadGameData();
    initEventListeners();
    startGame();
}

// Fungsi untuk menginisialisasi audio
function initBackgroundMusic() {
    backgroundMusic = document.getElementById('gameBackgroundMusic');
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
    
    // Auto-play dengan handling user interaction
    const playMusic = () => {
        if (backgroundMusic.paused) {
            backgroundMusic.play().catch(error => {
                console.log('Auto-play prevented by browser:', error);
            });
        }
        document.removeEventListener('click', playMusic);
        document.removeEventListener('touchstart', playMusic);
    };
    
    // Tunggu interaksi pengguna pertama kali untuk memulai musik
    document.addEventListener('click', playMusic);
    document.addEventListener('touchstart', playMusic);
    
    // Coba play otomatis (mungkin tidak bekerja di beberapa browser)
    setTimeout(() => {
        if (backgroundMusic.paused) {
            backgroundMusic.play().catch(error => {
                console.log('Background music requires user interaction');
            });
        }
    }, 1000);
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

function initCanvas() {
    const canvas = document.getElementById('drawingCanvas');
    const refCanvas = document.createElement('canvas');
    
    // Set responsive canvas size
    const container = canvas.parentElement;
    const maxWidth = 600;
    const maxHeight = 500;
    
    // Calculate responsive size
    const containerWidth = container.clientWidth;
    const scale = Math.min(1, containerWidth / maxWidth);
    
    const width = Math.min(maxWidth, containerWidth);
    const height = maxHeight * scale;
    
    canvas.width = width;
    canvas.height = height;
    refCanvas.width = width;
    refCanvas.height = height;
    
    ctx = canvas.getContext('2d');
    refCtx = refCanvas.getContext('2d');
    
    // Set canvas background to white
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Initialize drawing settings
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = currentBrushSize;
    ctx.strokeStyle = currentColor;
    ctx.fillStyle = currentColor;
    
    // Handle window resize
    window.addEventListener('resize', handleResize);
}

function handleResize() {
    if (gameCompleted) return;
    
    const canvas = document.getElementById('drawingCanvas');
    const container = canvas.parentElement;
    const maxWidth = 600;
    const maxHeight = 500;
    
    // Calculate new size
    const containerWidth = container.clientWidth;
    const scale = Math.min(1, containerWidth / maxWidth);
    
    const newWidth = Math.min(maxWidth, containerWidth);
    const newHeight = maxHeight * scale;
    
    // Only resize if dimensions changed significantly
    if (Math.abs(canvas.width - newWidth) > 10 || Math.abs(canvas.height - newHeight) > 10) {
        // Save current drawing
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        tempCtx.drawImage(canvas, 0, 0);
        
        // Resize canvas
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // Restore drawing with scaling
        ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, newWidth, newHeight);
        
        // Update brush size relative to new canvas size
        const sizeScale = newWidth / 600;
        ctx.lineWidth = currentBrushSize * sizeScale;
        
        // Redraw reference image if it exists
        const refImage = document.getElementById('refImage');
        if (refImage.complete && refImage.naturalWidth !== 0) {
            refCtx.clearRect(0, 0, refCtx.canvas.width, refCtx.canvas.height);
            refCtx.drawImage(refImage, 0, 0, refCtx.canvas.width, refCtx.canvas.height);
        }
        
        updateCursor();
    }
}

function loadGameData() {
    const levelData = gameLevels[currentLevel];
    
    if (!levelData) {
        console.error('Level data not found:', currentLevel);
        return;
    }
    
    // Update UI
    document.getElementById('currentLevel').textContent = currentLevel;
    document.getElementById('drawingTitle').textContent = levelData.title;
    document.getElementById('drawingDescription').textContent = levelData.description;
    
    // Load reference image
    const refImage = document.getElementById('refImage');
    refImage.src = levelData.referenceImage;
    refImage.onload = function() {
        // Draw reference image on canvas for tracing with proper scaling
        const canvas = document.getElementById('drawingCanvas');
        refCtx.clearRect(0, 0, refCtx.canvas.width, refCtx.canvas.height);
        refCtx.drawImage(refImage, 0, 0, refCtx.canvas.width, refCtx.canvas.height);
    };
    
    // Initialize color palette
    initColorPalette();
    
    // Initialize tools
    initTools();
}

function initColorPalette() {
    const paletteContainer = document.getElementById('colorPalette');
    paletteContainer.innerHTML = '';
    
    colorPalette.forEach((color, index) => {
        const colorBtn = document.createElement('button');
        colorBtn.className = `color-btn ${index === 0 ? 'active' : ''}`;
        colorBtn.style.backgroundColor = color.value;
        colorBtn.setAttribute('data-color', color.value);
        colorBtn.setAttribute('data-name', color.name);
        
        colorBtn.addEventListener('click', function() {
            selectColor(color.value, color.name);
        });
        
        paletteContainer.appendChild(colorBtn);
    });
    
    // Set initial color
    selectColor(colorPalette[0].value, colorPalette[0].name);
}

function initTools() {
    // Brush size buttons
    const brushSizeBtns = document.querySelectorAll('.brush-btn');
    brushSizeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            brushSizeBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentBrushSize = parseInt(this.getAttribute('data-size'));
            ctx.lineWidth = currentBrushSize;
        });
    });
    
    // Tool buttons
    const toolBtns = document.querySelectorAll('.tool-btn');
    toolBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            toolBtns.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentTool = this.getAttribute('data-tool');
            updateCursor();
        });
    });
    
    // Action buttons
    document.getElementById('undoBtn').addEventListener('click', undoLastAction);
    document.getElementById('clearBtn').addEventListener('click', clearCanvas);
    document.getElementById('hintBtn').addEventListener('click', showHint);
    document.getElementById('submitBtn').addEventListener('click', submitDrawing);
    document.getElementById('resetBtn').addEventListener('click', resetDrawing);
}

function initEventListeners() {
    const canvas = document.getElementById('drawingCanvas');
    
    // Mouse events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', stopDrawing);
}

function startGame() {
    timer = 300; // 5 minutes
    currentScore = 0;
    gameCompleted = false;
    updateScore();
    updateTimer();
    startTimer();
    updateProgress();
    
    // Pastikan musik diputar saat game dimulai
    if (backgroundMusic && backgroundMusic.paused) {
        backgroundMusic.play().catch(error => {
            console.log('Music play failed:', error);
        });
    }
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timer--;
        updateTimer();
        
        if (timer <= 0 && !gameCompleted) {
            endGame();
        }
    }, 1000);
}

function updateTimer() {
    const timerElement = document.getElementById('timer');
    const timerLarge = document.getElementById('timerLarge');
    const timerDisplay = document.querySelector('.timer-display');
    
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    if (timerElement) timerElement.textContent = timer;
    if (timerLarge) timerLarge.textContent = timeString;
    
    // Update timer color based on remaining time
    timerDisplay.className = 'timer-display';
    if (timer <= 30) {
        timerDisplay.classList.add('danger');
    } else if (timer <= 60) {
        timerDisplay.classList.add('warning');
    }
}

function updateScore() {
    document.getElementById('currentScore').textContent = currentScore;
}

function selectColor(color, name) {
    currentColor = color;
    
    // Update active color button
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-color') === color) {
            btn.classList.add('active');
        }
    });
    
    // Update current color display
    const currentColorElement = document.getElementById('currentColor');
    const currentColorName = document.getElementById('currentColorName');
    
    if (currentColorElement) {
        currentColorElement.style.backgroundColor = color;
    }
    if (currentColorName) {
        currentColorName.textContent = name;
    }
    
    // Update canvas context
    if (currentTool !== 'eraser') {
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
    }
    
    // Add to recent colors
    addToRecentColors(color, name);
}

function addToRecentColors(color, name) {
    const recentColorsContainer = document.getElementById('recentColors');
    const existingColors = Array.from(recentColorsContainer.querySelectorAll('.recent-color'));
    
    // Remove if color already exists
    existingColors.forEach(btn => {
        if (btn.style.backgroundColor === color) {
            btn.remove();
        }
    });
    
    // Add new color
    const colorBtn = document.createElement('div');
    colorBtn.className = 'recent-color';
    colorBtn.style.backgroundColor = color;
    colorBtn.setAttribute('data-color', color);
    colorBtn.setAttribute('data-name', name);
    
    colorBtn.addEventListener('click', function() {
        selectColor(color, name);
    });
    
    recentColorsContainer.insertBefore(colorBtn, recentColorsContainer.firstChild);
    
    // Limit to 6 recent colors
    if (recentColorsContainer.children.length > 6) {
        recentColorsContainer.removeChild(recentColorsContainer.lastChild);
    }
}

function updateCursor() {
    const canvas = document.getElementById('drawingCanvas');
    if (currentTool === 'eraser') {
        canvas.style.cursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${currentBrushSize * 2}" height="${currentBrushSize * 2}" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="white" stroke="black" stroke-width="2"/></svg>') ${currentBrushSize} ${currentBrushSize}, auto`;
    } else {
        canvas.style.cursor = 'crosshair';
    }
}

function startDrawing(e) {
    if (gameCompleted) return;
    
    isDrawing = true;
    [lastX, lastY] = getCoordinates(e);
    
    if (currentTool === 'fill') {
        floodFill(lastX, lastY);
        saveDrawingState();
    } else {
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
    }
}

function draw(e) {
    if (!isDrawing || gameCompleted) return;
    
    const [x, y] = getCoordinates(e);
    
    if (currentTool === 'brush') {
        ctx.lineTo(x, y);
        ctx.stroke();
    } else if (currentTool === 'eraser') {
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.restore();
    }
    
    [lastX, lastY] = [x, y];
    updateProgress();
}

function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        ctx.closePath();
        saveDrawingState();
    }
}

function getCoordinates(e) {
    const canvas = document.getElementById('drawingCanvas');
    const rect = canvas.getBoundingClientRect();
    
    // Calculate scale factors
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let x, y;
    
    if (e.type.includes('touch')) {
        x = (e.touches[0].clientX - rect.left) * scaleX;
        y = (e.touches[0].clientY - rect.top) * scaleY;
    } else {
        x = (e.clientX - rect.left) * scaleX;
        y = (e.clientY - rect.top) * scaleY;
    }
    
    return [x, y];
}

function handleTouchStart(e) {
    e.preventDefault();
    startDrawing(e);
}

function handleTouchMove(e) {
    e.preventDefault();
    draw(e);
}

function floodFill(startX, startY) {
    const canvas = document.getElementById('drawingCanvas');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    const startPos = (Math.floor(startY) * canvas.width + Math.floor(startX)) * 4;
    const startR = pixels[startPos];
    const startG = pixels[startPos + 1];
    const startB = pixels[startPos + 2];
    const startA = pixels[startPos + 3];
    
    // Convert current color to RGB
    const hex = currentColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Simple flood fill implementation
    const stack = [[Math.floor(startX), Math.floor(startY)]];
    const visited = new Set();
    
    while (stack.length > 0) {
        const [x, y] = stack.pop();
        const pos = (y * canvas.width + x) * 4;
        
        if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;
        if (visited.has(`${x},${y}`)) continue;
        
        // Check if pixel matches the target color
        if (pixels[pos] === startR && pixels[pos + 1] === startG && 
            pixels[pos + 2] === startB && pixels[pos + 3] === startA) {
            
            // Fill the pixel
            pixels[pos] = r;
            pixels[pos + 1] = g;
            pixels[pos + 2] = b;
            pixels[pos + 3] = 255;
            
            visited.add(`${x},${y}`);
            
            // Add neighbors to stack
            stack.push([x + 1, y]);
            stack.push([x - 1, y]);
            stack.push([x, y + 1]);
            stack.push([x, y - 1]);
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
}

function saveDrawingState() {
    const canvas = document.getElementById('drawingCanvas');
    drawingHistory.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    currentStep = drawingHistory.length - 1;
    
    // Enable/disable undo button
    document.getElementById('undoBtn').disabled = drawingHistory.length <= 1;
    
    // Enable submit button after some drawing
    if (drawingHistory.length > 5) {
        document.getElementById('submitBtn').disabled = false;
    }
}

function undoLastAction() {
    if (drawingHistory.length > 1 && !gameCompleted) {
        drawingHistory.pop();
        currentStep--;
        
        const previousState = drawingHistory[drawingHistory.length - 1];
        ctx.putImageData(previousState, 0, 0);
        
        document.getElementById('undoBtn').disabled = drawingHistory.length <= 1;
        updateProgress();
    }
}

function clearCanvas() {
    if (!gameCompleted && confirm('Apakah kamu yakin ingin menghapus semua warna?')) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        drawingHistory = [];
        saveDrawingState();
        updateProgress();
    }
}

function resetDrawing() {
    if (!gameCompleted && confirm('Apakah kamu yakin ingin memulai ulang dari awal?')) {
        clearCanvas();
        currentScore = 0;
        updateScore();
        timer = 300;
        updateTimer();
        document.getElementById('submitBtn').disabled = true;
    }
}

function updateProgress() {
    const canvas = document.getElementById('drawingCanvas');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    let coloredPixels = 0;
    let totalPixels = 0;
    
    // Count non-white pixels
    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        
        // If pixel is not white (or very close to white)
        if (!(r > 240 && g > 240 && b > 240)) {
            coloredPixels++;
        }
        totalPixels++;
    }
    
    const progress = (coloredPixels / totalPixels) * 100;
    const progressBar = document.getElementById('coloringProgress');
    const progressText = document.getElementById('progressText');
    
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
    if (progressText) {
        progressText.textContent = `${Math.round(progress)}% selesai`;
    }
    
    return progress;
}

function calculateArtisticScore() {
    const canvas = document.getElementById('drawingCanvas');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    let score = 0;
    let colorVariety = 0;
    let coverageScore = 0;
    let neatnessScore = 0;
    
    // Calculate coverage (area colored)
    let coloredPixels = 0;
    let totalPixels = 0;
    
    // Analyze color distribution and patterns
    const colorMap = new Map();
    let edgePixels = 0;
    
    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        
        totalPixels++;
        
        // Count colored pixels (not white)
        if (!(r > 240 && g > 240 && b > 240)) {
            coloredPixels++;
            
            // Track color variety
            const colorKey = `${r},${g},${b}`;
            colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
            
            // Check for edges (simplified edge detection)
            if (i > 4) {
                const prevR = pixels[i - 4];
                const prevG = pixels[i - 3];
                const prevB = pixels[i - 2];
                
                // If color changes significantly, it might be an edge
                if (Math.abs(r - prevR) > 50 || Math.abs(g - prevG) > 50 || Math.abs(b - prevB) > 50) {
                    edgePixels++;
                }
            }
        }
    }
    
    // Coverage score (0-40 points)
    coverageScore = (coloredPixels / totalPixels) * 40;
    
    // Color variety score (0-30 points)
    const uniqueColors = colorMap.size;
    colorVariety = Math.min(uniqueColors * 3, 30);
    
    // Neatness score (0-30 points) - based on edge consistency
    const edgeRatio = edgePixels / coloredPixels;
    neatnessScore = Math.min((1 - edgeRatio) * 30, 30);
    
    // Bonus for using multiple colors appropriately
    const colorBonus = uniqueColors >= 3 ? 10 : uniqueColors >= 2 ? 5 : 0;
    
    score = coverageScore + colorVariety + neatnessScore + colorBonus;
    
    console.log('Scoring breakdown:', {
        coverage: coverageScore,
        colorVariety: colorVariety,
        neatness: neatnessScore,
        colorBonus: colorBonus,
        total: score
    });
    
    return Math.min(Math.round(score), 100);
}

function showHint() {
    const levelData = gameLevels[currentLevel];
    const hintContent = document.getElementById('hintContent');
    
    if (levelData && levelData.hints) {
        hintContent.innerHTML = `
            <div class="hint-item">
                <i class="bi bi-lightbulb-fill text-warning"></i>
                <strong>Petunjuk Mewarnai:</strong>
            </div>
            <ul class="mt-2">
                ${levelData.hints.map(hint => `<li>${hint}</li>`).join('')}
            </ul>
            <div class="mt-3 p-3 bg-warning bg-opacity-10 rounded">
                <small><i class="bi bi-info-circle"></i> Gunakan imajinasimu! Warna bisa berbeda dari petunjuk.</small>
            </div>
        `;
    }
    
    const hintModal = new bootstrap.Modal(document.getElementById('hintModal'));
    hintModal.show();
}

function submitDrawing() {
    if (gameCompleted) return;
    
    clearInterval(timerInterval);
    gameCompleted = true;
    
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
    
    // Calculate artistic score based on quality
    const artisticScore = calculateArtisticScore();
    const progress = updateProgress();
    const timeBonus = Math.floor(timer / 6); // Bonus for remaining time (max 50 points)
    const completionBonus = progress >= 50 ? 20 : 0; // Bonus for good coverage
    
    const totalScore = artisticScore + timeBonus + completionBonus;
    currentScore = Math.min(totalScore, 150); // Cap at 150 points
    
    // Show result modal
    showResultModal(progress, artisticScore, timeBonus, completionBonus, currentScore);
    
    // Save game progress
    saveGameProgress(currentScore);
}

function endGame() {
    if (gameCompleted) return;
    
    clearInterval(timerInterval);
    gameCompleted = true;
    
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
    
    // Calculate score for automatic completion
    const artisticScore = calculateArtisticScore();
    const progress = updateProgress();
    
    // Penalty for not finishing manually
    const timePenalty = -10;
    const completionBonus = progress >= 50 ? 10 : 0;
    
    const totalScore = Math.max(artisticScore + timePenalty + completionBonus, 10);
    currentScore = totalScore;
    
    // Show result modal with time's up message
    showResultModal(progress, artisticScore, timePenalty, completionBonus, currentScore, true);
    
    // Save game progress
    saveGameProgress(currentScore);
}

function createResultPreview() {
    const resultCanvas = document.getElementById('resultPreview');
    const resultCtx = resultCanvas.getContext('2d');
    const mainCanvas = document.getElementById('drawingCanvas');
    
    // Set result canvas size untuk preview
    resultCanvas.width = 300;
    resultCanvas.height = 250;
    
    // Clear canvas dan set background putih
    resultCtx.fillStyle = 'white';
    resultCtx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);
    
    // Draw the main canvas content scaled down dengan kualitas baik
    resultCtx.imageSmoothingEnabled = true;
    resultCtx.imageSmoothingQuality = 'high';
    resultCtx.drawImage(mainCanvas, 0, 0, resultCanvas.width, resultCanvas.height);
    
    // Tambahkan class animasi
    const previewContainer = document.querySelector('.preview-image-wrapper');
    if (previewContainer) {
        previewContainer.classList.add('preview-slide-in');
    }
}

function showResultModal(progress, artisticScore, timeBonus, completionBonus, totalScore, timeUp = false) {
    const modal = new bootstrap.Modal(document.getElementById('resultModal'));
    const modalBody = document.querySelector('#resultModal .modal-body');
    
    // Calculate performance message based on artistic score
    let resultTitle = '';
    let resultMessage = '';
    
    if (timeUp) {
        resultTitle = 'Waktu Habis! ⏰';
        resultMessage = 'Tapi hasil mewarnaimu tetap bagus!';
    } else if (artisticScore >= 70) {
        resultTitle = 'Luar Biasa! 🎉';
        resultMessage = 'Kamu sangat kreatif dalam mewarnai!';
    } else if (artisticScore >= 50) {
        resultTitle = 'Bagus Sekali! 👍';
        resultMessage = 'Hasil mewarnaimu sangat menarik!';
    } else {
        resultTitle = 'Coba Lagi! 💪';
        resultMessage = 'Terus berlatih untuk hasil yang lebih baik!';
    }
    
    // Calculate stars based on artistic score
    let stars = 1;
    if (artisticScore >= 80) stars = 3;
    else if (artisticScore >= 60) stars = 2;
    else stars = 1;
    
    // Update modal content dengan layout seperti game tebak huruf
    modalBody.innerHTML = `
        <div class="text-center">
            <div class="paint-icon paint-rotate">
                <i class="bi bi-palette-fill"></i>
            </div>
            <h3 id="resultTitle" class="mb-2">${resultTitle}</h3>
            <p id="resultMessage" class="text-muted mb-4">${resultMessage}</p>
            
            <!-- Preview Image Container -->
            <div class="result-preview-container">
                <h6>Hasil Karyamu</h6>
                <div class="preview-image-wrapper">
                    <canvas id="resultPreview" width="300" height="250"></canvas>
                    <div class="preview-badge">KARYAMU</div>
                </div>
            </div>
            
            <div class="score-summary">
                <div class="score-item">
                    <span>Akurasi Warna:</span>
                    <strong class="text-primary">${Math.round(artisticScore)}%</strong>
                </div>
                <div class="score-item">
                    <span>Area Terwarnai:</span>
                    <strong class="text-primary">${Math.round(progress)}%</strong>
                </div>
                <div class="score-item">
                    <span>Bonus Waktu:</span>
                    <strong class="${timeBonus >= 0 ? 'text-success' : 'text-danger'}">${timeBonus >= 0 ? '+' : ''}${timeBonus}</strong>
                </div>
                <div class="score-item">
                    <span>Total Poin:</span>
                    <strong class="text-success">${totalScore}</strong>
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
    
    // Create result preview
    createResultPreview();
    
    modal.show();
}

// Fungsi untuk pesan bintang
function getStarMessage(stars) {
    switch(stars) {
        case 3:
            return 'Sempurna! Pewarnaan sangat bagus! 🌟';
        case 2:
            return 'Bagus! Hampir sempurna! ✨';
        case 1:
            return 'Lumayan! Terus berlatih! 💪';
        default:
            return 'Pertahankan semangat belajar! 📚';
    }
}

// Fungsi untuk memainkan suara
function playSound(audioElement) {
    if (audioElement) {
        audioElement.currentTime = 0;
        audioElement.play().catch(e => {
            console.log('Audio play failed:', e);
        });
    }
}

async function saveGameProgress(pointsEarned) {
    if (!userData || !auth.currentUser) return;
    
    try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const gameId = 'mewarnai';
        
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
        
        // Update highest score for this level
        const levelKey = `level${currentLevel}Score`;
        gameProgress[levelKey] = Math.max(gameProgress[levelKey] || 0, currentScore);
        
        // Update highest overall score
        gameProgress.highestScore = Math.max(gameProgress.highestScore, currentScore);
        
        // Update stars for this level
        const stars = document.querySelectorAll('.star-rating .bi-star-fill.filled').length;
        gameProgress[`level${currentLevel}Stars`] = Math.max(
            gameProgress[`level${currentLevel}Stars`] || 0,
            stars
        );
        
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
    if (gameProgress.completedLevels.length >= 5 && !badges.includes('seniman-muda')) {
        badges.push('seniman-muda');
        showBadgeNotification('Lencana Seniman Muda', 'Selamat! Kamu telah menyelesaikan semua level mewarnai!');
    }
    
    // Badge for high artistic score
    if (gameProgress.highestScore >= 100 && !badges.includes('warna-master')) {
        badges.push('warna-master');
        showBadgeNotification('Lencana Master Warna', 'Kamu sangat ahli dalam mewarnai!');
    }
    
    // Badge for getting perfect stars
    if (gameProgress.totalStars >= 10 && !badges.includes('bintang-emas')) {
        badges.push('bintang-emas');
        showBadgeNotification('Lencana Bintang Emas', 'Kamu mendapatkan banyak bintang sempurna!');
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
            <i class="bi bi-palette me-2" style="font-size: 1.5rem;"></i>
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
    // Hentikan musik saat pindah level
    if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    }
    
    const nextLevel = currentLevel + 1;
    if (nextLevel <= 5) {
        window.location.href = `game-mewarnai.html?level=${nextLevel}`;
    } else {
        exitGame();
    }
}

function exitGame() {
    // Hentikan musik saat keluar game
    if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    }
    window.location.href = 'games-dashboard.html';
}

// Global functions
window.nextLevel = nextLevel;
window.exitGame = exitGame;