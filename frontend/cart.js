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


async function loadCart() {

    const token =
        localStorage.getItem("agrolink_token");

    const container =
        document.getElementById("cartContainer");

    try {

        const response = await fetch(
            "http://localhost:5000/api/products/cart",
            {
                method: "GET",
                headers: {
                    "Authorization":
                        "Bearer " + token
                }
            }
        );

        const data = await response.json();

        if (!data.success) {
            container.innerHTML = `
                <div class="empty-marketplace">
                    <div class="empty-icon">🛒</div>
                    <h3>Unable to load cart</h3>
                    <p>${data.message}</p>
                </div>
            `;
            return;
        }

        if (data.cart.length === 0) {

            container.innerHTML = `
                <div class="empty-marketplace">
                    <div class="empty-icon">🛒</div>

                    <h3>Your cart is empty</h3>

                    <p>
                        Add products from the marketplace
                        to see them here.
                    </p>
                </div>
            `;

            return;
        }

        container.innerHTML = "";

        data.cart.forEach(item => {

            const total =
                Number(item.cart_quantity) *
                Number(item.price_per_unit);

            const card =
                document.createElement("div");

            card.className =
                "cart-product-card";

            card.innerHTML = `
                <div class="cart-product-icon">
                    🌾
                </div>

                <div class="cart-product-details">

                    <h3>
                        ${item.product_name}
                    </h3>

                    <p>
                        ${item.category}
                    </p>

                    <span>
                        Farmer: ${item.farmer_name}
                    </span>

                    <span>
                        📍 ${item.location || "Not specified"}
                    </span>

                </div>

                <div class="cart-product-quantity">

                    <span>Quantity</span>

                    <strong>
                        ${item.cart_quantity}
                        ${item.unit}
                    </strong>

                </div>

                <div class="cart-product-price">

    <span>
        ₹${item.price_per_unit}
        / ${item.unit}
    </span>

    <strong>
        ₹${total.toFixed(2)}
    </strong>

    <button
        class="remove-cart-btn"
        onclick="removeFromCart(${item.cart_id})">
        Remove
    </button>

</div>
            `;

            container.appendChild(card);
        });

    } catch (error) {

        console.error(
            "Load cart error:",
            error
        );

        container.innerHTML = `
            <div class="empty-marketplace">

                <div class="empty-icon">
                    ⚠️
                </div>

                <h3>Server connection error</h3>

                <p>
                    Please make sure the AgroLink
                    backend is running.
                </p>

            </div>
        `;
    }
}

loadCart();

async function removeFromCart(cartId) {

    const token =
        localStorage.getItem("agrolink_token");

    try {

        const response = await fetch(
            `http://localhost:5000/api/products/cart/${cartId}`,
            {
                method: "DELETE",
                headers: {
                    "Authorization":
                        "Bearer " + token
                }
            }
        );

        const data = await response.json();

        if (data.success) {
            alert("Product removed from cart.");
            loadCart();
        } else {
            alert(
                data.message ||
                "Failed to remove product."
            );
        }

    } catch (error) {

        console.error(
            "Remove cart error:",
            error
        );

        alert(
            "Unable to connect to the server."
        );
    }
}

document.getElementById("placeOrderBtn").addEventListener(
    "click",
    async () => {

        const address =
            document.getElementById("deliveryAddress").value.trim();

        if (!address) {
            alert("Please enter your delivery address.");
            return;
        }

        const token =
            localStorage.getItem("agrolink_token");

        const button =
            document.getElementById("placeOrderBtn");

        button.disabled = true;
        button.textContent = "Placing Order...";

        try {

            const response = await fetch(
                "http://localhost:5000/api/orders",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "Authorization":
                            "Bearer " + token
                    },

                    body: JSON.stringify({
                        delivery_address: address
                    })
                }
            );

            const data = await response.json();

            if (data.success) {

                alert(
                    `Order placed successfully!\n\n` +
                    `Order ID: #${data.order_id}\n` +
                    `Total: ₹${Number(
                        data.total_amount
                    ).toFixed(2)}`
                );

                window.location.href = "orders.html";

            } else {

                alert(
                    data.message ||
                    "Unable to place order."
                );

                button.disabled = false;
                button.textContent = "Place Order";
            }

        } catch (error) {

            console.error(
                "Place order error:",
                error
            );

            alert(
                "Unable to connect to the server."
            );

            button.disabled = false;
            button.textContent = "Place Order";
        }

    }
);