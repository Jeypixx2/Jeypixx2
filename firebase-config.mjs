/// firebase-config.mjs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC1tTi3cGh3CcFx3TiVWzmYNBTOoRhPkzw",
    authDomain: "kina-dadi.firebaseapp.com",
    databaseURL: "https://kina-dadi-default-rtdb.firebaseio.com",
    projectId: "kina-dadi",
    storageBucket: "kina-dadi.appspot.com",
    messagingSenderId: "881394879607",
    appId: "1:881394879607:web:585180b7837e216e35ca72",
    measurementId: "G-K415T91SBQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

export { app, auth, database };

