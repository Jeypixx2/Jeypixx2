import { auth, database } from "./firebase-config.mjs";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { ref, set, get } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";

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
    const userType = document.getElementById('userType').value; // ✅ Get selected user type

    // ✅ Check if userType is valid
    if (!userType) {
        showNotification('Please select a user type!', 'error');
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userData = userType === "admin"
            ? {
                  name: name,
                  email: email,
              }
            : {
                  name: name,
                  email: email,
                  location: location,
                  number: number,
                  joined: new Date().toLocaleDateString(),
              };

        // ✅ Save data to the correct node
        const userNode = userType === "admin" ? "admins/" : "users/";

        await set(ref(database, userNode + user.uid), userData);

        showNotification('Account created successfully!', 'success');
        setTimeout(() => {
            // ✅ Redirect admin to admin.html and user to profile.html
            const redirectPage = userType === "admin" ? "admin.html" : "profile.html";
            window.location.href = redirectPage;
        }, 1500);
    } catch (error) {
        showNotification(error.message, 'error');
    }
});

// ✅ Check Auth State and Handle Redirects
onAuthStateChanged(auth, async (user) => {
    const currentPage = window.location.pathname.split("/").pop();

    // ✅ Prevent redirection during registration
    if (isRegistering) {
        return;
    }

    if (!user && currentPage !== "login.html" && currentPage !== "registration.html") {
        window.location.href = "login.html";
        return;
    }

    if (user) {
        // ✅ Check if the logged-in user is admin or regular user
        const adminRef = ref(database, 'admins/' + user.uid);
        const adminSnapshot = await get(adminRef);

        // ✅ Redirect to the correct page
        if (currentPage === "login.html" || currentPage === "register.html") {
            const redirectPage = adminSnapshot.exists() ? "admin.html" : "profile.html";
            window.location.href = redirectPage;
        }
    }

    if (user) {
        console.log("User logged in:", user.uid);
    } else {
        console.log("No user logged in.");
    }
});

// ✅ User Login
document.getElementById('loginForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    showLoading(true);

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // ✅ Check if the logged-in user is admin or regular user
        const adminRef = ref(database, 'admins/' + user.uid);
        const adminSnapshot = await get(adminRef);

        const redirectPage = adminSnapshot.exists() ? "admin.html" : "profile.html";

        showNotification('Login successful! Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = redirectPage;
        }, 1500);

    } catch (error) {
        showNotification('Login failed: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
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
