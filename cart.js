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

// Proceed to Checkout (Demo)
function checkout() {
    alert('Proceeding to checkout...');
    localStorage.removeItem('cart');
    window.location.href = 'index.html';
}
