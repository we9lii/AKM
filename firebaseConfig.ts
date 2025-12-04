import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// =========================================================
// FIREBASE CONFIGURATION (REAL AUTHENTICATION)
// استبدل البيانات بالأسفل ببيانات مشروعك من Firebase Console
// =========================================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

let auth = null;

try {
  // Only initialize if keys are valid to prevent crash
  if (firebaseConfig.apiKey !== "YOUR_API_KEY_HERE") {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  }
} catch (error) {
  console.error("AKM Error: Failed to connect to authentication server.", error);
}

export { auth };
