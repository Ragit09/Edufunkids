# 📌 Final Project RPL – Sistem [Edufunkids]
EduFunKids – Platform Edukasi Interaktif Anak

## 👥 Identitas Kelompok
- **Nama Kelompok :** [kelompok 7]
- **Anggota & Jobdesk :**
  | Nama Anggota | Tugas / Jobdesk |
  |--------------|-----------------|
  | [Ragit Dwi Saputra] | Requirement Gathering, Implementasi Frontend |
  | [amalia Aisyaruradia] | Design (UML, UI), SRS, materi edukasi, materi kuis |
  | [Nadia Syahira] | Implementasi Backend, Testing & Deployment |

## Sistem ini dibuat berdasarkan 
EduFunKids adalah aplikasi web edukasi interaktif berbasis browser yang dirancang untuk anak-anak. Aplikasi ini menyediakan permainan edukasi seperti tebak huruf hitung cepat,dan mengambar dilengkapi dengan audio dan tampilan ramah anak. EduFunKids dibuat untuk mempermudah proses belajar melalui metode “belajar sambil bermain”.
### Sistem ini dibuat berdasarkan permintaan dari klien kelompok 5 dengan tujuan untuk menyelesaikan permasalahan:
- [Kurangnya media pembelajaran interaktif untuk anak usia dini yang menarik, mudah dipahami, dan dapat diakses secara online.]
- [Materi belajar untuk anak-anak sering monoton sehingga anak cepat bosan dan kurang fokus.]
- [Orang tua maupun guru membutuhkan platform yang dapat membantu anak belajar sambil bermain.]
### Solusi yang dikembangkan berupa aplikasi:
- [membuatkan aplikasi berbasis Web]
### yang menyediakan fitur utama:
- [Halaman Dashboard berisi menu pembelajaran.]
- [Materi interaktif seperti warna, angka, huruf, hewan, dan bentuk.]
- [Mini games edukatif sebagai media belajar sambil bermain.]
- [Audio & visual interaktif untuk membantu anak memahami materi.]
- [Desain UI/UX ramah anak yang colorful, simpel, dan mudah digunakan.]

## Tujuan Sistem / Permasalahan yang Diselesaikan
Menyediakan sarana pembelajaran interaktif berbasis web untuk anak-anak.
Membantu anak memahami dasar membaca dan berhitung melalui permainan edukatif.
Menghadirkan media belajar yang mudah diakses di berbagai perangkat (laptop/PC).
Memberikan contoh implementasi game edukasi menggunakan web technology dan database Firebase.

## Teknologi yang Digunakan
HTML5 – Struktur halaman
CSS3 – Styling antarmuka
JavaScript – Logika game & interaksi
Firebase Firestore – Database untuk penyimpanan data
Assets/Music – Folder yang memuat musik dan sound effect
Browser (Chrome/Edge/Firefox) – Media menjalankan aplikasi,
tapi disarankan menggunakan chrome agar narator mengunakan bahasa indonesia.

## Cara Menjalankan Aplikasi
Aplikasi dapat langsung dijalankan tanpa instalasi melalui link berikut:
https://ragit09.github.io/Edufunkids/

## Cara Instalasi
Aplikasi ini berbasis web statis, sehingga tidak memerlukan instalasi khusus.
Cukup buka file .html menggunakan browser atau gunakan Live Server pada VSCode.

## Cara Konfigurasi
Pastikan Anda memiliki file konfigurasi Firebase pada bagian:

const firebaseConfig = {
  apiKey: "AIzaSyAiu2Z1N2NBbtboHAtyWTeRIENOjkdRGgk",
  authDomain: "edufunkids-8cd92.firebaseapp.com",
  projectId: "edufunkids-8cd92",
  storageBucket: "edufunkids-8cd92.firebasestorage.app",
  messagingSenderId: "809197357438",
  appId: "1:809197357438:web:f42ce4a2779d7507bacb2f",
  measurementId: "G-28NC6QM62J"
};

## Cara Menjalankan (Run Project)
Jalankan secara langsung:
Buka index.html dengan browser.
Jalankan menggunakan Live Server (disarankan):
Install ekstensi "Live Server" di VSCode
Klik kanan file HTML → Open with Live Server

## Akun Demo (Login)
Gunakan akun berikut jika halaman login diperlukan:
Email: demo@edufunkids.com
Password: DemoPass123

## Link Deployment / Link APK 
Link Deployment: https://ragit09.github.io/Edufunkids/

## Screenshot Halaman Utama 
/screenshots/homepage.png

## Catatan Tambahan
Aplikasi optimal di tablet, laptop/PC.
akses web menggunakan chrome agar voive narator menggunakan bahasa indonesia
Musik autoplay dapat diblokir oleh browser tertentu.
File audio wajib berada pada folder music/.
file foto wajib didalam folder img/

## Hal-hal Penting yang Perlu Diketahui
masih ada beberapagame yang harus di buat sementar hanya 3.
Tampilan masih dapat dikembangkan untuk lebih modern.
Firestore tidak menyimpan data secara offline default tanpa konfigurasi tambahan.

## Keterangan Tugas
Project ini dibuat untuk memenuhi Tugas Final Project mata kuliah Rekayasa Perangkat Lunak.
Dosen Pengampu: Dila Nurlaila, M.Kom
