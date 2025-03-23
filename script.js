import { auth, database } from "./firebase-config.mjs";
import {
    ref,
    set,
    get,
    child,
    update,
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";

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

// ✅ Register Form Submission
document.getElementById('registerForm')?.addEventListener('submit', function (e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            // Save user data to database
            set(ref(database, 'users/' + user.uid), {
                name: name,
                email: email,
                joined: new Date().toLocaleDateString(),
                location: 'Unknown', // Default value
            });

            showNotification('Account created successfully! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 1500);
        })
        .catch((error) => {
            showNotification(error.message, 'error');
        });
});

// ✅ Login Form Submission
document.getElementById('loginForm')?.addEventListener('submit', function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            showNotification('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 1500);
        })
        .catch((error) => {
            showNotification('Login failed: ' + error.message, 'error');
        });
});

// ✅ Logout Function
function logout() {
    signOut(auth)
        .then(() => {
            showNotification('Logout successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        })
        .catch((error) => {
            showNotification('Error during logout: ' + error.message, 'error');
        });
}

// ✅ Load Cart Count on Page Load
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    attachAddToCartEvents(); // Attach event listeners after DOM load
});

// ✅ Attach Click Event to Add-to-Cart Buttons
function attachAddToCartEvents() {
    document.querySelectorAll('.btn.add-to-cart').forEach((button) => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const name = button.getAttribute('data-name');
            const price = parseFloat(button.getAttribute('data-price'));
            const qtyId = button.getAttribute('data-qty');
            addToCart(name, price, qtyId);
        });
    });
}

// ✅ Add Product to Cart
function addToCart(name, price, qtyId) {
    const quantity = parseInt(document.getElementById(qtyId).value);

    if (quantity > 0) {
        // Get product card dynamically
        const productCard = document.querySelector(`[data-name="${name}"]`).closest('.product-card');
        const imageSrc = productCard.querySelector('img').src;

        // Create cart item object
        const cartItem = {
            name: name,
            price: price,
            quantity: quantity,
            image: imageSrc, // Add image to cart
        };

        let cart = JSON.parse(localStorage.getItem('cart')) || [];

        // Check if the product is already in the cart and update quantity
        const existingItem = cart.find((item) => item.name === name);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push(cartItem);
        }

        localStorage.setItem('cart', JSON.stringify(cart));

        showNotification(`${name} added to cart!`, 'success');
        updateCartCount();
    } else {
        showNotification('Please enter a valid quantity.', 'error');
    }
}

// ✅ Update Cart Count on the Cart Icon
function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    document.getElementById('cartCount').innerText = cartCount;
}

// ✅ Search by Name
function filterProducts() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const productCards = document.querySelectorAll('.product-card');

    productCards.forEach((card) => {
        const productName = card.querySelector('h3').innerText.toLowerCase();

        if (productName.includes(searchInput)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// ✅ Filter by Category
function filterCategory(category) {
    const productCards = document.querySelectorAll('.product-card');

    productCards.forEach((card) => {
        const cardCategory = card.getAttribute('data-category');
        if (category === 'all' || category === cardCategory) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}
