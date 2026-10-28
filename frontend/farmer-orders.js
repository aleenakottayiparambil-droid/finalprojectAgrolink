
const userData = localStorage.getItem("agrolink_user");

if (!userData) {
    window.location.href = "index.html";
} else {
    const user = JSON.parse(userData);

    if (user.role !== "farmer") {
        window.location.href = "index.html";
    }
}

const user = JSON.parse(
    localStorage.getItem("agrolink_user") || "{}"
);

if (user.role === "farmer") {
    document.getElementById("profileName").textContent =
        user.full_name;
}

document.getElementById("logoutBtn").addEventListener(
    "click",
    () => {
        localStorage.removeItem("agrolink_token");
        localStorage.removeItem("agrolink_user");

        window.location.href = "index.html";
    }
);


// =================================
// LOAD FARMER ORDERS
// =================================

async function loadFarmerOrders() {

    const token = localStorage.getItem("agrolink_token");

    const container =
        document.getElementById("farmerOrdersContainer");

    try {

        const response = await fetch(
            "http://localhost:5000/api/orders/farmer",
            {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {

            container.innerHTML = `
                <div class="empty-marketplace">
                    <div class="empty-icon">⚠️</div>
                    <h3>Unable to load orders</h3>
                    <p>${data.message || "Please try again."}</p>
                </div>
            `;

            return;
        }

        if (!data.orders || data.orders.length === 0) {

            container.innerHTML = `
                <div class="empty-marketplace">
                    <div class="empty-icon">📦</div>
                    <h3>No orders yet</h3>
                    <p>Orders for your products will appear here.</p>
                </div>
            `;

            return;
        }

        container.innerHTML = "";

        data.orders.forEach(order => {

            const card = document.createElement("div");
            card.className = "farmer-order-card";

            const orderDate =
                new Date(order.created_at).toLocaleString();

            const status =
                String(order.order_status || "placed").toLowerCase();

            let actionButtons = "";

            if (status === "placed") {

                actionButtons = `
                    <button
                        type="button"
                        class="order-action-btn confirm-btn"
                        data-order-id="${order.order_id}"
                        data-status="confirmed">
                        Confirm Order
                    </button>

                    <button
                        type="button"
                        class="order-action-btn reject-btn"
                        data-order-id="${order.order_id}"
                        data-status="rejected">
                        Reject Order
                    </button>
                `;

            } else if (status === "confirmed") {

                actionButtons = `
                    <button
                        type="button"
                        class="order-action-btn progress-btn"
                        data-order-id="${order.order_id}"
                        data-status="processing">
                        Mark as Processing
                    </button>
                `;

            } else if (status === "processing") {

                actionButtons = `
                    <button
                        type="button"
                        class="order-action-btn progress-btn"
                        data-order-id="${order.order_id}"
                        data-status="shipped">
                        Mark as Shipped
                    </button>
                `;

            } else if (status === "shipped") {

                actionButtons = `
                    <button
                        type="button"
                        class="order-action-btn delivered-btn"
                        data-order-id="${order.order_id}"
                        data-status="delivered">
                        Mark as Delivered
                    </button>
                `;

            } else if (status === "delivered") {

                actionButtons = `
                    <p class="order-finished">
                        ✅ Order delivered
                    </p>
                `;

            } else if (status === "rejected") {

                actionButtons = `
                    <p class="order-finished">
                        ❌ Order rejected
                    </p>
                `;

            } else if (status === "cancelled") {

                actionButtons = `
                    <p class="order-finished">
                        Order cancelled
                    </p>
                `;

            }

            card.innerHTML = `
                <div class="farmer-order-header">
                    <div>
                        <h3>Order #${order.order_id}</h3>
                        <span>${orderDate}</span>
                    </div>

                    <span class="farmer-order-status">
                        ${status}
                    </span>
                </div>

                <div class="farmer-order-details">

                    <p>
                        <strong>Product:</strong>
                        ${order.product_name}
                    </p>

                    <p>
                        <strong>Customer:</strong>
                        ${order.consumer_name}
                    </p>

                    <p>
                        <strong>Quantity:</strong>
                        ${order.quantity} ${order.unit}
                    </p>

                    <p>
                        <strong>Price per unit:</strong>
                        ₹${Number(order.price_per_unit).toFixed(2)}
                    </p>

                    <p>
                        <strong>Item total:</strong>
                        ₹${Number(order.subtotal).toFixed(2)}
                    </p>

                    <p>
                        <strong>Payment:</strong>
                        ${order.payment_status}
                    </p>

                    <p>
                        <strong>Delivery address:</strong>
                        ${order.delivery_address || "Not provided"}
                    </p>

                </div>

                <div class="order-actions">
                    ${actionButtons}
                </div>
            `;

            container.appendChild(card);
        });

        // Attach handlers to the order action buttons.
        container.querySelectorAll("[data-status]").forEach(button => {

            button.addEventListener("click", async () => {

                const orderId = button.dataset.orderId;
                const newStatus = button.dataset.status;

                await updateOrderStatus(
                    orderId,
                    newStatus,
                    button
                );

            });

        });

    } catch (error) {

        console.error("Farmer orders error:", error);

        container.innerHTML = `
            <div class="empty-marketplace">
                <div class="empty-icon">⚠️</div>
                <h3>Server connection error</h3>
                <p>Make sure the backend is running.</p>
            </div>
        `;
    }
}


// =================================
// UPDATE ORDER STATUS
// =================================

async function updateOrderStatus(orderId, newStatus, button) {

    const token = localStorage.getItem("agrolink_token");

    const confirmed = window.confirm(
        `Are you sure you want to ${newStatus} Order #${orderId}?`
    );

    if (!confirmed) {
        return;
    }

    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = "Updating...";

    try {

        const response = await fetch(
            `http://localhost:5000/api/orders/${orderId}/status`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({
                    order_status: newStatus
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {

            alert(data.message || "Could not update order status.");

            button.disabled = false;
            button.textContent = originalText;

            return;
        }

        alert(`Order #${orderId} updated to ${newStatus}.`);

        await loadFarmerOrders();

    } catch (error) {

        console.error("Update order status error:", error);

        alert("Unable to update the order. Check your backend.");

        button.disabled = false;
        button.textContent = originalText;
    }
}


// Load orders when the page opens
loadFarmerOrders();
