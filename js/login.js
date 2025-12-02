// js/login.js - JavaScript untuk Halaman Login EduFunKids

import { auth, db } from '../js/firebaseConfig.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    updateProfile 
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { 
    doc, 
    setDoc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// Inisialisasi ketika DOM selesai dimuat
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 EduFunKids Login Page loaded successfully!');
    
    initLoginPage();
});

// Fungsi utama untuk inisialisasi halaman login
function initLoginPage() {
    initFormValidation();
    initAvatarSelection();
    initPasswordValidation();
    initTabSwitching();
    initDemoLogin();
    
    // Cek jika user sudah login
    checkExistingAuth();
    
    console.log('✅ Login page initialized successfully');
}

// Fungsi untuk inisialisasi validasi form
function initFormValidation() {
    const forms = document.querySelectorAll('.needs-validation');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(event) {
            if (!validateForm(this)) {
                event.preventDefault();
                event.stopPropagation();
            } else {
                handleFormSubmit(this, event);
            }
            
            this.classList.add('was-validated');
        }, false);
    });
}

// Fungsi untuk validasi form
function validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input[required], select[required], .form-check-input[required]');
    
    // Reset semua field error terlebih dahulu
    inputs.forEach(input => {
        input.classList.remove('is-invalid');
        input.classList.remove('is-valid');
    });
    
    inputs.forEach(input => {
        // Check required fields
        if (input.type === 'checkbox') {
            // Untuk checkbox
            if (!input.checked) {
                input.classList.add('is-invalid');
                isValid = false;
                return;
            } else {
                input.classList.add('is-valid');
            }
        } else if (!input.value.trim()) {
            // Untuk input text, email, password, select
            input.classList.add('is-invalid');
            isValid = false;
            return;
        }
        
        // Email validation
        if (input.type === 'email' && !isValidEmail(input.value)) {
            input.classList.add('is-invalid');
            isValid = false;
            return;
        }
        
        // Password validation
        if (input.type === 'password' && input.id === 'registerPassword') {
            const passwordError = validatePassword(input.value, input.id);
            if (passwordError) {
                input.classList.add('is-invalid');
                isValid = false;
                return;
            }
        }
        
        // Confirm password validation
        if (input.id === 'confirmPassword') {
            const password = document.getElementById('registerPassword')?.value;
            if (input.value !== password) {
                input.classList.add('is-invalid');
                isValid = false;
                return;
            }
        }
        
        // Age validation
        if (input.id === 'childAge') {
            const age = parseInt(input.value);
            if (isNaN(age) || age < 3 || age > 12) {
                input.classList.add('is-invalid');
                isValid = false;
                return;
            }
        }
        
        // Jika semua validasi lolos, tambahkan kelas valid
        input.classList.add('is-valid');
    });
    
    return isValid;
}

// Fungsi untuk validasi email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Fungsi untuk validasi password
function validatePassword(password, fieldId) {
    if (password.length < 8) {
        return 'Kata sandi minimal 8 karakter';
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
        return 'Kata sandi harus mengandung huruf kecil';
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
        return 'Kata sandi harus mengandung huruf besar';
    }
    
    if (!/(?=.*\d)/.test(password)) {
        return 'Kata sandi harus mengandung angka';
    }
    
    return null;
}

// Fungsi untuk inisialisasi pemilihan avatar
function initAvatarSelection() {
    const avatarOptions = document.querySelectorAll('.avatar-option');
    const avatarInput = document.getElementById('childAvatar');
    
    avatarOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all options
            avatarOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            this.classList.add('selected');
            
            // Update hidden input value
            const selectedAvatar = this.getAttribute('data-avatar');
            avatarInput.value = selectedAvatar;
            
            // Add visual feedback
            this.style.transform = 'scale(1.2)';
            setTimeout(() => {
                this.style.transform = 'scale(1.15)';
            }, 150);
        });
    });
}

// Fungsi untuk inisialisasi validasi password
function initPasswordValidation() {
    const passwordInput = document.getElementById('registerPassword');
    const confirmInput = document.getElementById('confirmPassword');
    
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            updatePasswordStrength(this.value);
            validateConfirmPassword();
        });
    }
    
    if (confirmInput) {
        confirmInput.addEventListener('input', validateConfirmPassword);
    }
}

