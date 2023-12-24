// firebase.js
import { initializeApp } from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyDMaX2bDL4on35RNgo_UbKiwJZDl1iKZN4",
    authDomain: "playflow-microservises.firebaseapp.com",
    databaseURL: "https://playflow-microservises-default-rtdb.firebaseio.com",
    projectId: "playflow-microservises",
    storageBucket: "playflow-microservises.appspot.com",
    messagingSenderId: "791402970652",
    appId: "1:791402970652:web:37a7cb843975bfc46069d9"
};

const firebaseApp = initializeApp(firebaseConfig);

export default firebaseApp;
