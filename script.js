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

        // Hide notification after 3 seconds
        setTimeout(() => {
            notification.style.display = "none";
        }, 3000);
    }
}

// ✅ Attach Events on Page Load
document.addEventListener("DOMContentLoaded", () => {
    updateCartCount(); // Initial cart count
    attachAllEvents(); // Attach all button events
});

// ✅ Attach Events to Buttons
function attachAllEvents() {
    attachAddToCartEvents();
    attachQtyButtonEvents();
    attachFilterEvents();
}

// ✅ Attach Events to Add-to-Cart Buttons
function attachAddToCartEvents() {
    document.querySelectorAll(".btn.add-to-cart").forEach((button) => {
        button.removeEventListener("click", handleAddToCart);
        button.addEventListener("click", handleAddToCart);
    });
}

// ✅ Attach Events to Quantity Buttons (+ and -)
function attachQtyButtonEvents() {
    document.querySelectorAll(".qty-btn.plus").forEach((button) => {
        button.removeEventListener("click", handleIncrease);
        button.addEventListener("click", handleIncrease);
    });

    document.querySelectorAll(".qty-btn.minus").forEach((button) => {
        button.removeEventListener("click", handleDecrease);
        button.addEventListener("click", handleDecrease);
    });
}

// ✅ Attach Events for Category Filter and Search
function attachFilterEvents() {
    document.getElementById("searchInput").addEventListener("keyup", filterProducts);

    document.querySelectorAll(".filter-btn").forEach((button) => {
        button.removeEventListener("click", handleFilterCategory);
        button.addEventListener("click", handleFilterCategory);
    });
}

// ✅ Add to Cart Handler
function handleAddToCart(e) {
    e.preventDefault();
    const button = e.target;
    addToCart(button);
}

// ✅ Increase Quantity Handler
function handleIncrease(e) {
    const button = e.target;
    const quantitySpan = button.parentElement.querySelector(".quantity");
    let quantity = parseInt(quantitySpan.innerText);
    quantity++;
    quantitySpan.innerText = quantity;
}

// ✅ Decrease Quantity Handler
function handleDecrease(e) {
    const button = e.target;
    const quantitySpan = button.parentElement.querySelector(".quantity");
    let quantity = parseInt(quantitySpan.innerText);
    if (quantity > 1) {
        quantity--;
        quantitySpan.innerText = quantity;
    }
}

// ✅ Filter Category Handler
function handleFilterCategory(e) {
    const category = e.target.getAttribute("data-category");
    filterCategory(category);
}

// ✅ Add to Cart Function
function addToCart(button) {
    const productCard = button.closest(".product-card");
    const name = button.getAttribute("data-name");
    const price = parseFloat(button.getAttribute("data-price"));
    const quantitySpan = productCard.querySelector(".quantity");
    const quantity = parseInt(quantitySpan.innerText);

    if (quantity > 0) {
        // Get product image if available
        const imageSrc = productCard.querySelector("img")?.src || "";

        // Create cart item object
        const cartItem = {
            name: name,
            price: price,
            quantity: quantity,
            image: imageSrc,
        };

        let cart = JSON.parse(localStorage.getItem("cart")) || [];

        // Check if product already exists in the cart and update quantity
        const existingItem = cart.find((item) => item.name === name);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push(cartItem);
        }

        localStorage.setItem("cart", JSON.stringify(cart));
        showNotification(`${name} added to cart!`, "success");
        updateCartCount(); // ✅ Update cart count correctly
    } else {
        showNotification("Please select a valid quantity.", "error");
    }
}

// ✅ Update Cart Count on the Cart Icon
function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    document.getElementById("cartCount").innerText = cartCount;
}

// ✅ Search by Name (Filter Products)
function filterProducts() {
    const searchInput = document.getElementById("searchInput").value.toLowerCase().trim();
    const productCards = document.querySelectorAll(".product-card");

    productCards.forEach((card) => {
        const productName = card.querySelector("h3").innerText.toLowerCase();

        // Show or hide based on search input match
        if (productName.includes(searchInput)) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
}

// ✅ Filter by Category (Resets Search Bar)
function filterCategory(category) {
    document.getElementById("searchInput").value = ""; // Clear search input
    const productCards = document.querySelectorAll(".product-card");

    productCards.forEach((card) => {
        const cardCategory = card.getAttribute("data-category");
        if (category === "all" || category === cardCategory) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
}
