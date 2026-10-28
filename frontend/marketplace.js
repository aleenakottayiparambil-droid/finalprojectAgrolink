const userData =
    localStorage.getItem("agrolink_user");


// =========================
// AUTHENTICATION CHECK
// =========================

if (!userData) {
    window.location.href = "index.html";
}

const user =
    JSON.parse(userData);

if (user.role !== "consumer") {
    window.location.href = "index.html";
}


// =========================
// PROFILE
// =========================

document.getElementById(
    "profileName"
).textContent =
    user.full_name;


// =========================
// LOGOUT
// =========================

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


// =========================
// LOAD MARKETPLACE
// =========================

async function loadMarketplace() {

    const token =
        localStorage.getItem(
            "agrolink_token"
        );

    const container =
        document.getElementById(
            "marketplaceContainer"
        );

    try {

        const response =
            await fetch(
                "http://localhost:5000/api/products",
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            "Bearer " + token
                    }
                }
            );


        const data =
            await response.json();


        if (!data.success) {

            container.innerHTML = `

                <div class="empty-marketplace">

                    <div class="empty-icon">
                        ⚠️
                    </div>

                    <h3>
                        Unable to load marketplace
                    </h3>

                    <p>
                        ${data.message}
                    </p>

                </div>

            `;

            return;
        }


        const products =
            data.products;


        // =========================
        // NO PRODUCTS
        // =========================

        if (products.length === 0) {

            container.innerHTML = `

                <div class="empty-marketplace">

                    <div class="empty-icon">
                        🌾
                    </div>

                    <h3>
                        No products available
                    </h3>

                    <p>
                        Farmers have not listed
                        any products yet.
                    </p>

                </div>

            `;

            return;
        }


        // =========================
        // PRODUCT GRID
        // =========================

        container.innerHTML = "";


        products.forEach(product => {

            const card =
                document.createElement("div");

            card.className =
                "marketplace-product-card";


            card.innerHTML = `

                <div class="marketplace-product-image">
                    🌾
                </div>


                <div class="marketplace-product-content">

                    <div class="marketplace-product-header">

                        <div>

                            <h3>
                                ${product.product_name}
                            </h3>

                            <span class="marketplace-category">
                                ${product.category}
                            </span>

                        </div>


                        <span class="marketplace-status">
                            Available
                        </span>

                    </div>


                    <p class="marketplace-description">

                        ${product.description ||
                        "Fresh agricultural product directly from the farmer."}

                    </p>


                    <div class="marketplace-details">

                        <div>

                            <span>
                                Quantity
                            </span>

                            <strong>
                                ${product.quantity}
                                ${product.unit}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Price
                            </span>

                            <strong class="marketplace-price">
                                ₹${product.price_per_unit}
                                <small>
                                    / ${product.unit}
                                </small>
                            </strong>

                        </div>

                    </div>


                    <div class="marketplace-farmer">

                        👨‍🌾

                        <span>
                            Farmer:
                            <strong>
                                ${product.farmer_name}
                            </strong>
                        </span>

                    </div>


                    <div class="marketplace-location">

                        📍
                        ${product.location ||
                        "Location not specified"}

                    </div>


                    <button
                        class="add-cart-btn"
                        onclick="addToCart(${product.id})"
                    >
                        🛒 Add to Cart
                    </button>

                </div>

            `;


            container.appendChild(card);

        });

    } catch (error) {

        console.error(
            "Marketplace error:",
            error
        );


        container.innerHTML = `

            <div class="empty-marketplace">

                <div class="empty-icon">
                    ⚠️
                </div>

                <h3>
                    Server connection failed
                </h3>

                <p>
                    Please make sure the backend
                    is running.
                </p>

            </div>

        `;

    }

}


// =========================
// ADD TO CART
// =========================

async function addToCart(productId) {
    const token = localStorage.getItem("agrolink_token");

    try {
        const response = await fetch(
            "http://localhost:5000/api/products/cart",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({
                    product_id: productId,
                    quantity: 1
                })
            }
        );

        const data = await response.json();

        if (data.success) {
            alert("Product added to cart successfully!");
        } else {
            alert(data.message || "Failed to add product to cart.");
        }

    } catch (error) {
        console.error("Add to cart error:", error);
        alert("Unable to connect to the server.");
    }
}


loadMarketplace();