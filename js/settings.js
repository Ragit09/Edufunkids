// js/settings.js - JavaScript untuk Halaman Settings Terpisah

import { auth, db } from './firebaseConfig.js';
import { 
    signOut,
    onAuthStateChanged,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { 
    doc, 
    getDoc,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// Global variables
let backgroundMusic = null;

// Inisialisasi ketika DOM selesai dimuat
document.addEventListener('DOMContentLoaded', function() {
    console.log('⚙️ Settings page loaded successfully!');
    
    initSettingsPage();
});

// Fungsi utama untuk inisialisasi halaman settings
async function initSettingsPage() {
    // Sembunyikan loading spinner
    hideLoadingSpinner();
    
    // Inisialisasi background music
    initBackgroundMusic();
    
    // Inisialisasi semua komponen
    initNavigation();
    initUserData();
    initEventListeners();
    
    console.log('✅ Settings page initialized successfully');
}

// Fungsi untuk inisialisasi background music
function initBackgroundMusic() {
    // Gunakan audio yang sama dengan dashboard
    backgroundMusic = new Audio('../music/SongDashboard.mp3');
    backgroundMusic.loop = true;
    
    // Set volume dari localStorage atau default 50%
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
            console.log('❌ Autoplay prevented in settings:', error);
        });
    }
}

// Fungsi untuk update volume music secara real-time
function updateBackgroundMusicVolume() {
    if (backgroundMusic) {
        const savedMusicVolume = localStorage.getItem('edu_music_volume');
        const musicEnabled = localStorage.getItem('edu_music_enabled');
        
        if (savedMusicVolume !== null) {
            const newVolume = parseFloat(savedMusicVolume);
            backgroundMusic.volume = newVolume;
            
            // Update slider display
            const musicSlider = document.getElementById('musicVolume');
            const volumeValue = document.querySelector('#musicVolume').parentElement.querySelector('.volume-value');
            if (musicSlider && volumeValue) {
                musicSlider.value = newVolume * 100;
                volumeValue.textContent = Math.round(newVolume * 100) + '%';
            }
            
            // Jika volume 0, pause music. Jika > 0 dan belum diputar, play music
            if (newVolume > 0 && backgroundMusic.paused && musicEnabled !== 'false') {
                backgroundMusic.play().catch(console.error);
            } else if (newVolume === 0 || musicEnabled === 'false') {
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

// Fungsi untuk inisialisasi navigasi settings
function initNavigation() {
    const settingsNavItems = document.querySelectorAll('.settings-nav-item');
    const settingsPanels = document.querySelectorAll('.settings-panel');
    
    settingsNavItems.forEach(item => {
        item.addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            
            // Remove active class from all items and panels
            settingsNavItems.forEach(nav => nav.classList.remove('active'));
            settingsPanels.forEach(panel => panel.classList.remove('active'));
            
            // Add active class to clicked item and target panel
            this.classList.add('active');
            document.getElementById(target).classList.add('active');
        });
    });
}

// Fungsi untuk inisialisasi data user
async function initUserData() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log('✅ User logged in:', user.email);
            
            try {
                // Get user data from Firestore
                const userDoc = await getDoc(doc(db, "users", user.uid));
                
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    updateUserInterface(userData, user.email);
                    loadUserSettings(userData);
                } else {
                    console.log('❌ No user data found');
                    showNotification('Data pengguna tidak ditemukan', 'error');
                }
            } catch (error) {
                console.error('❌ Error getting user data:', error);
                showNotification('Gagal memuat data pengguna', 'error');
            }
        } else {
            // Redirect to login if not authenticated
            console.log('❌ User not authenticated, redirecting to login...');
            window.location.href = 'login.html';
        }
    });
}

