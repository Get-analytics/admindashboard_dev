import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Your Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyAD-YXEaDv_lpBa8dSJNBY7kb6iDNBO_gI",
    authDomain: "sendnow-b4035.firebaseapp.com",
    projectId: "sendnow-b4035",
    storageBucket: "sendnow-b4035.firebasestorage.app",
    messagingSenderId: "1028875970822",
    appId: "1:1028875970822:web:b087fce00179e0420c5687",
    measurementId: "G-J6E40HN5PY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); // ✅ Export auth properly

// Google sign-in handler
export const signInWithGoogle = () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider); // Handles Google OAuth flow and returns result
};
