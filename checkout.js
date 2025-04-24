import { auth, database } from "./firebase-config.mjs";
import { ref, set, push, get } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";


function loadOrderSummaryAndProfile() {
    const orderSummary = JSON.parse(localStorage.getItem('orderSummary'));

    if (!orderSummary) {
        alert('No order summary found! Returning to cart.');
        window.location.href = 'cart.html';
        return;
    }


    document.getElementById('orderTotal').innerText = orderSummary.totalAmount.toFixed(2);
    document.getElementById('orderDeliveryOption').innerText = orderSummary.deliveryOption;
    document.getElementById('orderLocation').innerText = orderSummary.location;
    document.getElementById('orderDeliveryFee').innerText = orderSummary.deliveryFee.toFixed(2);


    onAuthStateChanged(auth, (user) => {
        if (user) {
            const userRef = ref(database, "users/" + user.uid);
            get(userRef)
                .then((snapshot) => {
                    if (snapshot.exists()) {
                        const data = snapshot.val();
                       
                        document.getElementById('fullName').innerText = data.name || "Unknown";
                        document.getElementById('email').innerText = data.email || "No email provided";
                        document.getElementById('phone').innerText = data.number || "No phone number";
                    } else {
                        console.log("⚠️ No profile data found. Please check your profile.");
                    }
                })
                .catch((error) => {
                    console.error("❌ Error loading profile:", error);
                });
        } else {
            alert('Please log in to complete your order.');
            window.location.href = 'login.html';
        }
    });
}


function completeOrder() {
    const fullName = document.getElementById('fullName').innerText.trim();
    const email = document.getElementById('email').innerText.trim();
    const phone = document.getElementById('phone').innerText.trim();

    if (!fullName || fullName === "Unknown") {
        alert('⚠️ User details are missing. Please update your profile.');
        return;
    }

    
    const orderSummary = JSON.parse(localStorage.getItem('orderSummary'));
    const cart = JSON.parse(localStorage.getItem('cart')) || [];

    if (cart.length === 0) {
        alert('🛒 Your cart is empty. Please add some items.');
        window.location.href = 'index.html';
        return;
    }

  
    const orderData = {
        orderDate: new Date().toLocaleString(),
        totalAmount: orderSummary.totalAmount.toFixed(2),
        deliveryOption: orderSummary.deliveryOption,
        location: orderSummary.location,
        deliveryFee: orderSummary.deliveryFee.toFixed(2),
        items: cart.map((item) => ({
            name: item.name,
            price: item.price.toFixed(2),
            quantity: item.quantity,
        })),
    };

    onAuthStateChanged(auth, (user) => {
        if (user) {
            const purchasesRef = ref(database, `users/${user.uid}/purchases`);
            push(purchasesRef, orderData)
                .then(() => {
                    console.log("✅ Order saved successfully!");
              
                    document.querySelector('.checkout-section').style.display = 'none';
                    document.getElementById('successMessage').style.display = 'block';

                    
                    localStorage.removeItem('cart');
                    localStorage.removeItem('orderSummary');

                   
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 3000);
                })
                .catch((error) => {
                    console.error("❌ Error saving order:", error);
                    alert('❌ Error placing order. Please try again.');
                });
        } else {
            alert('⚠️ Please log in to complete your order.');
            window.location.href = 'login.html';
        }
    });
}


document.addEventListener('DOMContentLoaded', loadOrderSummaryAndProfile);


document.getElementById('confirmOrderBtn').addEventListener('click', completeOrder);