// Fungsi untuk update UI dengan data user
function updateUserInterface(userData, userEmail) {
    // Update profile form
    if (userData.childName) {
        document.getElementById('settingsChildName').value = userData.childName;
    }
    
    if (userData.childAge) {
        document.getElementById('settingsChildAge').value = userData.childAge;
        // Set placeholder yang jelas
        document.getElementById('settingsChildAge').placeholder = '7-12';
    }
    
    if (userData.childGrade) {
        document.getElementById('settingsChildGrade').value = userData.childGrade;
    }
    
    if (userData.avatar) {
        document.getElementById('settingsChildAvatar').value = userData.avatar;
        // Update avatar selection
        const avatarOptions = document.querySelectorAll('.avatar-option');
        avatarOptions.forEach(option => {
            option.classList.remove('selected');
            if (option.getAttribute('data-avatar') === userData.avatar) {
                option.classList.add('selected');
            }
        });
        // Update avatar preview
        const avatarPreview = document.getElementById('settingsAvatarPreview');
        if (avatarPreview) {
            avatarPreview.textContent = userData.avatar;
        }
    }
    
    // Update parent email
    const parentEmailElement = document.getElementById('parentEmail');
    if (parentEmailElement && userEmail) {
        parentEmailElement.value = userEmail;
    }
    
    // Update join date
    const joinDateElement = document.getElementById('joinDate');
    if (joinDateElement && userData.createdAt) {
        const joinDate = userData.createdAt.toDate();
        joinDateElement.value = joinDate.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    // Update total points
    const totalPointsElement = document.getElementById('totalPoints');
    if (totalPointsElement && userData.points !== undefined) {
        totalPointsElement.value = userData.points + ' Poin';
    }
}

// Fungsi untuk load user settings
function loadUserSettings(userData) {
    // Load audio settings dari localStorage
    const savedMusicVolume = localStorage.getItem('edu_music_volume');
    const savedSoundVolume = localStorage.getItem('edu_sound_volume');
    const savedMusicEnabled = localStorage.getItem('edu_music_enabled');
    
    // Volume settings - Default 50% jika tidak ada setting
    if (savedMusicVolume !== null) {
        const musicVolumePercent = parseFloat(savedMusicVolume) * 100;
        document.getElementById('musicVolume').value = musicVolumePercent;
        document.querySelector('#musicVolume').parentElement.querySelector('.volume-value').textContent = Math.round(musicVolumePercent) + '%';
    } else {
        // Set default 50%
        document.getElementById('musicVolume').value = 50;
        document.querySelector('#musicVolume').parentElement.querySelector('.volume-value').textContent = '50%';
        localStorage.setItem('edu_music_volume', '0.5');
    }
    
    if (savedSoundVolume !== null) {
        const soundVolumePercent = parseFloat(savedSoundVolume) * 100;
        document.getElementById('sfxVolume').value = soundVolumePercent;
        document.querySelector('#sfxVolume').parentElement.querySelector('.volume-value').textContent = Math.round(soundVolumePercent) + '%';
    } else {
        // Set default 50%
        document.getElementById('sfxVolume').value = 50;
        document.querySelector('#sfxVolume').parentElement.querySelector('.volume-value').textContent = '50%';
        localStorage.setItem('edu_sound_volume', '0.5');
    }
    
    if (savedSoundVolume !== null) {
        const voiceVolumePercent = parseFloat(savedSoundVolume) * 100;
        document.getElementById('voiceVolume').value = voiceVolumePercent;
        document.querySelector('#voiceVolume').parentElement.querySelector('.volume-value').textContent = Math.round(voiceVolumePercent) + '%';
    } else {
        // Set default 50%
        document.getElementById('voiceVolume').value = 50;
        document.querySelector('#voiceVolume').parentElement.querySelector('.volume-value').textContent = '50%';
    }
    
    // Sound preferences - Default enabled jika tidak ada setting
    if (savedMusicEnabled !== null) {
        document.getElementById('soundEnabled').checked = savedMusicEnabled === 'true';
        document.getElementById('backgroundMusic').checked = savedMusicEnabled === 'true';
    } else {
        // Set default enabled
        document.getElementById('soundEnabled').checked = true;
        document.getElementById('backgroundMusic').checked = true;
        localStorage.setItem('edu_music_enabled', 'true');
    }
    
    // Load other settings dari Firestore jika ada
    if (userData.settings) {
        const settings = userData.settings;
        
        if (settings.voiceNarration !== undefined) {
            document.getElementById('voiceNarration').checked = settings.voiceNarration;
        }
        
        if (settings.gameSounds !== undefined) {
            document.getElementById('gameSounds').checked = settings.gameSounds;
        }
        
        // Notification settings
        if (settings.notifications) {
            const notifSettings = settings.notifications;
            
            if (notifSettings.enabled !== undefined) {
                document.getElementById('notificationsEnabled').checked = notifSettings.enabled;
            }
            
            if (notifSettings.progress !== undefined) {
                document.getElementById('progressNotifications').checked = notifSettings.progress;
            }
            
            if (notifSettings.achievements !== undefined) {
                document.getElementById('achievementNotifications').checked = notifSettings.achievements;
            }
            
            if (notifSettings.games !== undefined) {
                document.getElementById('gameNotifications').checked = notifSettings.games;
            }
            
            if (notifSettings.reminders !== undefined) {
                document.getElementById('reminderNotifications').checked = notifSettings.reminders;
            }
        }
        
        // Privacy settings
        if (settings.saveProgress !== undefined) {
            document.getElementById('saveProgress').checked = settings.saveProgress;
        }
    }
}

// Fungsi untuk inisialisasi event listeners
function initEventListeners() {
    // Avatar selection
    const avatarOptions = document.querySelectorAll('.avatar-option');
    const avatarInput = document.getElementById('settingsChildAvatar');
    const avatarPreview = document.getElementById('settingsAvatarPreview');
    
    avatarOptions.forEach(option => {
        option.addEventListener('click', function() {
            avatarOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            const selectedAvatar = this.getAttribute('data-avatar');
            avatarInput.value = selectedAvatar;
            avatarPreview.textContent = selectedAvatar;
        });
    });
    
    // Volume sliders dengan real-time update
    initVolumeSliders();
    
    // Save buttons
    document.getElementById('saveProfileBtn').addEventListener('click', handleSaveProfile);
    document.getElementById('saveAudioSettings').addEventListener('click', handleSaveAudioSettings);
    document.getElementById('saveNotificationSettings').addEventListener('click', handleSaveNotificationSettings);
    
    // Action buttons
    document.getElementById('changePasswordBtn').addEventListener('click', showChangePasswordModal);
    document.getElementById('deleteDataBtn').addEventListener('click', showDeleteDataConfirmation);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Confirmation modal
    document.getElementById('confirmActionBtn').addEventListener('click', handleConfirmedAction);
    
    // Real-time validation untuk input usia
    initAgeValidation();
}

// Fungsi untuk inisialisasi validasi usia real-time
function initAgeValidation() {
    const ageInput = document.getElementById('settingsChildAge');
    if (!ageInput) return;
    
    // Reset error state saat focus
    ageInput.addEventListener('focus', function() {
        this.classList.remove('is-invalid');
        this.style.borderColor = '';
        this.style.boxShadow = '';
        this.style.backgroundColor = '';
        this.style.backgroundImage = '';
        this.style.animation = '';
        
        // Update help text
        const helpText = this.nextElementSibling;
        if (helpText && helpText.classList.contains('text-muted')) {
            helpText.innerHTML = '<i class="bi bi-info-circle me-1"></i> Usia harus antara 7-12 tahun';
            helpText.style.color = '#6c757d';
        }
    });
    
    // Real-time validation saat input berubah
    ageInput.addEventListener('input', function() {
        const value = this.value.trim();
        const helpText = this.nextElementSibling;
        
        // Reset semua styling
        this.classList.remove('is-invalid', 'is-valid');
        this.style.borderColor = '';
        this.style.boxShadow = '';
        this.style.backgroundColor = '';
        this.style.backgroundImage = '';
        this.style.animation = '';
        
        if (value === '') {
            // Kosong - normal state
            if (helpText && helpText.classList.contains('text-muted')) {
                helpText.innerHTML = '<i class="bi bi-info-circle me-1"></i> Masukkan usia antara 7-12 tahun';
                helpText.style.color = '#6c757d';
            }
            return;
        }
        
        const numValue = parseInt(value);
        
        if (isNaN(numValue)) {
            // Bukan angka - warning
            this.classList.add('is-invalid');
            if (helpText && helpText.classList.contains('text-muted')) {
                helpText.innerHTML = '<i class="bi bi-exclamation-triangle me-1"></i> Harus berupa angka';
                helpText.style.color = 'var(--warning-color)';
            }
        } else if (numValue < 7) {
            // Terlalu muda - error
            this.classList.add('is-invalid');
            if (helpText && helpText.classList.contains('text-muted')) {
                helpText.innerHTML = '<i class="bi bi-x-circle me-1"></i> Usia minimal 7 tahun';
                helpText.style.color = 'var(--danger-color)';
            }
        } else if (numValue > 12) {
            // Terlalu tua - error
            this.classList.add('is-invalid');
            if (helpText && helpText.classList.contains('text-muted')) {
                helpText.innerHTML = '<i class="bi bi-x-circle me-1"></i> Usia maksimal 12 tahun';
                helpText.style.color = 'var(--danger-color)';
            }
        } else {
            // Valid - success
            this.classList.add('is-valid');
            if (helpText && helpText.classList.contains('text-muted')) {
                helpText.innerHTML = '<i class="bi bi-check-circle me-1"></i> Usia valid!';
                helpText.style.color = 'var(--success-color)';
            }
        }
    });
}

// Fungsi untuk inisialisasi volume sliders dengan real-time update
function initVolumeSliders() {
    const volumeSliders = document.querySelectorAll('.volume-slider');
    
    volumeSliders.forEach(slider => {
        const valueDisplay = slider.parentElement.querySelector('.volume-value');
        
        // Update value display secara real-time
        slider.addEventListener('input', function() {
            if (valueDisplay) {
                valueDisplay.textContent = `${this.value}%`;
            }
            
            // Real-time update untuk music volume
            if (this.id === 'musicVolume') {
                const newVolume = parseFloat(this.value) / 100;
                localStorage.setItem('edu_music_volume', newVolume.toString());
                
                // Update background music volume secara real-time
                if (backgroundMusic) {
                    backgroundMusic.volume = newVolume;
                    
                    // Play/pause berdasarkan volume
                    if (newVolume > 0 && backgroundMusic.paused) {
                        const musicEnabled = localStorage.getItem('edu_music_enabled');
                        if (musicEnabled !== 'false') {
                            backgroundMusic.play().catch(console.error);
                        }
                    } else if (newVolume === 0) {
                        backgroundMusic.pause();
                    }
                }
                
                // Juga update di dashboard jika terbuka
                if (window.opener && typeof window.opener.updateBackgroundMusicVolume === 'function') {
                    window.opener.updateBackgroundMusicVolume();
                }
            }
        });
        
        // Set initial value display
        if (valueDisplay) {
            valueDisplay.textContent = `${slider.value}%`;
        }
    });
}

// ===== FUNGSI NOTIFIKASI YANG DIPERBAIKI =====

// Fungsi untuk menampilkan notifikasi yang lebih baik
function showNotification(message, type = 'info', title = null, duration = 5000) {
    // Hapus notifikasi lama jika ada
    const existingNotifications = document.querySelectorAll('.custom-notification');
    existingNotifications.forEach(notification => {
        if (notification.parentNode) {
            notification.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    });
    
    // Tentukan ikon dan judul berdasarkan jenis notifikasi
    const typeConfigs = {
        'success': {
            icon: '✓',
            defaultTitle: 'Berhasil',
            title: title || 'Berhasil'
        },
        'error': {
            icon: '✗',
            defaultTitle: 'Gagal',
            title: title || 'Gagal'
        },
        'warning': {
            icon: '⚠',
            defaultTitle: 'Peringatan',
            title: title || 'Peringatan'
        },
        'info': {
            icon: 'ℹ',
            defaultTitle: 'Informasi',
            title: title || 'Informasi'
        }
    };
    
    const config = typeConfigs[type] || typeConfigs.info;
    
    // Buat elemen notifikasi
    const notification = document.createElement('div');
    notification.className = `custom-notification ${type}`;
    notification.setAttribute('role', 'alert');
    
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${config.icon}</span>
            <div class="notification-body">
                <strong class="notification-title">${config.title}</strong>
                <div class="notification-message">${message}</div>
            </div>
            <button type="button" class="notification-close" onclick="this.parentElement.parentElement.remove()">
                &times;
            </button>
        </div>
    `;
    
    // Tambahkan ke body
    document.body.appendChild(notification);
    
    // Auto reset input usia jika error
    if (type === 'error' && message.includes('usia')) {
        const ageField = document.getElementById('settingsChildAge');
        if (ageField && ageField.classList.contains('is-invalid')) {
            // Hapus kelas error setelah 3 detik
            setTimeout(() => {
                ageField.classList.remove('is-invalid');
                ageField.style.borderColor = '';
                ageField.style.boxShadow = '';
                ageField.style.backgroundColor = '';
                ageField.style.backgroundImage = '';
                ageField.style.animation = '';
                
                // Reset help text
                const helpText = ageField.nextElementSibling;
                if (helpText && helpText.classList.contains('text-muted')) {
                    helpText.innerHTML = '<i class="bi bi-info-circle me-1"></i> Usia harus antara 7-12 tahun';
                    helpText.style.color = '#6c757d';
                }
            }, 3000);
        }
    }
    
    // Hapus otomatis setelah durasi tertentu
    const removeTimeout = setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, duration);
    
    // Tambahkan event listener untuk tombol close
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            clearTimeout(removeTimeout);
            if (notification.parentNode) {
                notification.remove();
            }
        });
    }
    
    return notification;
}

// ===== FUNGSI SAVE PROFILE YANG DIPERBAIKI =====

// Fungsi untuk handle save profile dengan validasi usia 7-12 tahun
async function handleSaveProfile() {
    try {
        const user = auth.currentUser;
        if (!user) {
            showNotification('Anda harus login untuk menyimpan pengaturan', 'error', 'Autentikasi Gagal');
            return;
        }
        
        const childAge = parseInt(document.getElementById('settingsChildAge').value);
        const childName = document.getElementById('settingsChildName').value.trim();
        const childGrade = document.getElementById('settingsChildGrade').value;
        const avatar = document.getElementById('settingsChildAvatar').value;
        const ageField = document.getElementById('settingsChildAge');
        const nameField = document.getElementById('settingsChildName');
        
        // Reset error state sebelum validasi
        ageField.classList.remove('is-invalid');
        ageField.style.borderColor = '';
        ageField.style.boxShadow = '';
        ageField.style.backgroundColor = '';
        ageField.style.backgroundImage = '';
        ageField.style.animation = '';
        
        nameField.classList.remove('is-invalid');
        nameField.style.borderColor = '';
        nameField.style.boxShadow = '';
        nameField.style.backgroundColor = '';
        
        // Validasi nama terlebih dahulu
        if (!childName) {
            showNotification('Nama anak tidak boleh kosong', 'warning', 'Data Tidak Lengkap');
            nameField.classList.add('is-invalid');
            nameField.focus();
            return;
        }
        
        // Validasi usia
        if (!ageField.value.trim()) {
            showNotification('Usia anak harus diisi', 'warning', 'Data Tidak Lengkap');
            ageField.classList.add('is-invalid');
            ageField.focus();
            return;
        }
        
        if (isNaN(childAge)) {
            showNotification('Usia harus berupa angka', 'error', 'Input Tidak Valid');
            ageField.classList.add('is-invalid');
            ageField.focus();
            return;
        }
        
        // VALIDASI USIA 7-12 TAHUN
        if (childAge < 7) {
            // Efek visual error sementara
            ageField.classList.add('is-invalid');
            ageField.style.animation = 'errorPulse 0.5s ease-in-out';
            
            // Pesan error dengan notifikasi yang lebih baik
            showNotification('Maaf, usia anak harus minimal 7 tahun untuk dapat menggunakan platform EduFunKids', 
                           'error', 
                           'Validasi Usia');
            
            // Auto reset error state setelah animasi
            setTimeout(() => {
                ageField.style.animation = '';
            }, 500);
            
            ageField.focus();
            return;
        }
        
        if (childAge > 12) {
            // Efek visual error sementara
            ageField.classList.add('is-invalid');
            ageField.style.animation = 'errorPulse 0.5s ease-in-out';
            
            // Pesan error dengan notifikasi yang lebih baik
            showNotification('Maaf, usia anak maksimal 12 tahun untuk dapat menggunakan platform EduFunKids', 
                           'error', 
                           'Validasi Usia');
            
            // Auto reset error state setelah animasi
            setTimeout(() => {
                ageField.style.animation = '';
            }, 500);
            
            ageField.focus();
            return;
        }
        
        // Semua validasi berhasil - tampilkan feedback positif
        ageField.classList.add('is-valid');
        
        const userData = {
            childName: childName,
            childAge: childAge,
            childGrade: childGrade,
            avatar: avatar,
            updatedAt: new Date()
        };
        
        // Update user data in Firestore
        await updateDoc(doc(db, "users", user.uid), userData);
        
        // Tampilkan notifikasi sukses yang lebih baik
        showNotification('Profil anak berhasil diperbarui!', 'success', 'Perubahan Disimpan');
        
    } catch (error) {
        console.error('❌ Error saving profile:', error);
        
        // Tampilkan notifikasi error umum
        if (!error.message.includes('Usia anak harus antara 7-12 tahun')) {
            showNotification('Gagal menyimpan profil. Silakan coba lagi.', 'error', 'Terjadi Kesalahan');
        }
    }
}

// Fungsi untuk handle save audio settings
async function handleSaveAudioSettings() {
    try {
        const user = auth.currentUser;
        if (!user) {
            showNotification('Anda harus login untuk menyimpan pengaturan', 'error', 'Autentikasi Gagal');
            return;
        }
        
        const musicVolume = parseFloat(document.getElementById('musicVolume').value) / 100;
        const sfxVolume = parseFloat(document.getElementById('sfxVolume').value) / 100;
        const voiceVolume = parseFloat(document.getElementById('voiceVolume').value) / 100;
        const soundEnabled = document.getElementById('soundEnabled').checked;
        const backgroundMusicEnabled = document.getElementById('backgroundMusic').checked;
        const voiceNarration = document.getElementById('voiceNarration').checked;
        const gameSounds = document.getElementById('gameSounds').checked;
        
        const audioSettings = {
            musicVolume: musicVolume,
            sfxVolume: sfxVolume,
            voiceVolume: voiceVolume,
            soundEnabled: soundEnabled,
            backgroundMusic: backgroundMusicEnabled,
            voiceNarration: voiceNarration,
            gameSounds: gameSounds
        };
        
        // Simpan ke localStorage untuk akses langsung
        localStorage.setItem('edu_music_volume', musicVolume);
        localStorage.setItem('edu_sound_volume', sfxVolume);
        localStorage.setItem('edu_music_enabled', backgroundMusicEnabled);
        
        // Update background music berdasarkan pengaturan baru
        if (backgroundMusic) {
            backgroundMusic.volume = musicVolume;
            
            if (musicVolume > 0 && backgroundMusicEnabled && backgroundMusic.paused) {
                backgroundMusic.play().catch(console.error);
            } else if (musicVolume === 0 || !backgroundMusicEnabled) {
                backgroundMusic.pause();
            }
        }
        
        // Update settings di Firestore
        await updateDoc(doc(db, "users", user.uid), {
            'settings.audio': audioSettings,
            updatedAt: new Date()
        });
        
        // Update background music di dashboard jika sedang berjalan
        if (window.opener && typeof window.opener.updateBackgroundMusicVolume === 'function') {
            window.opener.updateBackgroundMusicVolume();
        }
        
        showNotification('Pengaturan audio berhasil disimpan!', 'success', 'Pengaturan Disimpan');
        
    } catch (error) {
        console.error('❌ Error saving audio settings:', error);
        showNotification('Gagal menyimpan pengaturan audio', 'error', 'Terjadi Kesalahan');
    }
}

// Fungsi untuk handle save notification settings
async function handleSaveNotificationSettings() {
    try {
        const user = auth.currentUser;
        if (!user) {
            showNotification('Anda harus login untuk menyimpan pengaturan', 'error', 'Autentikasi Gagal');
            return;
        }
        
        const notificationSettings = {
            enabled: document.getElementById('notificationsEnabled').checked,
            progress: document.getElementById('progressNotifications').checked,
            achievements: document.getElementById('achievementNotifications').checked,
            games: document.getElementById('gameNotifications').checked,
            reminders: document.getElementById('reminderNotifications').checked
        };
        
        // Update settings in Firestore
        await updateDoc(doc(db, "users", user.uid), {
            'settings.notifications': notificationSettings,
            updatedAt: new Date()
        });
        
        showNotification('Pengaturan notifikasi berhasil disimpan!', 'success', 'Pengaturan Disimpan');
        
    } catch (error) {
        console.error('❌ Error saving notification settings:', error);
        showNotification('Gagal menyimpan pengaturan notifikasi', 'error', 'Terjadi Kesalahan');
    }
}

// Fungsi untuk show change password modal
function showChangePasswordModal() {
    const modalBody = `
        <div class="mb-3">
            <label class="form-label">Password Saat Ini</label>
            <input type="password" class="form-control" id="currentPassword" placeholder="Masukkan password saat ini">
        </div>
        <div class="mb-3">
            <label class="form-label">Password Baru</label>
            <input type="password" class="form-control" id="newPassword" placeholder="Masukkan password baru">
        </div>
        <div class="mb-3">
            <label class="form-label">Konfirmasi Password Baru</label>
            <input type="password" class="form-control" id="confirmPassword" placeholder="Konfirmasi password baru">
        </div>
        <small class="text-muted">Password harus minimal 6 karakter.</small>
    `;
    
    showConfirmationModal('Ubah Password', modalBody, 'changePassword');
}

// Fungsi untuk show delete data confirmation
function showDeleteDataConfirmation() {
    const modalBody = `
        <div class="alert alert-warning">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            <strong>Peringatan!</strong> Tindakan ini tidak dapat dibatalkan.
        </div>
        <p>Semua data berikut akan dihapus secara permanen:</p>
        <ul>
            <li>Progress belajar</li>
            <li>Pencapaian dan lencana</li>
            <li>Riwayat game</li>
            <li>Data profil anak</li>
        </ul>
        <p class="text-danger">Apakah Anda yakin ingin melanjutkan?</p>
    `;
    
    showConfirmationModal('Hapus Semua Data', modalBody, 'deleteData');
}

// Fungsi untuk show confirmation modal
function showConfirmationModal(title, body, actionType) {
    document.getElementById('confirmationModalTitle').textContent = title;
    document.getElementById('confirmationModalBody').innerHTML = body;
    document.getElementById('confirmActionBtn').setAttribute('data-action', actionType);
    
    const modal = new bootstrap.Modal(document.getElementById('confirmationModal'));
    modal.show();
}

// Fungsi untuk handle confirmed action
async function handleConfirmedAction() {
    const action = this.getAttribute('data-action');
    const modal = bootstrap.Modal.getInstance(document.getElementById('confirmationModal'));
    
    try {
        switch (action) {
            case 'changePassword':
                await handleChangePassword();
                break;
            case 'deleteData':
                await handleDeleteData();
                break;
        }
        
        modal.hide();
    } catch (error) {
        console.error('❌ Error performing action:', error);
        // Modal will remain open if there's an error
    }
}

// Fungsi untuk handle change password
async function handleChangePassword() {
    const user = auth.currentUser;
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        showNotification('Semua field harus diisi', 'warning', 'Data Tidak Lengkap');
        throw new Error('Validation failed');
    }
    
    if (newPassword !== confirmPassword) {
        showNotification('Password baru tidak cocok', 'warning', 'Validasi Password');
        throw new Error('Password mismatch');
    }
    
    if (newPassword.length < 6) {
        showNotification('Password harus minimal 6 karakter', 'warning', 'Validasi Password');
        throw new Error('Password too short');
    }
    
    try {
        // Reauthenticate user
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        
        // Update password
        await updatePassword(user, newPassword);
        
        showNotification('Password berhasil diubah!', 'success', 'Password Diubah');
        
    } catch (error) {
        console.error('❌ Error changing password:', error);
        if (error.code === 'auth/wrong-password') {
            showNotification('Password saat ini salah', 'error', 'Autentikasi Gagal');
        } else if (error.code === 'auth/requires-recent-login') {
            showNotification('Silakan login ulang untuk mengubah password', 'warning', 'Sesi Kadaluarsa');
        } else {
            showNotification('Gagal mengubah password', 'error', 'Terjadi Kesalahan');
        }
        throw error;
    }
}

// Fungsi untuk handle delete data
async function handleDeleteData() {
    try {
        const user = auth.currentUser;
        if (!user) {
            showNotification('Anda harus login untuk menghapus data', 'error', 'Autentikasi Gagal');
            return;
        }
        
        // Delete user data from Firestore
        await deleteDoc(doc(db, "users", user.uid));
        
        // Note: We don't delete the auth account, just the Firestore data
        showNotification('Semua data berhasil dihapus!', 'success', 'Data Dihapus');
        
        // Redirect to setup page after a delay
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error deleting data:', error);
        showNotification('Gagal menghapus data', 'error', 'Terjadi Kesalahan');
        throw error;
    }
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
        showNotification('Logout berhasil!', 'success', 'Selesai');
        
        // Redirect to login page after short delay
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        
    } catch (error) {
        console.error('❌ Logout error:', error);
        showNotification('Gagal logout. Silakan coba lagi.', 'error', 'Terjadi Kesalahan');
    }
}

// Global error handler
window.addEventListener('error', function(e) {
    console.error('❌ Global error in settings:', e.error);
    showNotification('Terjadi kesalahan. Silakan refresh halaman.', 'error', 'Kesalahan Sistem');
});