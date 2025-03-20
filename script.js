// Load Cart Count on Page Load
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
});

// Add to Cart Function
function addToCart(productName, productPrice, qtyInputId) {
    // Get selected quantity
    const quantity = parseInt(document.getElementById(qtyInputId).value);

    // Get current cart items from localStorage or initialize an empty array
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Check if the product is already in the cart
    const existingItem = cart.find(item => item.name === productName);

    if (existingItem) {
        // If product exists, increase the quantity
        existingItem.quantity += quantity;
    } else {
        // Add new product to cart
        cart.push({
            name: productName,
            price: productPrice,
            quantity: quantity
        });
    }

    // Save updated cart to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));

    // Update Cart Count
    updateCartCount();
    alert(`${quantity} of ${productName} added to cart!`);
}

// Update Cart Count on the Cart Icon
function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

    document.getElementById('cartCount').innerText = cartCount;
}
// Search by Name
function filterProducts() {
    const input = document.getElementById('searchInput').value.toLowerCase();
    const productCards = document.querySelectorAll('.product-card');

    productCards.forEach(card => {
        const productName = card.querySelector('h3').innerText.toLowerCase();
        if (productName.includes(input)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Filter by Category
function filterCategory(category) {
    const productCards = document.querySelectorAll('.product-card');

    productCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        if (category === 'all' || category === cardCategory) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Filter Products using Search Bar
function filterProducts() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const productCards = document.querySelectorAll('.product-card');

    productCards.forEach(card => {
        const productName = card.querySelector('h3').innerText.toLowerCase();

        if (productName.includes(searchInput)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Filter Products by Category
function filterCategory(category) {
    const productCards = document.querySelectorAll('.product-card');

    productCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');

        if (category === 'all' || cardCategory === category) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}