// Fungsi untuk update indikator kekuatan password
function updatePasswordStrength(password) {
    let strength = 'weak';
    
    if (password.length >= 8) {
        strength = 'medium';
    }
    
    if (password.length >= 12 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        strength = 'strong';
    }
    
    // Update UI untuk menunjukkan kekuatan password
    const strengthElement = document.getElementById('passwordStrength') || createPasswordStrengthElement();
    strengthElement.className = `password-strength strength-${strength}`;
}

// Fungsi untuk membuat elemen indikator kekuatan password
function createPasswordStrengthElement() {
    const strengthElement = document.createElement('div');
    strengthElement.id = 'passwordStrength';
    strengthElement.className = 'password-strength strength-weak';
    
    const passwordInput = document.getElementById('registerPassword');
    passwordInput.parentElement.appendChild(strengthElement);
    
    return strengthElement;
}

// Fungsi untuk validasi konfirmasi password
function validateConfirmPassword() {
    const password = document.getElementById('registerPassword')?.value;
    const confirm = document.getElementById('confirmPassword')?.value;
    
    if (!password || !confirm) return;
    
    const confirmInput = document.getElementById('confirmPassword');
    
    if (confirm && password !== confirm) {
        confirmInput.classList.add('is-invalid');
        confirmInput.classList.remove('is-valid');
    } else if (confirm && password === confirm) {
        confirmInput.classList.add('is-valid');
        confirmInput.classList.remove('is-invalid');
    }
}

// Fungsi untuk inisialisasi tab switching
function initTabSwitching() {
    const authTabs = document.getElementById('authTabs');
    
    authTabs.addEventListener('shown.bs.tab', function(event) {
        const target = event.target.getAttribute('data-bs-target');
        console.log(`Switched to tab: ${target}`);
        
        // Reset forms when switching tabs
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.classList.remove('was-validated');
            form.reset();
            
            // Reset validation states
            const inputs = form.querySelectorAll('.is-valid, .is-invalid');
            inputs.forEach(input => {
                input.classList.remove('is-valid', 'is-invalid');
            });
        });
        
        // Reset avatar selection to default
        const avatarOptions = document.querySelectorAll('.avatar-option');
        avatarOptions.forEach(option => option.classList.remove('selected'));
        const defaultAvatar = document.querySelector('.avatar-option[data-avatar="😊"]');
        if (defaultAvatar) {
            defaultAvatar.classList.add('selected');
        }
    });
}

// Fungsi untuk inisialisasi demo login
function initDemoLogin() {
    const demoLoginBtn = document.getElementById('demoLogin');
    
    if (demoLoginBtn) {
        demoLoginBtn.addEventListener('click', function() {
            handleDemoLogin();
        });
    }
}

// Fungsi untuk handle form submission
async function handleFormSubmit(form, event) {
    event.preventDefault();
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const spinner = submitBtn.querySelector('.spinner-border');
    
    // Show loading state
    submitBtn.disabled = true;
    spinner.classList.remove('d-none');
    
    try {
        if (form.id === 'loginForm') {
            await handleLogin();
        } else if (form.id === 'registerForm') {
            await handleRegistration();
        }
    } catch (error) {
        console.error('Form submission error:', error);
        // Tampilkan notifikasi error
        showNotification(error.message, 'error');
    } finally {
        // Hide loading state
        submitBtn.disabled = false;
        spinner.classList.add('d-none');
    }
}

