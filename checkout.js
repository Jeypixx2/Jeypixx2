import { auth, database } from "./firebase-config.mjs";
import { ref, set, push, get } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";

function loadOrderSummaryAndProfile() {
    // Safely parse order summary with fallback
    let orderSummary;
    try {
        orderSummary = JSON.parse(localStorage.getItem('orderSummary')) || {};
    } catch (e) {
        console.error("Error parsing order summary:", e);
        orderSummary = {};
    }

    // Validate order summary exists
    if (!orderSummary || Object.keys(orderSummary).length === 0) {
        alert('No order summary found! Returning to cart.');
        window.location.href = 'cart.html';
        return;
    }

    // Safely display order summary with fallback values
    document.getElementById('orderTotal').innerText = 
        (orderSummary.totalAmount || orderSummary.total || 0).toFixed(2);
    document.getElementById('orderDeliveryOption').innerText = 
        orderSummary.deliveryOption || 'Not specified';
    document.getElementById('orderLocation').innerText = 
        orderSummary.location || 'Not specified';
    document.getElementById('orderDeliveryFee').innerText = 
        (orderSummary.deliveryFee || 0).toFixed(2);

    // Load user profile
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const userRef = ref(database, "users/" + user.uid);
            get(userRef)
                .then((snapshot) => {
                    if (snapshot.exists()) {
                        const data = snapshot.val();
                        document.getElementById('fullName').innerText = 
                            data.name || "Unknown";
                        document.getElementById('email').innerText = 
                            data.email || "No email provided";
                        document.getElementById('phone').innerText = 
                            data.number || "No phone number";
                    } else {
                        console.log("No profile data found");
                        showNotification("Please complete your profile", "warning");
                    }
                })
                .catch((error) => {
                    console.error("Error loading profile:", error);
                    showNotification("Error loading profile", "error");
                });
        } else {
            alert('Please log in to complete your order.');
            window.location.href = 'login.html';
        }
    });
}

function completeOrder() {
    const fullName = document.getElementById('fullName').innerText.trim();
    if (!fullName || fullName === "Unknown") {
        alert('Please update your profile with your full name');
        window.location.href = 'profile.html';
        return;
    }

    // Safely get order summary
    let orderSummary;
    try {
        orderSummary = JSON.parse(localStorage.getItem('orderSummary')) || {};
    } catch (e) {
        console.error("Error parsing order summary:", e);
        orderSummary = {};
    }

    // Validate required fields
    if (!orderSummary.items || orderSummary.items.length === 0) {
        alert('Your order appears to be empty. Please try again.');
        window.location.href = 'cart.html';
        return;
    }

    // Prepare order data with proper fallbacks
    const orderData = {
        orderDate: new Date().toISOString(),
        totalAmount: parseFloat(orderSummary.totalAmount || orderSummary.total || 0).toFixed(2),
        deliveryOption: orderSummary.deliveryOption || 'pickup',
        location: orderSummary.location || 'Store pickup',
        deliveryFee: parseFloat(orderSummary.deliveryFee || 0).toFixed(2),
        items: orderSummary.items.map(item => ({
            name: item.name || 'Unknown product',
            price: parseFloat(item.price || 0).toFixed(2),
            quantity: parseInt(item.quantity || 1)
        })),
        customer: {
            name: fullName,
            email: document.getElementById('email').innerText.trim(),
            phone: document.getElementById('phone').innerText.trim()
        }
    };

    // Save order
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const purchasesRef = ref(database, `users/${user.uid}/purchases`);
            push(purchasesRef, orderData)
                .then(() => {
                    // Clear cart and order data
                    localStorage.removeItem('cart');
                    localStorage.removeItem('orderSummary');
                    
                    // Show success message
                    document.querySelector('.checkout-section').style.display = 'none';
                    document.getElementById('successMessage').style.display = 'block';
                    
                    // Redirect after delay
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 3000);
                })
                .catch((error) => {
                    console.error("Error saving order:", error);
                    showNotification("Failed to save order. Please try again.", "error");
                });
        } else {
            alert('Session expired. Please log in again.');
            window.location.href = 'login.html';
        }
    });
}

// Helper function for notifications
function showNotification(message, type = "success") {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    loadOrderSummaryAndProfile();
    document.getElementById('confirmOrderBtn').addEventListener('click', completeOrder);
});