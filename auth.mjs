import { auth, database } from "./firebase-config.mjs";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    setPersistence,
    browserLocalPersistence,
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { ref, set, get } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";

// ✅ Show/Hide Loading
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

let isRegistering = false; // Flag to prevent unnecessary redirects during registration

// ✅ Register Form Submission
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get user input values
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const location = document.getElementById('location').value;
    const number = document.getElementById('number').value;
    const userType = document.getElementById('userType').value;

    // ✅ Check if userType is valid
    if (!userType) {
        showNotification('Please select a user type!', 'error');
        return;
    }

    try {
        isRegistering = true; // Prevent unnecessary redirects during registration
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userData = userType === "admin"
            ? { name: name, email: email, userType: "admin" }
            : { name: name, email: email, location: location, number: number, joined: new Date().toLocaleDateString(), userType: "user" };

        // ✅ Save data to the correct node
        const userNode = userType === "admin" ? "admins/" : "users/";
        await set(ref(database, userNode + user.uid), userData);

        showNotification('Account created successfully!', 'success');
        setTimeout(() => {
            const redirectPage = userType === "admin" ? "admin.html" : "index.html";
            window.location.href = redirectPage;
        }, 1500);
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        isRegistering = false; // Reset flag after registration
    }
});

// ✅ User Login
document.getElementById('loginForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    showLoading(true);

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const userType = document.getElementById('userType').value; // Get user type from dropdown

    try {
        // ✅ Set persistence to local (remembers login across page reloads)
        await setPersistence(auth, browserLocalPersistence);

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // ✅ Check if userType matches and redirect accordingly
        const userTypeInDB = await getUserType(user.uid);
        if (userTypeInDB === userType) {
            const redirectPage = userType === "admin" ? "admin.html" : "index.html";
            showNotification('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = redirectPage;
            }, 1500);
        } else {
            showNotification("Unauthorized access or incorrect user type.", "error");
            await signOut(auth); // Logout user if userType mismatch
        }
    } catch (error) {
        showNotification('Login failed: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
});

// ✅ Check User Type from Database with Corrected Logic
async function getUserType(uid) {
    try {
        const adminRef = ref(database, 'admins/' + uid);
        const userRef = ref(database, 'users/' + uid);

        const adminSnapshot = await get(adminRef);
        if (adminSnapshot.exists()) {
            return "admin";
        }

        const userSnapshot = await get(userRef);
        if (userSnapshot.exists()) {
            return "user";
        }

        return null; // No matching record found
    } catch (error) {
        console.error("Error fetching user type:", error.message);
        return null;
    }
}


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

// ✅ Load Profile Data on Profile Page
async function loadProfile() {
    const user = auth.currentUser;

    if (user) {
        const userRef = ref(database, 'users/' + user.uid);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
            const data = snapshot.val();
            console.log("Loaded profile data:", data);

            document.getElementById("profileName").innerText = data.name || "N/A";
            document.getElementById("profileEmail").innerText = data.email || "N/A";
            document.getElementById("profileJoined").innerText = "Joined: " + (data.joined || "N/A");
            document.getElementById("profileLocation").innerText = "Location: " + (data.location || "N/A");
            document.getElementById("profilePhone").innerText = "Phone: " + (data.number || "N/A");
        } else {
            console.log("No profile data found.");
        }
    } else {
        console.log("User not authenticated.");
    }
}

// ✅ Call loadProfile() when profile.html is loaded
if (window.location.pathname.includes("profile.html")) {
    loadProfile();
}
