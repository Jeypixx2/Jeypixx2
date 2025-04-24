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


function showLoading(show) {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = show ? 'block' : 'none';
    }
}


function showNotification(message, type = "success") {
    const notification = document.getElementById("notification");
    if (notification) {
        notification.innerText = message;
        notification.className = `notification ${type}`;
        notification.style.display = "block";


        setTimeout(() => {
            notification.style.display = "none";
        }, 3000);
    }
}

let isRegistering = false; 


document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const location = document.getElementById('location').value;
    const number = document.getElementById('number').value;
    const userType = document.getElementById('userType').value;

 
    if (!name || !email || !password || !userType) {
        showNotification('Please fill out all fields!', 'error');
        return;
    }

    try {
        isRegistering = true;
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userData = userType === "admin"
            ? { name, email, userType: "admin" }
            : { name, email, location, number, joined: new Date().toLocaleDateString(), userType: "user" };

        const userNode = userType === "admin" ? "admins/" : "users/";
        await set(ref(database, userNode + user.uid), userData);

        showNotification('Account created successfully!', 'success');
        setTimeout(() => {
            window.location.href = userType === "admin" ? "admin.html" : "index.html";
        }, 2000); 
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        isRegistering = false;
    }
});



document.getElementById('loginForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    showLoading(true);

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const userType = document.getElementById('userType').value;

    try {
        await setPersistence(auth, browserLocalPersistence);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userTypeInDB = await getUserType(user.uid);
        if (!userTypeInDB) {
            showNotification("❌ No user record found in the database!", "error");
            await signOut(auth);
            return;
        }

        if (userTypeInDB.toLowerCase() !== userType.toLowerCase()) {
            showNotification("❌ Unauthorized access: Incorrect user type.", "error");
            await signOut(auth);
            return;
        }

        showNotification('Login successful! Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = userType === "admin" ? "admin.html" : "index.html";
        }, 1500);
    } catch (error) {
        showNotification('Login failed: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
});




async function getUserType(uid) {
    try {
        const adminRef = ref(database, 'admins/' + uid);
        const userRef = ref(database, 'users/' + uid);

        console.log(`🔍 Checking userType for UID: ${uid}`);

        const adminSnapshot = await get(adminRef);
        if (adminSnapshot.exists()) {
            console.log("✅ User is an Admin");
            return "admin";
        }

        const userSnapshot = await get(userRef);
        if (userSnapshot.exists()) {
            console.log("✅ User is a Regular User");
            return "user";
        }

        console.log("❌ User type not found in database.");
        return null;
    } catch (error) {
        console.error("❌ Error fetching user type:", error.message);
        return null;
    }
}


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

            document.getElementById("editName").value = data.name || "";
            document.getElementById("editLocation").value = data.location || "";
            document.getElementById("editPhone").value = data.number || "";
        } else {
            console.log("No profile data found.");
        }
    } else {
        console.log("User not authenticated.");
    }
}



if (window.location.pathname.includes("profile.html")) {
    loadProfile();
}
