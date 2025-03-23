import { auth, database } from "./firebase-config.mjs";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";

// Show loading indicator (optional: add a <div id="loading">Loading...</div> in your HTML)
function showLoading(show) {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = show ? 'block' : 'none';
    }
}

// ✅ Show Notification Function
function showNotification(message, type = "success") {
    const notification = document.getElementById("notification");
    if (notification) {
        notification.innerText = message;
        notification.className = `notification ${type}`;
        notification.style.display = "block";

        // Hide after 3 seconds
        setTimeout(() => {
            notification.style.display = "none";
        }, 3000);
    }
}

let isRegistering = false; // Add this flag to track registration

// ✅ Register Form Submission
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get user input values
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const location = document.getElementById('location').value;
    const number = document.getElementById('number').value;

    try {
        // ✅ Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // ✅ Save user info in Firebase Database
        await set(ref(database, 'users/' + user.uid), {
            name: name,
            email: email,
            location: location,
            number: number,
            joined: new Date().toLocaleDateString(),
        });

        showNotification('Account created successfully!', 'success');
        setTimeout(() => {
            window.location.href = 'profile.html'; // ✅ Redirect to profile
        }, 1500);

    } catch (error) {
        showNotification(error.message, 'error');
    }
});

// ✅ Check Auth State and Handle Redirects
onAuthStateChanged(auth, (user) => {
    const currentPage = window.location.pathname.split("/").pop();

    // ✅ Prevent redirection during registration
    if (isRegistering) {
        return;
    }

    if (!user && currentPage !== "login.html" && currentPage !== "registration.html") {
        window.location.href = "login.html";
        return;
    }

    // ✅ Automatically redirect logged-in user
    if (user) {
        if (currentPage === "login.html" || currentPage === "register.html") {
            window.location.href = "index.html";
        }
    }

    // ✅ Log user info
    if (user) {
        console.log("User logged in:", user.uid);
    } else {
        console.log("No user logged in.");
    }
});

// ✅ User Login
document.getElementById('loginForm')?.addEventListener('submit', function (e) {
    e.preventDefault();

    showLoading(true);

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            showNotification('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        })
        .catch((error) => {
            showNotification('Login failed: ' + error.message, 'error');
        })
        .finally(() => {
            showLoading(false);
        });
});

// ✅ Log Out Function
document.getElementById('logoutButton')?.addEventListener('click', function () {
    signOut(auth)
        .then(() => {
            showNotification('Logout successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        })
        .catch((error) => {
            showNotification('Logout failed: ' + error.message, 'error');
        });
});
