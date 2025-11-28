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
    const inputs = form.querySelectorAll('input[required], select[required]');
    
    inputs.forEach(input => {
        // Reset validation state
        input.classList.remove('is-valid', 'is-invalid');
        
        // Check required fields
        if (!input.value.trim()) {
            showFieldError(input, 'Field ini wajib diisi');
            isValid = false;
            return;
        }
        
        // Email validation
        if (input.type === 'email' && !isValidEmail(input.value)) {
            showFieldError(input, 'Format email tidak valid');
            isValid = false;
            return;
        }
        
        // Password validation
        if (input.type === 'password') {
            const passwordError = validatePassword(input.value, input.id);
            if (passwordError) {
                showFieldError(input, passwordError);
                isValid = false;
                return;
            }
        }
        
        // Confirm password validation
        if (input.id === 'confirmPassword') {
            const password = document.getElementById('registerPassword').value;
            if (input.value !== password) {
                showFieldError(input, 'Konfirmasi kata sandi tidak cocok');
                isValid = false;
                return;
            }
        }
        
        // Age validation
        if (input.id === 'childAge') {
            const age = parseInt(input.value);
            if (age < 3 || age > 12) {
                showFieldError(input, 'Usia harus antara 3-12 tahun');
                isValid = false;
                return;
            }
        }
        
        // If all validations pass
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

// Fungsi untuk menampilkan error field
function showFieldError(input, message) {
    input.classList.add('is-invalid');
    
    let feedback = input.parentElement.querySelector('.invalid-feedback');
    if (!feedback) {
        feedback = document.createElement('div');
        feedback.className = 'invalid-feedback';
        input.parentElement.appendChild(feedback);
    }
    
    feedback.textContent = message;
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
        showNotification(error.message, 'error');
    } finally {
        // Hide loading state
        submitBtn.disabled = false;
        spinner.classList.add('d-none');
    }
}

// Fungsi untuk handle login
async function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    console.log('Attempting login for:', email);
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        console.log('✅ Login successful:', user.email);
        showNotification('Login berhasil! Mengarahkan ke dashboard...', 'success');
        
        // Set persistence based on remember me
        // Note: Firebase Auth persistence is handled automatically
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
        
    } catch (error) {
        console.error('❌ Login error:', error);
        
        let errorMessage = 'Terjadi kesalahan saat login';
        
        switch (error.code) {
            case 'auth/invalid-email':
                errorMessage = 'Format email tidak valid';
                break;
            case 'auth/user-disabled':
                errorMessage = 'Akun ini telah dinonaktifkan';
                break;
            case 'auth/user-not-found':
                errorMessage = 'Akun tidak ditemukan';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Kata sandi salah';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Terlalu banyak percobaan login. Coba lagi nanti';
                break;
            default:
                errorMessage = error.message;
        }
        
        throw new Error(errorMessage);
    }
}

// Fungsi untuk handle registrasi
async function handleRegistration() {
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const childName = document.getElementById('childName').value;
    const childAge = document.getElementById('childAge').value;
    const childGrade = document.getElementById('childGrade').value;
    const childAvatar = document.getElementById('childAvatar').value;
    
    console.log('Attempting registration for:', email);
    
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
        
        showNotification('Pendaftaran berhasil! Mengarahkan ke dashboard...', 'success');
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
        
    } catch (error) {
        console.error('❌ Registration error:', error);
        
        let errorMessage = 'Terjadi kesalahan saat pendaftaran';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Email sudah digunakan. Silakan login atau gunakan email lain';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Format email tidak valid';
                break;
            case 'auth/weak-password':
                errorMessage = 'Kata sandi terlalu lemah';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'Operasi tidak diizinkan. Hubungi administrator';
                break;
            default:
                errorMessage = error.message;
        }
        
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

// Fungsi untuk menampilkan notifikasi
function showNotification(message, type = 'info', duration = 5000) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show`;
    notification.style.cssText = `
        position: fixed;
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