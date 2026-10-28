const userData =
    localStorage.getItem("agrolink_user");

if (!userData) {
    window.location.href = "index.html";
}

const user =
    JSON.parse(userData);

if (user.role !== "farmer") {
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
// LOAD PRODUCTS
// =========================

async function loadProducts() {

    const token =
        localStorage.getItem(
            "agrolink_token"
        );

    try {

        const response =
            await fetch(
                "http://localhost:5000/api/products/farmer",
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

            document.getElementById(
                "productsContainer"
            ).innerHTML = `

                <div class="empty-marketplace">

                    <div class="empty-icon">
                        ⚠️
                    </div>

                    <h3>
                        Unable to load products
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


        const container =
            document.getElementById(
                "productsContainer"
            );


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
                        No products yet
                    </h3>

                    <p>
                        Add your first product to
                        start selling.
                    </p>

                </div>

            `;

            return;
        }


        // =========================
        // PRODUCT GRID
        // =========================

        container.className =
            "products-grid";

        container.innerHTML = "";


        products.forEach(product => {

            const card =
                document.createElement("div");

            card.className =
                "product-card";


            card.innerHTML = `

                <div class="product-card-top">

                    <div class="product-image-placeholder">
                        🌾
                    </div>

                    <span class="product-status">
                        ${product.status}
                    </span>

                </div>


                <h3>
                    ${product.product_name}
                </h3>


                <div class="product-category">
                    ${product.category}
                </div>


                <div class="product-info">


                    <div class="product-info-row">

                        <span class="product-info-label">
                            Quantity
                        </span>

                        <span class="product-info-value">
                            ${product.quantity}
                            ${product.unit}
                        </span>

                    </div>


                    <div class="product-info-row">

                        <span class="product-info-label">
                            Price
                        </span>

                        <span class="product-price">
                            ₹${product.price_per_unit}
                        </span>

                    </div>


                    <div class="product-info-row">

                        <span class="product-info-label">
                            Unit
                        </span>

                        <span class="product-info-value">
                            per ${product.unit}
                        </span>

                    </div>


                </div>


                <div class="product-location">

                    📍
                    ${product.location || "Location not specified"}

                </div>

            `;


            container.appendChild(card);

        });


    } catch (error) {

        console.error(
            "Load products error:",
            error
        );


        document.getElementById(
            "productsContainer"
        ).innerHTML = `

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


loadProducts();