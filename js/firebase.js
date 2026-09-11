// Firebase configuration - PASTE YOUR CONFIG VALUES HERE
const firebaseConfig = {
    apiKey: "AIzaSyAKOMmtSGJiGWngb2WZsZPjQY73WkQRN6Y",
    authDomain: "dailyskills-ed244.firebaseapp.com",
    projectId: "dailyskills-ed244",
    storageBucket: "dailyskills-ed244.firebasestorage.app",
    messagingSenderId: "995753614850",
    appId: "1:995753614850:web:b7bc2426b7187c3ac6911b"
};

// Initialize Firebase
export let db = null;
export let auth = null;
try {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
} catch (e) {
    console.log('Firebase init skipped (config not set or SDK unavailable):', e.message);
}
