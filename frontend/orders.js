
const userData = localStorage.getItem("agrolink_user");

if (!userData) {
    window.location.href = "index.html";
}

const user = JSON.parse(userData);

if (user.role !== "consumer") {
    window.location.href = "index.html";
}

document.getElementById("profileName").textContent =
    user.full_name;

document.getElementById("logoutBtn").addEventListener(
    "click",
    () => {
        localStorage.removeItem("agrolink_token");
        localStorage.removeItem("agrolink_user");

        window.location.href = "index.html";
    }
);


// Load consumer orders
async function loadOrders() {

    const token = localStorage.getItem("agrolink_token");

    const container =
        document.getElementById("ordersContainer");

    try {

        const response = await fetch(
            "http://localhost:5000/api/orders",
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
                    <p>Your placed orders will appear here.</p>
                </div>
            `;

            return;
        }

        container.innerHTML = "";

        data.orders.forEach(order => {

            const card = document.createElement("div");

            card.className = "order-card";

            const orderDate =
                new Date(order.created_at).toLocaleString();

            const paymentStatus =
                String(order.payment_status || "pending")
                    .toLowerCase();

            card.innerHTML = `

                <div class="order-header">

                    <div>
                        <h3>Order #${order.id}</h3>
                        <span>${orderDate}</span>
                    </div>

                    <span class="order-status">
                        ${order.order_status}
                    </span>

                </div>

                <div class="order-details">

                    <div>
                        <span>Total Amount</span>
                        <strong>
                            ₹${Number(order.total_amount).toFixed(2)}
                        </strong>
                    </div>

                    <div>
                        <span>Payment Status</span>
                        <strong class="payment-status">
                            ${paymentStatus}
                        </strong>
                    </div>

                    <div>
                        <span>Delivery Address</span>
                        <strong>
                            ${order.delivery_address || "Not provided"}
                        </strong>
                    </div>

                </div>

                ${
                    paymentStatus === "pending"
                        ? `
                            <button
                                type="button"
                                class="place-order-btn pay-now-btn"
                                data-order-id="${order.id}">
                                Pay Now
                            </button>
                        `
                        : paymentStatus === "paid"
                            ? `
                                <p class="payment-complete">
                                    ✅ Payment completed successfully
                                </p>
                            `
                            : `
                                <p class="payment-complete">
                                    Payment status: ${paymentStatus}
                                </p>
                            `
                }

            `;

            container.appendChild(card);

        });

        // Attach payment handlers to pending orders
        container.querySelectorAll(".pay-now-btn").forEach(button => {

            button.addEventListener("click", async () => {

                const orderId = button.dataset.orderId;

                await payForOrder(orderId, button);

            });

        });

    } catch (error) {

        console.error("Load orders error:", error);

        container.innerHTML = `
            <div class="empty-marketplace">
                <div class="empty-icon">⚠️</div>
                <h3>Server connection error</h3>
                <p>
                    Please make sure the AgroLink backend is running.
                </p>
            </div>
        `;
    }
}


// Simulated payment — no real money is charged
async function payForOrder(orderId, button) {

    const token = localStorage.getItem("agrolink_token");

    const confirmed = window.confirm(
        `Confirm simulated payment for Order #${orderId}?`
    );

    if (!confirmed) {
        return;
    }

    button.disabled = true;
    button.textContent = "Processing...";

    try {

        const response = await fetch(
            `http://localhost:5000/api/orders/${orderId}/pay`,
            {
                method: "PUT",
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {

            alert(data.message || "Payment failed.");

            button.disabled = false;
            button.textContent = "Pay Now";

            return;
        }

        alert("Simulated payment successful!");

        await loadOrders();

    } catch (error) {

        console.error("Payment error:", error);

        alert(
            "Could not process payment. Please check whether the backend is running."
        );

        button.disabled = false;
        button.textContent = "Pay Now";
    }
}


// Display orders when the page opens
loadOrders();
