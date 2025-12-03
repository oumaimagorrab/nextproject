// lib/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCGWo_wyvIpaWOK40ldhoDxVom2oV-qmJc",
  authDomain: "smartdash-49bd8.firebaseapp.com",
  projectId: "smartdash-49bd8",
  storageBucket: "smartdash-49bd8.appspot.com",
  messagingSenderId: "443769982024",
  appId: "1:443769982024:web:2cb05dd5cf599f4ed51c7d",
  measurementId: "G-DHEEW8RLPP",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };
