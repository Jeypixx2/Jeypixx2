import { auth, database } from "./firebase-config.mjs";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    setPersistence,
    browserLocalPersistence,
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import {
    ref as dbRef,
    set,
    get,
    push,
    update
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";


function showLoading(show) {
    const el = document.getElementById('loading');
    if (el) el.style.display = show ? 'block' : 'none';
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
    const location = document.getElementById('location')?.value;
    const number = document.getElementById('number')?.value;
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
            : {
                name,
                email,
                location,
                number,
                joined: new Date().toLocaleDateString(),
                userType: "user"
            };

        const userNode = userType === "admin" ? "admins/" : "users/";
        await set(dbRef(database, userNode + user.uid), userData);

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
    const adminRef = dbRef(database, 'admins/' + uid);
    const userRef = dbRef(database, 'users/' + uid);

    const adminSnapshot = await get(adminRef);
    if (adminSnapshot.exists()) return "admin";

    const userSnapshot = await get(userRef);
    if (userSnapshot.exists()) return "user";

    return null;
}

document.getElementById('logoutButton')?.addEventListener('click', () => {
    signOut(auth).then(() => {
        showNotification('Logout successful! Redirecting...', 'success');
        setTimeout(() => window.location.href = 'login.html', 1500);
    }).catch((error) => {
        showNotification('Logout failed: ' + error.message, 'error');
    });
});

export async function loadProfile() {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = dbRef(database, 'users/' + user.uid);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
        const data = snapshot.val();
        document.getElementById("profileName").innerText = data.name || "N/A";
        document.getElementById("profileEmail").innerText = data.email || "N/A";
        document.getElementById("profileJoined").innerText = "Joined: " + (data.joined || "N/A");
        document.getElementById("profileLocation").innerText = "Location: " + (data.location || "N/A");
        document.getElementById("profilePhone").innerText = "Phone: " + (data.number || "N/A");
    }
}

window.toggleEdit = function () {
    const form = document.getElementById("editForm");
    form.style.display = form.style.display === "none" ? "block" : "none";
};

document.getElementById("editForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;

    const updates = {
        name: document.getElementById("nameInput").value,
        email: document.getElementById("emailInput").value,
        number: document.getElementById("phoneInput").value
    };

    await update(dbRef(database, 'users/' + user.uid), updates);
    showNotification("Profile updated!");
    loadProfile();

    const form = document.getElementById("editForm");
    form.style.display = "none";
});


window.changeProfilePicture = function () {
    document.getElementById("imgUpload").click();
};

document.getElementById("imgUpload")?.addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        document.getElementById("profileImg").src = e.target.result;
        showNotification("Profile picture updated (local only)!");
    };
    reader.readAsDataURL(file);
});

export async function addToCart(product) {
    const user = auth.currentUser;
    if (!user) return;

    const cartRef = dbRef(database, `carts/${user.uid}`);
    await push(cartRef, product);
    showNotification("Item added to cart!");
}


export async function loadCartItems(callback) {
    const user = auth.currentUser;
    if (!user) return;

    const cartRef = dbRef(database, `carts/${user.uid}`);
    const snapshot = await get(cartRef);
    if (snapshot.exists()) {
        const items = snapshot.val();
        callback(items);
    } else {
        callback({});
    }
}

export async function completePurchase() {
    const user = auth.currentUser;
    if (!user) return;

    const cartRef = dbRef(database, `carts/${user.uid}`);
    const purchaseRef = dbRef(database, `purchases/${user.uid}`);

    const snapshot = await get(cartRef);
    if (snapshot.exists()) {
        const items = snapshot.val();
        await set(purchaseRef, items);
        await set(cartRef, {});
        showNotification("Purchase completed!");
    }
}
