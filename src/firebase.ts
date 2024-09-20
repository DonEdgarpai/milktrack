import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDcK52RUJZo-SC2pWBjaqmNnVGc_pepn2c",
  authDomain: "milktrack-1.firebaseapp.com",
  projectId: "milktrack-1",
  storageBucket: "milktrack-1.appspot.com",
  messagingSenderId: "490271260644",
  appId: "1:490271260644:web:ac4a972cb2b10e85c051f1",
  measurementId: "G-EPFTBJZXMZ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);