// FUNGSI UTAMA: Handle login dengan auto-clear password saat gagal
async function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    console.log('Attempting login for:', email);
    
    // Simpan password sementara untuk digunakan nanti
    const originalPassword = password;
    
    // Reset error states - khusus reset password field
    const emailField = document.getElementById('loginEmail');
    const passwordField = document.getElementById('loginPassword');
    
    if (emailField) {
        emailField.classList.remove('is-invalid', 'is-valid');
        // Reset warna email ke normal
        emailField.style.borderColor = '';
        emailField.style.boxShadow = '';
    }
    
    if (passwordField) {
        passwordField.classList.remove('is-invalid', 'is-valid');
        // Reset warna password ke normal
        passwordField.style.borderColor = '';
        passwordField.style.boxShadow = '';
        passwordField.style.backgroundColor = '';
    }
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        console.log('✅ Login successful:', user.email);
        
        // Tambahkan efek visual sukses pada password field
        passwordField.classList.add('is-valid');
        passwordField.style.borderColor = 'var(--success-color)';
        passwordField.style.backgroundColor = 'rgba(81, 207, 102, 0.05)';
        
        showNotification('Login berhasil! Mengarahkan ke dashboard...', 'success');
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
        
    } catch (error) {
        console.error('❌ Login error:', error);
        
        let errorMessage = 'Terjadi kesalahan saat login';
        let errorFieldId = null;
        let shouldClearPassword = false;
        
        switch (error.code) {
            case 'auth/invalid-email':
                errorMessage = 'Format email tidak valid. Contoh: nama@domain.com';
                errorFieldId = 'loginEmail';
                break;
            case 'auth/user-disabled':
                errorMessage = 'Akun ini telah dinonaktifkan';
                shouldClearPassword = true;
                break;
            case 'auth/user-not-found':
                errorMessage = 'Email tidak ditemukan. Silakan periksa kembali atau daftar akun baru';
                errorFieldId = 'loginEmail';
                shouldClearPassword = true;
                break;
            case 'auth/wrong-password':
                errorMessage = 'Kata sandi salah. Silakan coba lagi';
                errorFieldId = 'loginPassword';
                shouldClearPassword = true; // CLEAR PASSWORD!
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Terlalu banyak percobaan login. Tunggu beberapa saat atau coba reset password';
                shouldClearPassword = true;
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Koneksi internet bermasalah. Periksa koneksi Anda';
                break;
            default:
                errorMessage = 'Gagal login. Silakan coba lagi nanti';
                shouldClearPassword = true;
        }
        
        // CLEAR PASSWORD jika login gagal
        if (shouldClearPassword) {
            passwordField.value = '';
            
            // Tambahkan efek visual bahwa password telah dihapus
            passwordField.style.backgroundColor = 'rgba(255, 107, 107, 0.1)';
            passwordField.placeholder = 'Masukkan kata sandi yang benar';
            
            // Reset placeholder setelah beberapa detik
            setTimeout(() => {
                passwordField.placeholder = 'Masukkan kata sandi Anda';
                passwordField.style.backgroundColor = '';
            }, 2000);
        }
        
        // Highlight field yang bermasalah dengan warna merah
        if (errorFieldId) {
            const field = document.getElementById(errorFieldId);
            if (field) {
                // Tambahkan kelas invalid untuk styling CSS
                field.classList.add('is-invalid');
                field.classList.remove('is-valid');
                
                // Fokus ke field yang error
                field.focus();
                
                // Jika error di password, tambahkan efek visual khusus
                if (errorFieldId === 'loginPassword') {
                    // Efek visual tambahan untuk password error
                    field.style.borderColor = 'var(--danger-color)';
                    field.style.boxShadow = '0 0 0 0.3rem rgba(255, 107, 107, 0.3)';
                    field.style.backgroundColor = 'rgba(255, 107, 107, 0.05)';
                    
                    // Tambahkan efek getar
                    field.style.animation = 'shake 0.5s ease-in-out';
                    
                    // Reset animasi setelah selesai
                    setTimeout(() => {
                        field.style.animation = '';
                    }, 500);
                }
                
                // Jika error di email, reset password field
                if (errorFieldId === 'loginEmail') {
                    const passwordField = document.getElementById('loginPassword');
                    if (passwordField) {
                        passwordField.classList.remove('is-invalid', 'is-valid');
                        passwordField.style.borderColor = '';
                        passwordField.style.boxShadow = '';
                        passwordField.style.backgroundColor = '';
                    }
                }
            }
        }
        
        // Tampilkan notifikasi
        showNotification(errorMessage, 'error');
        
        throw new Error(errorMessage);
    }
}

