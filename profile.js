// ✅ Import Firebase modules
import { auth, database } from "./firebase-config.mjs";
import {
    onAuthStateChanged,
    signOut,
    updateEmail,
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import {
    ref,
    get,
    update,
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";

// ✅ Global functions to enable button actions
window.changeProfilePicture = changeProfilePicture;
window.toggleEdit = toggleEdit;
window.logoutUser = logoutUser;

// ✅ Check if user is logged in and load profile data
onAuthStateChanged(auth, (user) => {
    if (user) {
        const userId = user.uid;
        console.log("✅ User authenticated with UID:", userId);

        // ✅ Load Profile and Purchase History
        loadProfileFromFirebase(userId);
        loadProfile(); // Load profile picture
        loadPurchaseHistory(userId); // Load purchase history
    } else {
        window.location.href = "login.html"; // Redirect to login if not authenticated
    }
});

// ✅ Load user profile from Firebase
function loadProfileFromFirebase(userId) {
    showLoading(true); // Show loading spinner

    const userRef = ref(database, "users/" + userId);
    get(userRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();

                console.log("✅ Loaded profile data:", data);

                // ✅ Display profile info
                document.getElementById("profileName").innerText = data.name || "Unknown";
                document.getElementById("profileEmail").innerText = data.email || "Unknown";
                document.getElementById("profileDate").innerText = `Joined: ${data.joined || "N/A"}`;
                document.getElementById("profileLocation").innerText = `Location: ${data.location || "Not set"}`;
                document.getElementById("profilePhone").innerText = `Phone: ${data.number || "Not provided"}`;

                // ✅ Set values in the edit form
                document.getElementById("nameInput").value = data.name || "";
                document.getElementById("emailInput").value = data.email || "";
                document.getElementById("phoneInput").value = data.number || "";
                document.getElementById("dateInput").value = data.joined || "";
            } else {
                console.log("❌ No data available for this user.");
            }
        })
        .catch((error) => {
            console.error("❌ Error loading profile data:", error);
        })
        .finally(() => {
            showLoading(false); // Hide loading spinner
        });
}

// ✅ Load and Display Purchase History
function loadPurchaseHistory(userId) {
    const purchaseRef = ref(database, "users/" + userId + "/purchases");

    get(purchaseRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                const purchases = snapshot.val();
                console.log("✅ Loaded purchase history:", purchases);

                // ✅ Display Purchase History
                displayPurchaseHistory(purchases);
            } else {
                document.getElementById("productGrid").innerHTML =
                    "<p>No purchase history found.</p>";
            }
        })
        .catch((error) => {
            console.error("❌ Error loading purchase history:", error);
        });
}

// ✅ Display Purchase History in Product Grid
function displayPurchaseHistory(purchases) {
    const productGrid = document.getElementById("productGrid");
    productGrid.innerHTML = ""; // Clear previous data

    Object.keys(purchases).forEach((purchaseId) => {
        const purchase = purchases[purchaseId];

        // ✅ Create a Purchase Card
        const purchaseCard = `
            <div class="product-card">
                <h3>Order Date: ${purchase.orderDate}</h3>
                <p><strong>Total Amount:</strong> ₱${purchase.totalAmount}</p>
                <p><strong>Delivery Option:</strong> ${purchase.deliveryOption}</p>
                <p><strong>Location:</strong> ${purchase.location}</p>
                <p><strong>Delivery Fee:</strong> ₱${purchase.deliveryFee}</p>
                <h4>Items:</h4>
                <ul>
                    ${purchase.items
                        .map(
                            (item) => `
                        <li>
                            ${item.name} - ₱${item.price} x ${item.quantity}
                        </li>
                    `
                        )
                        .join("")}
                </ul>
            </div>
        `;

        // ✅ Add to the grid
        productGrid.innerHTML += purchaseCard;
    });
}

// ✅ Save Profile Changes
async function saveProfile() {
    const nameInput = document.getElementById("nameInput").value;
    const emailInput = document.getElementById("emailInput").value;
    const phoneInput = document.getElementById("phoneInput").value;
    const dateInput = document.getElementById("dateInput").value;
    const user = auth.currentUser;

    if (user) {
        const userId = user.uid;
        const userRef = ref(database, "users/" + userId);

        try {
            // ✅ Update name, phone, and joined date
            await update(userRef, {
                name: nameInput,
                number: phoneInput,
                joined: dateInput,
            });
            showNotification("✅ Profile updated successfully!", "success");

            // ✅ Check if email is different before updating
            if (emailInput !== user.email) {
                await updateEmail(user, emailInput);
                await update(userRef, { email: emailInput });
                showNotification("✅ Email updated successfully!", "success");
            }

            // ✅ Reload profile after updating
            loadProfileFromFirebase(userId);
            toggleEdit();
        } catch (error) {
            showNotification("❌ Error updating profile: " + error.message, "error");
        }
    }
}

// ✅ Toggle Edit Form
function toggleEdit() {
    const editForm = document.getElementById("editForm");
    const editBtn = document.getElementById("editBtn");

    if (editForm.style.display === "none" || editForm.style.display === "") {
        editForm.style.display = "block";
        editBtn.innerText = "Cancel";
    } else {
        editForm.style.display = "none";
        editBtn.innerText = "Edit Profile";
    }
}

// ✅ Load Profile Picture from Local Storage
function loadProfile() {
    const imgSrc = localStorage.getItem("profileImg") || "images/profile-icon.jpg";
    document.getElementById("profileImg").src = imgSrc;
}

// ✅ Change Profile Picture
function changeProfilePicture() {
    const imgUpload = document.getElementById("imgUpload");
    imgUpload.click();

    imgUpload.onchange = function () {
        const file = imgUpload.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const newImgSrc = e.target.result;
                document.getElementById("profileImg").src = newImgSrc;
                localStorage.setItem("profileImg", newImgSrc); // ✅ Save image to localStorage
            };
            reader.readAsDataURL(file);
        }
    };
}

// ✅ Show Loading Spinner
function showLoading(show) {
    document.getElementById("loading").style.display = show ? "block" : "none";
}

// ✅ Show Notification
function showNotification(message, type) {
    const notification = document.getElementById("notification");
    notification.innerText = message;
    notification.className = `notification ${type}`;
    notification.style.display = "block";

    setTimeout(() => {
        notification.style.display = "none";
    }, 3000);
}

// ✅ Logout User
function logoutUser() {
    signOut(auth)
        .then(() => {
            showNotification("✅ Logout successful!", "success");
            window.location.href = "login.html"; // ✅ Redirect to login page
        })
        .catch((error) => {
            showNotification("❌ Logout failed: " + error.message, "error");
        });
}

document.getElementById("logoutButton")?.addEventListener("click", () => {
    logoutUser();
});
