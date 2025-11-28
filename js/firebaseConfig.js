// js/firebaseConfig.js
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAiu2Z1N2NBbtboHAtyWTeRIENOjkdRGgk",
  authDomain: "edufunkids-8cd92.firebaseapp.com",
  projectId: "edufunkids-8cd92",
  storageBucket: "edufunkids-8cd92.firebasestorage.app",
  messagingSenderId: "809197357438",
  appId: "1:809197357438:web:f42ce4a2779d7507bacb2f",
  measurementId: "G-28NC6QM62J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, analytics };