// Fungsi untuk handle registrasi dengan auto-clear password saat gagal
async function handleRegistration() {
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const childName = document.getElementById('childName').value;
    const childAge = document.getElementById('childAge').value;
    const childGrade = document.getElementById('childGrade').value;
    const childAvatar = document.getElementById('childAvatar').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    console.log('Attempting registration for:', email);
    
    // Reset semua field error
    const fields = ['registerEmail', 'registerPassword', 'confirmPassword', 'childName', 'childAge', 'childGrade', 'agreeTerms'];
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.remove('is-invalid', 'is-valid');
            // Reset styling
            field.style.borderColor = '';
            field.style.boxShadow = '';
            field.style.backgroundColor = '';
        }
    });
    
    try {
        // Create user account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        console.log('✅ Registration successful:', user.uid);
        
        // Save user data to Firestore
        await setDoc(doc(db, "users", user.uid), {
            email: email,
            childName: childName,
            childAge: parseInt(childAge),
            childGrade: childGrade,
            avatar: childAvatar,
            points: 0,
            badges: [],
            level: 1,
            createdAt: new Date(),
            lastLogin: new Date()
        });
        
        // Update user profile
        await updateProfile(user, {
            displayName: childName
        });
        
        // Efek visual sukses untuk password
        const passwordField = document.getElementById('registerPassword');
        if (passwordField) {
            passwordField.classList.add('is-valid');
            passwordField.style.borderColor = 'var(--success-color)';
        }
        
        showNotification('Pendaftaran berhasil! Mengarahkan ke dashboard...', 'success');
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
        
    } catch (error) {
        console.error('❌ Registration error:', error);
        
        let errorMessage = 'Terjadi kesalahan saat pendaftaran';
        let errorFieldId = null;
        let shouldClearPasswords = false;
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Email sudah digunakan. Silakan login atau gunakan email lain';
                errorFieldId = 'registerEmail';
                shouldClearPasswords = true;
                break;
            case 'auth/invalid-email':
                errorMessage = 'Format email tidak valid';
                errorFieldId = 'registerEmail';
                break;
            case 'auth/weak-password':
                errorMessage = 'Kata sandi terlalu lemah';
                errorFieldId = 'registerPassword';
                shouldClearPasswords = true;
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'Operasi tidak diizinkan. Hubungi administrator';
                shouldClearPasswords = true;
                break;
            default:
                errorMessage = error.message;
                shouldClearPasswords = true;
        }
        
        // CLEAR PASSWORD jika registrasi gagal
        if (shouldClearPasswords) {
            const passwordField = document.getElementById('registerPassword');
            const confirmPasswordField = document.getElementById('confirmPassword');
            
            if (passwordField) {
                passwordField.value = '';
                passwordField.style.backgroundColor = 'rgba(255, 107, 107, 0.1)';
                passwordField.placeholder = 'Buat kata sandi baru yang lebih kuat';
                
                // Reset placeholder setelah beberapa detik
                setTimeout(() => {
                    passwordField.placeholder = 'Buat kata sandi yang kuat';
                    passwordField.style.backgroundColor = '';
                }, 2000);
            }
            
            if (confirmPasswordField) {
                confirmPasswordField.value = '';
                confirmPasswordField.style.backgroundColor = 'rgba(255, 107, 107, 0.1)';
                confirmPasswordField.placeholder = 'Konfirmasi kata sandi baru';
                
                // Reset placeholder setelah beberapa detik
                setTimeout(() => {
                    confirmPasswordField.placeholder = 'Ulangi kata sandi Anda';
                    confirmPasswordField.style.backgroundColor = '';
                }, 2000);
            }
        }
        
        // Highlight field yang bermasalah dengan warna merah
        if (errorFieldId) {
            const field = document.getElementById(errorFieldId);
            if (field) {
                field.classList.add('is-invalid');
                field.classList.remove('is-valid');
                field.focus();
                
                // Efek visual khusus untuk password error
                if (errorFieldId === 'registerPassword') {
                    field.style.borderColor = 'var(--danger-color)';
                    field.style.boxShadow = '0 0 0 0.3rem rgba(255, 107, 107, 0.3)';
                    field.style.backgroundColor = 'rgba(255, 107, 107, 0.05)';
                    
                    // Tambahkan efek getar
                    field.style.animation = 'shake 0.5s ease-in-out';
                    
                    // Reset animasi setelah selesai
                    setTimeout(() => {
                        field.style.animation = '';
                    }, 500);
                }
            }
        }
        
        // Tampilkan notifikasi
        showNotification(errorMessage, 'error');
        
        throw new Error(errorMessage);
    }
}

// Fungsi untuk handle demo login
async function handleDemoLogin() {
    const demoLoginBtn = document.getElementById('demoLogin');
    const originalText = demoLoginBtn.innerHTML;
    
    // Show loading state
    demoLoginBtn.disabled = true;
    demoLoginBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Memproses...';
    
    const demoEmail = 'demo@edufunkids.com';
    const demoPassword = 'DemoPass123';
    
    try {
        // Try to login with demo credentials
        await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
        
        console.log('✅ Demo login successful');
        showNotification('Login demo berhasil! Mengarahkan ke dashboard...', 'success');
        
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
        
    } catch (error) {
        console.log('Demo account not found, creating new one...');
        
        try {
            // Create demo account if it doesn't exist
            await createDemoAccount();
        } catch (createError) {
            console.error('❌ Demo account creation failed:', createError);
            showNotification('Gagal membuat akun demo. Silakan coba lagi.', 'error');
            
            // Reset button state
            demoLoginBtn.disabled = false;
            demoLoginBtn.innerHTML = originalText;
        }
    }
}

// Fungsi untuk membuat akun demo
async function createDemoAccount() {
    const demoEmail = 'demo@edufunkids.com';
    const demoPassword = 'DemoPass123';
    
    const userCredential = await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
    const user = userCredential.user;
    
    // Save demo user data
    await setDoc(doc(db, "users", user.uid), {
        email: demoEmail,
        childName: 'Anak Demo',
        childAge: 7,
        childGrade: '2',
        avatar: '😊',
        points: 150,
        badges: ['fast-learner', 'quiz-master', 'game-champion'],
        level: 3,
        createdAt: new Date(),
        lastLogin: new Date(),
        isDemo: true
    });
    
    await updateProfile(user, {
        displayName: 'Anak Demo'
    });
    
    console.log('✅ Demo account created successfully');
    showNotification('Akun demo berhasil dibuat! Mengarahkan ke dashboard...', 'success');
    
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1500);
}

// Fungsi untuk cek existing authentication
function checkExistingAuth() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('User already logged in:', user.email);
            // Optional: Auto-redirect if user is already logged in
            // window.location.href = 'dashboard.html';
        }
    });
}

// Fungsi untuk menampilkan notifikasi yang lebih baik
function showNotification(message, type = 'info', duration = 5000) {
    // Hapus notifikasi lama jika ada
    const existingAlerts = document.querySelectorAll('.custom-alert');
    existingAlerts.forEach(alert => {
        if (alert.parentNode) {
            alert.remove();
        }
    });
    
    // Tentukan ikon berdasarkan jenis notifikasi
    const typeIcons = {
        'success': '✓',
        'error': '✗',
        'warning': '⚠',
        'info': 'ℹ'
    };
    
    const typeTitles = {
        'success': 'Berhasil',
        'error': 'Gagal',
        'warning': 'Peringatan',
        'info': 'Informasi'
    };
    
    // Buat elemen notifikasi
    const notification = document.createElement('div');
    notification.className = `custom-alert alert-${type}`;
    notification.setAttribute('role', 'alert');
    
    notification.innerHTML = `
        <div class="alert-content">
            <span class="alert-icon">${typeIcons[type] || 'ℹ'}</span>
            <div class="flex-grow-1">
                <strong style="display: block; margin-bottom: 2px;">${typeTitles[type] || 'Informasi'}</strong>
                <div class="alert-message" style="font-size: 0.9rem;">${message}</div>
            </div>
            <button type="button" class="alert-close" onclick="this.parentElement.parentElement.remove()">
                &times;
            </button>
        </div>
    `;
    
    // Tambahkan ke body
    document.body.appendChild(notification);
    
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
    const closeBtn = notification.querySelector('.alert-close');
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

// Export functions untuk penggunaan modular
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initLoginPage,
        validateForm,
        handleLogin,
        handleRegistration,
        handleDemoLogin
    };
}

// Global error handler untuk halaman login
window.addEventListener('error', function(e) {
    console.error('❌ Global error in login page:', e.error);
    showNotification('Terjadi kesalahan. Silakan refresh halaman.', 'error');
});