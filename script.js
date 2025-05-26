import { auth, database } from "./firebase-config.mjs";
import {
    ref,
    set,
    get,
    child,
    update,
    push
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";

// Notification function
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

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
    auth.onAuthStateChanged((user) => {
        if (user) {
            updateCartCount();
            attachAllEvents();
            // Initialize local storage cart if it doesn't exist
            if (!localStorage.getItem("cartImages")) {
                localStorage.setItem("cartImages", JSON.stringify({}));
            }
        } else {
            document.getElementById("cartCount").innerText = "0";
        }
    });
});

// Attach all event listeners
function attachAllEvents() {
    attachAddToCartEvents();
    attachQtyButtonEvents();
    attachFilterEvents();
}

function attachAddToCartEvents() {
    document.querySelectorAll(".btn.add-to-cart").forEach((button) => {
        button.removeEventListener("click", handleAddToCart);
        button.addEventListener("click", handleAddToCart);
    });
}

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

function attachFilterEvents() {
    document.getElementById("searchInput").addEventListener("keyup", filterProducts);
    document.querySelectorAll(".filter-btn").forEach((button) => {
        button.removeEventListener("click", handleFilterCategory);
        button.addEventListener("click", handleFilterCategory);
    });
}

// Custom confirmation modal
function handleAddToCart(e) {
    e.preventDefault();
    const button = e.target;
    const productCard = button.closest(".product-card");
    const productName = productCard.querySelector("h3").innerText;
    const quantitySpan = productCard.querySelector(".quantity");
    const quantity = parseInt(quantitySpan.innerText);
    const priceText = productCard.querySelector("p").innerText;
    const price = parseFloat(priceText.replace('₱', ''));
    
    showCustomConfirmation(
        `Add to Cart`,
        `Add ${quantity} ${productName}(s) to your cart?<br>Total: ₱${(price * quantity).toFixed(2)}`,
        () => {
            addToCart(button);
        }
    );
}

function showCustomConfirmation(title, message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'confirmation-overlay';
    overlay.innerHTML = `
        <div class="confirmation-modal">
            <h3>${title}</h3>
            <p>${message}</p>
            <div class="confirmation-buttons">
                <button class="btn-confirm">Yes, Add to Cart</button>
                <button class="btn-cancel">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    overlay.querySelector('.btn-confirm').addEventListener('click', () => {
        onConfirm();
        document.body.removeChild(overlay);
    });
    
    overlay.querySelector('.btn-cancel').addEventListener('click', () => {
        document.body.removeChild(overlay);
    });
    
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    });
}

// Quantity handlers
function handleIncrease(e) {
    const button = e.target;
    const quantitySpan = button.parentElement.querySelector(".quantity");
    let quantity = parseInt(quantitySpan.innerText);
    quantity++;
    quantitySpan.innerText = quantity;
}

function handleDecrease(e) {
    const button = e.target;
    const quantitySpan = button.parentElement.querySelector(".quantity");
    let quantity = parseInt(quantitySpan.innerText);
    if (quantity > 1) {
        quantity--;
        quantitySpan.innerText = quantity;
    }
}

// Filter functions
function handleFilterCategory(e) {
    const category = e.target.getAttribute("data-category");
    filterCategory(category);
}

function filterProducts() {
    const searchInput = document.getElementById("searchInput").value.toLowerCase().trim();
    const productCards = document.querySelectorAll(".product-card");

    productCards.forEach((card) => {
        const productName = card.querySelector("h3").innerText.toLowerCase();
        if (productName.includes(searchInput)) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
}

function filterCategory(category) {
    document.getElementById("searchInput").value = "";
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

// Firebase cart functions
async function addToCart(button) {
    const user = auth.currentUser;
    if (!user) {
        showNotification("Please login to add items to cart", "error");
        return;
    }

    const productCard = button.closest(".product-card");
    const name = productCard.querySelector("h3").innerText;
    const priceText = productCard.querySelector("p").innerText;
    const price = parseFloat(priceText.replace('₱', ''));
    const quantitySpan = productCard.querySelector(".quantity");
    const quantity = parseInt(quantitySpan.innerText);
    const imageSrc = productCard.querySelector("img")?.src || "";

    if (quantity <= 0) {
        showNotification("Please select a valid quantity.", "error");
        return;
    }

    try {
        // Store image in localStorage
        const cartImages = JSON.parse(localStorage.getItem("cartImages")) || {};
        cartImages[name] = imageSrc;
        localStorage.setItem("cartImages", JSON.stringify(cartImages));

        // Update Firebase cart
        const userCartRef = ref(database, `users/${user.uid}/cart`);
        const snapshot = await get(userCartRef);
        let cartItems = [];
        
        if (snapshot.exists()) {
            cartItems = Object.values(snapshot.val());
        }

        const existingItemIndex = cartItems.findIndex(item => item.name === name);
        
        if (existingItemIndex !== -1) {
            // Update quantity if item exists
            const updates = {};
            updates[`users/${user.uid}/cart/${Object.keys(snapshot.val())[existingItemIndex]}/quantity`] = 
                cartItems[existingItemIndex].quantity + quantity;
            
            await update(ref(database), updates);
        } else {
            // Add new item if it doesn't exist
            const newItemRef = push(userCartRef);
            await set(newItemRef, {
                name: name,
                price: price,
                quantity: quantity
            });
        }

        showNotification(`${name} added to cart!`, "success");
        await updateCartCount();
    } catch (error) {
        console.error("Error adding to cart:", error);
        showNotification("Failed to add item to cart", "error");
    }
}

async function updateCartCount() {
    const user = auth.currentUser;
    if (!user) {
        document.getElementById("cartCount").innerText = "0";
        return;
    }

    try {
        const userCartRef = ref(database, `users/${user.uid}/cart`);
        const snapshot = await get(userCartRef);
        
        let totalItems = 0;
        if (snapshot.exists()) {
            const cartItems = Object.values(snapshot.val());
            totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
        }
        
        document.getElementById("cartCount").innerText = totalItems;
    } catch (error) {
        console.error("Error updating cart count:", error);
        document.getElementById("cartCount").innerText = "0";
    }
}