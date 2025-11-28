// js/index.js - JavaScript untuk Landing Page EduFunKids

// Fungsi untuk inisialisasi ketika DOM selesai dimuat
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎓 EduFunKids Landing Page loaded successfully!');
    
    // Inisialisasi semua fitur
    initApp();
});

// Fungsi utama untuk inisialisasi aplikasi
function initApp() {
    // Sembunyikan loading spinner
    hideLoadingSpinner();
    
    // Inisialisasi semua komponen
    initSmoothScroll();
    initFeatureAnimations();
    initCounters();
    initScrollAnimations();
    initNavigation();
    initFloatingElements();
    
    // Preload gambar
    preloadImages();
    
    // Tambahkan event listener untuk resize
    window.addEventListener('resize', handleResize);
    
    console.log('✅ Semua komponen berhasil diinisialisasi');
}

// Fungsi untuk menyembunyikan loading spinner
function hideLoadingSpinner() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        // Tunggu sedikit untuk memastikan semua konten dimuat
        setTimeout(() => {
            spinner.classList.add('fade-out');
            setTimeout(() => {
                spinner.style.display = 'none';
            }, 500);
        }, 1000);
    }
}

// Fungsi untuk smooth scrolling
function initSmoothScroll() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 80; // Adjust for navbar height
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
                
                // Update URL tanpa refresh
                history.pushState(null, null, targetId);
            }
        });
    });
}

// Fungsi untuk animasi feature boxes
function initFeatureAnimations() {
    const featureBoxes = document.querySelectorAll('.feature-box');
    
    featureBoxes.forEach(box => {
        // Hover effects
        box.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
            this.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
        });
        
        box.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
        });
        
        // Click effects
        box.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
    });
}

// Fungsi untuk counter animasi
function initCounters() {
    const counters = document.querySelectorAll('.counter');
    
    if (counters.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { 
            threshold: 0.5,
            rootMargin: '0px 0px -50px 0px'
        });
        
        counters.forEach(counter => {
            observer.observe(counter);
        });
    }
}

// Fungsi untuk animasi counter
function animateCounter(counter) {
    const target = parseInt(counter.getAttribute('data-target'));
    const duration = 2000; // 2 seconds
    const frameDuration = 1000 / 60; // 60fps
    const totalFrames = Math.round(duration / frameDuration);
    let frame = 0;
    
    const counterInterval = setInterval(() => {
        frame++;
        const progress = frame / totalFrames;
        const currentCount = Math.round(target * progress);
        
        counter.textContent = formatNumber(currentCount);
        
        if (frame === totalFrames) {
            clearInterval(counterInterval);
            counter.textContent = formatNumber(target) + '+';
        }
    }, frameDuration);
}

// Fungsi untuk animasi saat scroll
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.fade-in-up');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                
                // Stagger animation untuk elemen dalam container yang sama
                const siblings = Array.from(entry.target.parentElement.children);
                const index = siblings.indexOf(entry.target);
                entry.target.style.transitionDelay = `${index * 0.1}s`;
            }
        });
    }, { 
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    animatedElements.forEach(el => {
        observer.observe(el);
    });
}

// Fungsi untuk navigasi
function initNavigation() {
    const navbar = document.querySelector('.navbar');
    let lastScrollY = window.scrollY;
    
    // Navbar background on scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.backdropFilter = 'blur(10px)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 1)';
            navbar.style.backdropFilter = 'none';
        }
        
        // Hide/show navbar on scroll
        if (window.scrollY > lastScrollY && window.scrollY > 200) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }
        
        lastScrollY = window.scrollY;
    });
    
    // Active navigation link
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    window.addEventListener('scroll', () => {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.clientHeight;
            
            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

// Fungsi untuk floating elements
function initFloatingElements() {
    const floatingElements = document.querySelectorAll('.floating-element');
    
    floatingElements.forEach((element, index) => {
        // Randomize animation delay and duration
        const randomDelay = Math.random() * 2;
        const randomDuration = 3 + Math.random() * 2;
        
        element.style.animationDelay = `${randomDelay}s`;
        element.style.animationDuration = `${randomDuration}s`;
        
        // Add hover effect
        element.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.2)';
            this.style.animationPlayState = 'paused';
        });
        
        element.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
            this.style.animationPlayState = 'running';
        });
    });
}

// Fungsi untuk preload gambar
function preloadImages() {
    const images = [
        '../img/foto1.png',
        '../img/foto2.png', 
        '../img/foto3.png'
    ];
    
    let loadedCount = 0;
    const totalImages = images.length;
    
    images.forEach(src => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            loadedCount++;
            console.log(`🖼️ Gambar loaded: ${src} (${loadedCount}/${totalImages})`);
            
            if (loadedCount === totalImages) {
                console.log('✅ Semua gambar berhasil dimuat');
            }
        };
        img.onerror = () => {
            console.error(`❌ Gagal memuat gambar: ${src}`);
            loadedCount++;
        };
    });
}

// Fungsi untuk handle resize window
function handleResize() {
    console.log('🔄 Window resized:', window.innerWidth, 'x', window.innerHeight);
    
    // Update any responsive elements here
    const navbar = document.querySelector('.navbar');
    if (window.innerWidth < 992) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
    } else {
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 1)';
        }
    }
}

// Fungsi utility untuk format angka
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
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

// Fungsi untuk validasi form
function validateForm(form) {
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        const feedback = input.parentElement.querySelector('.invalid-feedback') || 
                        createFeedbackElement(input);
        
        if (!input.value.trim()) {
            input.classList.add('is-invalid');
            feedback.textContent = 'Field ini wajib diisi';
            isValid = false;
        } else if (input.type === 'email' && !isValidEmail(input.value)) {
            input.classList.add('is-invalid');
            feedback.textContent = 'Format email tidak valid';
            isValid = false;
        } else if (input.type === 'password' && input.value.length < 8) {
            input.classList.add('is-invalid');
            feedback.textContent = 'Password minimal 8 karakter';
            isValid = false;
        } else {
            input.classList.remove('is-invalid');
            input.classList.add('is-valid');
        }
    });
    
    return isValid;
}

// Fungsi pembantu untuk validasi email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Fungsi untuk membuat feedback element
function createFeedbackElement(input) {
    const feedback = document.createElement('div');
    feedback.className = 'invalid-feedback';
    input.parentElement.appendChild(feedback);
    return feedback;
}

// Fungsi untuk debounce (mengurangi frekuensi pemanggilan fungsi)
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export functions untuk penggunaan modular
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initApp,
        hideLoadingSpinner,
        initSmoothScroll,
        initFeatureAnimations,
        initCounters,
        initScrollAnimations,
        formatNumber,
        showNotification,
        validateForm,
        debounce
    };
}

// Global error handler
window.addEventListener('error', function(e) {
    console.error('❌ Global error:', e.error);
    showNotification('Terjadi kesalahan. Silakan refresh halaman.', 'error');
});

// Service Worker Registration (jika diperlukan)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('✅ ServiceWorker registered: ', registration.scope);
            })
            .catch(function(error) {
                console.log('❌ ServiceWorker registration failed: ', error);
            });
    });
}