import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getPerformance } from "firebase/performance";
import Constants from 'expo-constants';

// Get Firebase configuration from environment variables
function getFirebaseConfig() {
  try {
    // First try to get config from Expo Constants (app.config.js)
    if (Constants.expoConfig?.extra) {
      const {
        FIREBASE_API_KEY,
        FIREBASE_AUTH_DOMAIN,
        FIREBASE_PROJECT_ID,
        FIREBASE_STORAGE_BUCKET,
        FIREBASE_MESSAGING_SENDER_ID,
        FIREBASE_APP_ID,
        FIREBASE_MEASUREMENT_ID
      } = Constants.expoConfig.extra;

      return {
        apiKey: FIREBASE_API_KEY,
        authDomain: FIREBASE_AUTH_DOMAIN,
        projectId: FIREBASE_PROJECT_ID,
        storageBucket: FIREBASE_STORAGE_BUCKET, 
        messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
        appId: FIREBASE_APP_ID,
        measurementId: FIREBASE_MEASUREMENT_ID
      };
    }
    
    // If not found in Constants, check process.env (direct environment variables)
    console.warn('Firebase config not found in Expo Constants, checking process.env');
    return {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
      measurementId: process.env.FIREBASE_MEASUREMENT_ID
    };
  } catch (error) {
    console.error('Error getting Firebase config:', error);
    throw new Error('Firebase configuration is missing or invalid. Please check your environment variables.');
  }
}

// Get the Firebase configuration 
const firebaseConfig = getFirebaseConfig();

// Validate the configuration
if (!firebaseConfig.projectId) {
  throw new Error('Firebase projectId is missing. Make sure your environment variables are properly set.');
}

if (!firebaseConfig.apiKey) {
  throw new Error('Firebase apiKey is missing. Make sure your environment variables are properly set.');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize Performance Monitoring only in browser environment
let perf = null;
if (typeof window !== 'undefined') {
  try {
    perf = getPerformance(app);
  } catch (error) {
    console.error('Firebase Performance initialization error:', error);
  }
}

export { app, db, storage, perf };