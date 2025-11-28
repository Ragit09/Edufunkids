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

// Fungsi untuk handle save profile
async function handleSaveProfile() {
    try {
        const user = auth.currentUser;
        if (!user) {
            showNotification('Anda harus login untuk menyimpan pengaturan', 'error');
            return;
        }
        
        const userData = {
            childName: document.getElementById('settingsChildName').value,
            childAge: parseInt(document.getElementById('settingsChildAge').value),
            childGrade: document.getElementById('settingsChildGrade').value,
            avatar: document.getElementById('settingsChildAvatar').value,
            updatedAt: new Date()
        };
        
        // Validate required fields
        if (!userData.childName || !userData.childAge) {
            showNotification('Nama dan usia anak harus diisi', 'warning');
            return;
        }
        
        // Update user data in Firestore
        await updateDoc(doc(db, "users", user.uid), userData);
        
        showNotification('Profil berhasil diperbarui!', 'success');
        
    } catch (error) {
        console.error('❌ Error saving profile:', error);
        showNotification('Gagal menyimpan profil', 'error');
    }
}

// Fungsi untuk handle save audio settings
async function handleSaveAudioSettings() {
    try {
        const user = auth.currentUser;
        if (!user) {
            showNotification('Anda harus login untuk menyimpan pengaturan', 'error');
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
        
        showNotification('Pengaturan audio berhasil disimpan!', 'success');
        
    } catch (error) {
        console.error('❌ Error saving audio settings:', error);
        showNotification('Gagal menyimpan pengaturan audio', 'error');
    }
}

// Fungsi untuk handle save notification settings
async function handleSaveNotificationSettings() {
    try {
        const user = auth.currentUser;
        if (!user) {
            showNotification('Anda harus login untuk menyimpan pengaturan', 'error');
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
        
        showNotification('Pengaturan notifikasi berhasil disimpan!', 'success');
        
    } catch (error) {
        console.error('❌ Error saving notification settings:', error);
        showNotification('Gagal menyimpan pengaturan notifikasi', 'error');
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
        showNotification('Semua field harus diisi', 'warning');
        throw new Error('Validation failed');
    }
    
    if (newPassword !== confirmPassword) {
        showNotification('Password baru tidak cocok', 'warning');
        throw new Error('Password mismatch');
    }
    
    if (newPassword.length < 6) {
        showNotification('Password harus minimal 6 karakter', 'warning');
        throw new Error('Password too short');
    }
    
    try {
        // Reauthenticate user
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        
        // Update password
        await updatePassword(user, newPassword);
        
        showNotification('Password berhasil diubah!', 'success');
        
    } catch (error) {
        console.error('❌ Error changing password:', error);
        if (error.code === 'auth/wrong-password') {
            showNotification('Password saat ini salah', 'error');
        } else if (error.code === 'auth/requires-recent-login') {
            showNotification('Silakan login ulang untuk mengubah password', 'warning');
        } else {
            showNotification('Gagal mengubah password', 'error');
        }
        throw error;
    }
}

// Fungsi untuk handle delete data
async function handleDeleteData() {
    try {
        const user = auth.currentUser;
        if (!user) {
            showNotification('Anda harus login untuk menghapus data', 'error');
            return;
        }
        
        // Delete user data from Firestore
        await deleteDoc(doc(db, "users", user.uid));
        
        // Note: We don't delete the auth account, just the Firestore data
        showNotification('Semua data berhasil dihapus!', 'success');
        
        // Redirect to setup page after a delay
        setTimeout(() => {
            window.location.href = 'setup.html';
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error deleting data:', error);
        showNotification('Gagal menghapus data', 'error');
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
    console.error('❌ Global error in settings:', e.error);
    showNotification('Terjadi kesalahan. Silakan refresh halaman.', 'error');
});