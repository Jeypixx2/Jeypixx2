import { auth, database } from "./firebase-config.mjs";
import {
    ref,
    get,
    update,
    remove,
    push,
    set,
    onValue
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";

// Initialize cart when page loads
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log("User authenticated:", user.uid);
            setupCartListener(user.uid);
            updateCartCount(user.uid);
            
            // Initialize delivery options
            setupDeliveryOptions();
        } else {
            console.log("No user, redirecting to login");
            window.location.href = "login.html";
        }
    });
});

function setupCartListener(userId) {
    const userCartRef = ref(database, `users/${userId}/cart`);
    
    onValue(userCartRef, (snapshot) => {
        console.log("Cart data update received");
        displayCartItems(snapshot);
    }, {
        onlyOnce: false // Keep listening for changes
    });
}

function setupDeliveryOptions() {
    // Set up event listeners for delivery options
    document.querySelectorAll('input[name="deliveryOption"]').forEach(option => {
        option.addEventListener('change', updateDeliveryFee);
    });

    document.getElementById('location').addEventListener('input', updateDeliveryFee);
}

async function displayCartItems(snapshot) {
    const cartItemsContainer = document.getElementById('cartItems');
    const emptyCartMessage = document.getElementById('emptyCart');
    const cartSummary = document.getElementById('cartSummary');

    cartItemsContainer.innerHTML = '';

    if (!snapshot.exists()) {
        console.log("Cart is empty");
        emptyCartMessage.style.display = 'block';
        cartSummary.style.display = 'none';
        return;
    }

    const cartData = snapshot.val();
    console.log("Cart data:", cartData);

    // Get cart images from localStorage
    const cartImages = JSON.parse(localStorage.getItem('cartImages')) || {};

    emptyCartMessage.style.display = 'none';
    cartSummary.style.display = 'block';

    try {
        // Convert Firebase object to array
        const cartItems = Object.keys(cartData).map(key => ({
            id: key,
            ...cartData[key]
        }));

        // Display each item
        cartItems.forEach(item => {
            const imageSrc = cartImages[item.name] || 'images/default-product.png';
            
            cartItemsContainer.innerHTML += `
                <div class="cart-item" data-item-id="${item.id}">
                    <img src="${imageSrc}" alt="${item.name}" class="cart-item-img">
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <p>₱${item.price.toFixed(2)}</p>
                        <input type="number" min="1" value="${item.quantity}" 
                            onchange="updateQuantity('${item.id}', this.value)" class="cart-qty">
                        <button class="remove-btn" onclick="removeFromCart('${item.id}')">Remove</button>
                    </div>
                </div>
            `;
        });

        updateCartTotal(cartItems);
    } catch (error) {
        console.error("Error displaying cart:", error);
        showNotification("Error loading cart items", "error");
        emptyCartMessage.style.display = 'block';
        cartSummary.style.display = 'none';
    }
}

function updateCartTotal(cartItems) {
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('cartTotal').innerText = `₱${total.toFixed(2)}`;
}

async function updateCartCount(userId) {
    try {
        const userCartRef = ref(database, `users/${userId}/cart`);
        const snapshot = await get(userCartRef);
        
        const count = snapshot.exists() 
            ? Object.values(snapshot.val()).reduce((sum, item) => sum + item.quantity, 0)
            : 0;
            
        document.getElementById('cartCount').innerText = count;
    } catch (error) {
        console.error("Error updating cart count:", error);
        document.getElementById('cartCount').innerText = '0';
    }
}

// Delivery functions
function getDeliveryData() {
    const deliveryOption = document.querySelector('input[name="deliveryOption"]:checked').value;
    const location = deliveryOption === 'delivery' ? document.getElementById('location').value.trim() : 'Store Pickup';
    const deliveryFee = updateDeliveryFee();

    return {
        deliveryOption,
        location,
        deliveryFee
    };
}

function toggleLocation(show) {
    const locationSection = document.getElementById('locationSection');
    locationSection.style.display = show ? 'block' : 'none';
    updateDeliveryFee();
}

function updateDeliveryFee() {
    const deliveryOption = document.querySelector('input[name="deliveryOption"]:checked').value;
    const location = document.getElementById('location').value.trim();

    const deliveryRates = {
        'Naga City': 30,
        'Pili': 50,
        'Iriga': 70,
        'Others': 100
    };

    let deliveryFee = 0;
    if (deliveryOption === 'delivery' && location) {
        deliveryFee = deliveryRates[location] || deliveryRates['Others'];
    }

    document.getElementById('deliveryFee').innerText = `Delivery Fee: ₱${deliveryFee.toFixed(2)}`;
    return deliveryFee;
}

// Cart operations
async function updateQuantity(itemId, quantity) {
    const user = auth.currentUser;
    if (!user) return;

    quantity = parseInt(quantity);
    if (quantity <= 0) {
        await removeFromCart(itemId);
        return;
    }

    try {
        const updates = {};
        updates[`users/${user.uid}/cart/${itemId}/quantity`] = quantity;
        await update(ref(database), updates);
    } catch (error) {
        console.error("Error updating quantity:", error);
        showNotification("Failed to update quantity", "error");
    }
}

async function removeFromCart(itemId) {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const itemRef = ref(database, `users/${user.uid}/cart/${itemId}`);
        await remove(itemRef);
        
        // Remove image from localStorage if it exists
        const cartImages = JSON.parse(localStorage.getItem('cartImages')) || {};
        const snapshot = await get(itemRef);
        if (snapshot.exists()) {
            const item = snapshot.val();
            delete cartImages[item.name];
            localStorage.setItem('cartImages', JSON.stringify(cartImages));
        }
    } catch (error) {
        console.error("Error removing item:", error);
        showNotification("Failed to remove item", "error");
    }
}

async function clearCart() {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const userCartRef = ref(database, `users/${user.uid}/cart`);
        await remove(userCartRef);
        
        localStorage.removeItem('cartImages');
        showNotification('Cart has been cleared!', 'success');
    } catch (error) {
        console.error("Error clearing cart:", error);
        showNotification("Failed to clear cart", "error");
    }
}

// Checkout process
async function checkout() {
    console.log("Checkout initiated");
    const user = auth.currentUser;
    if (!user) {
        showNotification("Please login to checkout", "error");
        return;
    }

    try {
        const userCartRef = ref(database, `users/${user.uid}/cart`);
        const snapshot = await get(userCartRef);
        
        if (!snapshot.exists()) {
            showNotification('Your cart is empty', 'error');
            return;
        }

        const cartItems = Object.values(snapshot.val());
        const deliveryData = getDeliveryData();
        
        const orderSummary = {
            items: cartItems,
            total: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            deliveryOption: deliveryData.deliveryOption,
            deliveryFee: deliveryData.deliveryFee,
            location: deliveryData.location,
            timestamp: new Date().toISOString()
        };

        // Save order to Firebase
        const orderRef = push(ref(database, `users/${user.uid}/orders`));
        await set(orderRef, orderSummary);
        
        // Clear the cart
        await clearCart();
        
        // Store for checkout page
        localStorage.setItem('orderSummary', JSON.stringify(orderSummary));
        
        // Redirect to checkout page
        window.location.href = 'checkout.html';
        
    } catch (error) {
        console.error("Checkout error:", error);
        showNotification("Checkout failed: " + error.message, "error");
    }
}

// Notification system
function showNotification(message, type = "success") {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Make functions available globally
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.checkout = checkout;
window.clearCart = clearCart;
window.toggleLocation = toggleLocation;