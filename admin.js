import { auth, database } from "./firebase-config.mjs";
import {
    onAuthStateChanged,
    signOut,
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import {
    ref,
    push,
    onValue,
    get,
    set,
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";

// ✅ Check Admin Auth
onAuthStateChanged(auth, (user) => {
    if (user) {
        const userRef = ref(database, 'admins/' + user.uid);
        get(userRef).then((snapshot) => {
            if (snapshot.exists()) {
                document.getElementById('adminName').innerText = `Hello, ${snapshot.val().name}`;
                loadProducts();
                loadOrders();
            } else {
                window.location.href = "index.html"; // Redirect if not admin
            }
        });
    } else {
        window.location.href = "login.html";
    }
});

// ✅ Add New Product
document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const productName = document.getElementById('productName').value;
    const productPrice = document.getElementById('productPrice').value;
    const productImage = document.getElementById('productImage').value;

    const newProductRef = push(ref(database, 'products/'));
    await set(newProductRef, {
        name: productName,
        price: productPrice,
        image: productImage,
    });

    showNotification('Product added successfully!', 'success');
    document.getElementById('productForm').reset();
    loadProducts();
});

// ✅ Load Product List
function loadProducts() {
    const productList = document.getElementById('productList');
    const productRef = ref(database, 'products/');
    onValue(productRef, (snapshot) => {
        productList.innerHTML = '';
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const product = childSnapshot.val();
                productList.innerHTML += `
                    <div class="product-card">
                        <img src="${product.image}" alt="${product.name}">
                        <h4>${product.name}</h4>
                        <p>₱${product.price}</p>
                    </div>
                `;
            });
        } else {
            productList.innerHTML = '<p>No products available.</p>';
        }
    });
}

// ✅ Load Orders List
function loadOrders() {
    const ordersList = document.getElementById('ordersList');
    const ordersRef = ref(database, 'orders/');
    onValue(ordersRef, (snapshot) => {
        ordersList.innerHTML = '';
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const order = childSnapshot.val();
                ordersList.innerHTML += `
                    <div class="order-card">
                        <p><strong>Order ID:</strong> ${childSnapshot.key}</p>
                        <p><strong>User:</strong> ${order.userEmail}</p>
                        <p><strong>Product:</strong> ${order.productName}</p>
                        <p><strong>Price:</strong> ₱${order.price}</p>
                    </div>
                `;
            });
        } else {
            ordersList.innerHTML = '<p>No orders placed yet.</p>';
        }
    });
}

// ✅ Show Notification
function showNotification(message, type = "success") {
    const notification = document.getElementById("notification");
    notification.innerText = message;
    notification.className = `notification ${type}`;
    notification.style.display = "block";

    setTimeout(() => {
        notification.style.display = "none";
    }, 3000);
}

// ✅ Logout Button
document.getElementById('logoutButton').addEventListener('click', () => {
    signOut(auth).then(() => {
        window.location.href = "login.html";
    });
});
