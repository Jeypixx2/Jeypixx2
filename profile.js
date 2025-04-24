import { auth, database } from "./firebase-config.mjs";
import {
    onAuthStateChanged,
    signOut,
    updateEmail,
    reauthenticateWithCredential, 
    EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import {
    ref,
    get,
    update,
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";


window.changeProfilePicture = changeProfilePicture;
window.toggleEdit = toggleEdit;
window.logoutUser = logoutUser;
window.saveProfile = saveProfile;



onAuthStateChanged(auth, (user) => {
    if (user) {
        const userId = user.uid;
        console.log("✅ User authenticated with UID:", userId);

       
        loadProfileFromFirebase(userId);
        loadProfile(); 
        loadPurchaseHistory(userId); 
    } else {
        window.location.href = "login.html";
    }
});


function loadProfileFromFirebase(userId) {
    showLoading(true); 
    const userRef = ref(database, "users/" + userId);
    get(userRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                console.log("✅ Loaded profile data:", data);

                document.getElementById("profileName").innerText = data.name || "Unknown";
                document.getElementById("profileEmail").innerText = data.email || "Unknown";
                document.getElementById("profileDate").innerText = `Joined: ${data.joined || "N/A"}`;
                document.getElementById("profileLocation").innerText = `Location: ${data.location || "Not set"}`;
                document.getElementById("profilePhone").innerText = `Phone: ${data.number || "Not provided"}`;

            
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
            showLoading(false);
        });
}





function loadPurchaseHistory(userId) {
    const purchaseRef = ref(database, "users/" + userId + "/purchases");

    get(purchaseRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                const purchases = snapshot.val();
                console.log("✅ Loaded purchase history:", purchases);


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


function displayPurchaseHistory(purchases) {
    const productGrid = document.getElementById("productGrid");
    productGrid.innerHTML = ""; 

    Object.keys(purchases).forEach((purchaseId) => {
        const purchase = purchases[purchaseId];


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

        productGrid.innerHTML += purchaseCard;
    });
}


async function saveProfile() {
    const user = auth.currentUser;
    if (!user) {
        console.error("❌ No authenticated user found! Try again.");
        showNotification("❌ Authentication error. Please refresh the page.", "error");
        return;
    }

    const userId = user.uid;
    const userRef = ref(database, "users/" + userId);

    const nameInput = document.getElementById("nameInput").value;
    const emailInput = document.getElementById("emailInput").value;
    const phoneInput = document.getElementById("phoneInput").value;
    const dateInput = document.getElementById("dateInput").value;

    try {
        await update(userRef, {
            name: nameInput,
            number: phoneInput,
            joined: dateInput,
        });

        if (emailInput !== user.email) {
            await updateUserEmail(user, emailInput);
            await update(userRef, { email: emailInput });
        }

        showNotification("✅ Profile updated successfully!", "success");
        await loadProfileFromFirebase(userId);
        location.reload();
        toggleEdit();
    } catch (error) {
        console.error("❌ Error updating profile:", error);
        showNotification("❌ Error updating profile: " + error.message, "error");
    }
}


async function updateUserEmail(user, newEmail) {
    const password = prompt("Please enter your password to update email:");
    if (!password) {
        showNotification("❌ Email update canceled.", "error");
        return;
    }

    const credential = EmailAuthProvider.credential(user.email, password);
    try {
        await reauthenticateWithCredential(user, credential);
        await updateEmail(user, newEmail);
        console.log("✅ Email updated successfully.");
    } catch (error) {
        console.error("❌ Email update failed:", error);
        showNotification("❌ Email update failed: " + error.message, "error");
    }
}


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

function loadProfile() {
    const imgSrc = localStorage.getItem("profileImg") || "images/profile-icon.jpg";
    document.getElementById("profileImg").src = imgSrc;
}


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
                localStorage.setItem("profileImg", newImgSrc); 
            };
            reader.readAsDataURL(file);
        }
    };
}


function showLoading(show) {
    document.getElementById("loading").style.display = show ? "block" : "none";
}

function showNotification(message, type) {
    const notification = document.getElementById("notification");
    notification.innerText = message;
    notification.className = `notification ${type}`;
    notification.style.display = "block";

    setTimeout(() => {
        notification.style.display = "none";
    }, 3000);
}


function logoutUser() {
    signOut(auth)
        .then(() => {
            showNotification("✅ Logout successful!", "success");
            window.location.href = "login.html";
        })
        .catch((error) => {
            showNotification("❌ Logout failed: " + error.message, "error");
        });
}

document.getElementById("logoutButton")?.addEventListener("click", () => {
    logoutUser();
});
