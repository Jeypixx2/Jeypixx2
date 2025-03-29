// Load Cart Items on Page Load
document.addEventListener('DOMContentLoaded', () => {
    loadCartItems();
    updateCartCount();
});

// Load and Display Cart Items
function loadCartItems() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartItemsContainer = document.getElementById('cartItems');
    const emptyCartMessage = document.getElementById('emptyCart');
    const cartSummary = document.getElementById('cartSummary');

    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        emptyCartMessage.style.display = 'block';
        cartSummary.style.display = 'none';
    } else {
        emptyCartMessage.style.display = 'none';
        cartSummary.style.display = 'block';

        cart.forEach((item, index) => {
            cartItemsContainer.innerHTML += `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <p>$${item.price.toFixed(2)}</p>
                        <input type="number" min="1" value="${item.quantity}" 
                            onchange="updateQuantity(${index}, this.value)" class="cart-qty">
                        <button class="remove-btn" onclick="removeFromCart(${index})">Remove</button>
                    </div>
                </div>
            `;
        });

        updateCartTotal();
    }
}

// Update Cart Total
function updateCartTotal() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let total = 0;

    cart.forEach(item => {
        total += item.price * item.quantity;
    });

    document.getElementById('cartTotal').innerText = `$${total.toFixed(2)}`;
}
// Delivery Fee Settings
const deliveryRates = {
    'Naga City': 30,
    'Pili': 50,
    'Iriga': 70,
    'Others': 100
};

// ✅ Toggle Location Field for Pickup/Delivery
function toggleLocation(show) {
    const locationSection = document.getElementById('locationSection');
    locationSection.style.display = show ? 'block' : 'none';
    updateDeliveryFee(); // Update fee when switching
}

// ✅ Calculate Delivery Fee Based on Location
function updateDeliveryFee() {
    const deliveryOption = document.querySelector('input[name="deliveryOption"]:checked').value;
    const location = document.getElementById('location').value.trim();

    let deliveryFee = 0;

    if (deliveryOption === 'delivery' && location) {
        // Check if the location is in the list
        deliveryFee = deliveryRates[location] || deliveryRates['Others'];
    }

    // Update Fee Display
    document.getElementById('deliveryFee').innerText = `Delivery Fee: ₱${deliveryFee.toFixed(2)}`;
    return deliveryFee;
}

// ✅ Listen for Changes in Delivery Option
document.querySelectorAll('input[name="deliveryOption"]').forEach(option => {
    option.addEventListener('change', updateDeliveryFee);
});

// ✅ Calculate Fee When Typing Location
document.getElementById('location').addEventListener('input', updateDeliveryFee);

// ✅ Get Delivery Data to Include in Order
function getDeliveryData() {
    const deliveryOption = document.querySelector('input[name="deliveryOption"]:checked').value;
    const location = deliveryOption === 'delivery' ? document.getElementById('location').value : 'Store Pickup';
    const deliveryFee = updateDeliveryFee();

    return {
        deliveryOption,
        location,
        deliveryFee
    };
}


// Update Quantity of Items in Cart
function updateQuantity(index, quantity) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    if (quantity <= 0) {
        removeFromCart(index);
    } else {
        cart[index].quantity = parseInt(quantity);
        localStorage.setItem('cart', JSON.stringify(cart));
        loadCartItems();
    }
}

// Remove Item from Cart
function removeFromCart(index) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCartItems();
    updateCartCount();
}

// Update Cart Count Icon
function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    document.getElementById('cartCount').innerText = totalItems;
}

// Clear All Items from Cart
function clearCart() {
    localStorage.removeItem('cart');
    loadCartItems();
    updateCartCount();
    alert('Cart has been cleared!');
}

// Proceed to Checkout
function checkout() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        alert('Your cart is empty. Please add some items.');
        return;
    }

    // Get Delivery Data
    const deliveryData = getDeliveryData();
    const deliveryFee = deliveryData.deliveryFee;

    // Calculate Final Total
    let totalAmount = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    totalAmount += deliveryFee;

    // Prepare Order Summary
    const orderSummary = {
        items: cart,
        totalAmount,
        deliveryOption: deliveryData.deliveryOption,
        deliveryFee,
        location: deliveryData.location
    };

    // Save to LocalStorage for Review
    localStorage.setItem('orderSummary', JSON.stringify(orderSummary));

    alert('Proceeding to checkout...');
    window.location.href = 'checkout.html';
}

