import {getAuth, GoogleAuthProvider} from "firebase/auth"
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration for RCR Platform
// Values from Firebase Console → Project Settings → Your apps
// IMPORTANT: Get the API key from Firebase Console, not from here
// The API key below might be invalid - use environment variable instead
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY || "AIzaSyCVDIYPWKVAyb8ZsNM6VL0l3eUGiX0T4u0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTHDOMAIN || "raj-chem-reactor.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECTID || "raj-chem-reactor",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGEBUCKET || "raj-chem-reactor.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGINGSENDERID || "1046096417550",
  appId: import.meta.env.VITE_FIREBASE_APPID || "1:1046096417550:web:7bd27957c310b89924fd5f",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENTID || "G-PMVK5MGY9W"
};

// Validate API key format
if (firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('AIzaSy')) {
  console.warn("⚠️ Firebase API key format looks incorrect. Should start with 'AIzaSy'");
}

// Initialize Firebase
let app, auth, provider, analytics;

try {
  // Validate API key before initializing
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "AIzaSyDummyKeyIfNotSet" || !firebaseConfig.apiKey.startsWith('AIzaSy')) {
    console.error("❌ Invalid Firebase API Key!");
    console.error("   Please get your API key from Firebase Console:");
    console.error("   1. Go to https://console.firebase.google.com/");
    console.error("   2. Select project: raj-chem-reactor");
    console.error("   3. Settings → Project settings → Your apps → Web app");
    console.error("   4. Copy the apiKey value");
    console.error("   5. Set it in frontend/.env as VITE_FIREBASE_APIKEY=your-key");
    console.error("   6. Restart your development server");
    throw new Error("Invalid Firebase API Key. Please set VITE_FIREBASE_APIKEY in .env file.");
  }
  
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  provider = new GoogleAuthProvider();
  
  // Add scopes for Google Sign-In
  provider.addScope('email');
  provider.addScope('profile');
  
  // Initialize Analytics (only in browser, not in SSR)
  if (typeof window !== 'undefined') {
    try {
      analytics = getAnalytics(app);
      console.log("✅ Firebase Analytics initialized");
    } catch (analyticsError) {
      console.warn("⚠️ Firebase Analytics initialization failed:", analyticsError);
      // Analytics is optional, continue without it
    }
  }
  
  console.log("✅ Firebase initialized successfully");
  console.log("   Project:", firebaseConfig.projectId);
  console.log("   Auth Domain:", firebaseConfig.authDomain);
  console.log("   API Key:", firebaseConfig.apiKey.substring(0, 20) + "...");
  console.log("   Using API Key from:", import.meta.env.VITE_FIREBASE_APIKEY ? "Environment Variable ✅" : "Hardcoded (not recommended)");
  
  // Verify auth is working
  if (auth) {
    console.log("✅ Firebase Auth is ready");
  } else {
    console.error("❌ Firebase Auth is null");
  }
  
  if (provider) {
    console.log("✅ Google Auth Provider is ready");
  } else {
    console.error("❌ Google Auth Provider is null");
  }
} catch (error) {
  console.error("❌ Firebase initialization error:", error);
  console.error("   Error name:", error.name);
  console.error("   Error message:", error.message);
  console.error("   Error code:", error.code);
  
  // Check for API key errors specifically
  if (error.message && error.message.includes('API key')) {
    console.error("\n🔴 API KEY ERROR DETECTED!");
    console.error("   The Firebase API key is invalid or missing.");
    console.error("   Solution:");
    console.error("   1. Go to Firebase Console: https://console.firebase.google.com/");
    console.error("   2. Select project: raj-chem-reactor");
    console.error("   3. Settings → Project settings → Your apps");
    console.error("   4. Copy the apiKey from the config");
    console.error("   5. Create frontend/.env file with:");
    console.error("      VITE_FIREBASE_APIKEY=your-api-key-here");
    console.error("   6. Restart your development server");
  }
  
  // Create dummy objects to prevent crashes
  auth = null;
  provider = null;
  analytics = null;
}

export {auth, provider, analytics}