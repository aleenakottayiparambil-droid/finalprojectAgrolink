const userData =
    localStorage.getItem("agrolink_user");


// Check login
if (!userData) {
    window.location.href = "index.html";
}


// Get user
const user =
    JSON.parse(userData);


// Check role
if (user.role !== "consumer") {
    window.location.href = "index.html";
}


// Display user name
document.getElementById(
    "consumerName"
).textContent =
    "Welcome, " + user.full_name;


document.getElementById(
    "profileName"
).textContent =
    user.full_name;


// Logout
document
    .getElementById("logoutBtn")
    .addEventListener("click", () => {

        localStorage.removeItem(
            "agrolink_token"
        );

        localStorage.removeItem(
            "agrolink_user"
        );

        window.location.href =
            "index.html";
    });

    async function loadConsumerStats() {
    const token = localStorage.getItem("agrolink_token");

    try {
        // Get cart items
        const cartResponse = await fetch(
            "http://localhost:5000/api/products/cart",
            {
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        const cartData = await cartResponse.json();

        if (cartData.success) {
            const cartCount = cartData.cart.reduce(
                (total, item) => total + Number(item.cart_quantity),
                0
            );

            document.getElementById("cartItemsCount").textContent =
                cartCount;
        }

        // Get orders
        const ordersResponse = await fetch(
            "http://localhost:5000/api/orders",
            {
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        const ordersData = await ordersResponse.json();

        if (ordersData.success) {
            const orders = ordersData.orders;

            document.getElementById("myOrdersCount").textContent =
                orders.length;

            const activeOrders = orders.filter(order =>
                ["placed", "confirmed", "processing", "shipped"]
                    .includes(order.order_status)
            );

            document.getElementById("activeOrdersCount").textContent =
                activeOrders.length;

            const totalSpent = orders.reduce(
                (total, order) => total + Number(order.total_amount),
                0
            );

            document.getElementById("totalSpent").textContent =
                "₹" + totalSpent.toFixed(2);
        }

    } catch (error) {
        console.error("Consumer statistics error:", error);
    }
}

loadConsumerStats();