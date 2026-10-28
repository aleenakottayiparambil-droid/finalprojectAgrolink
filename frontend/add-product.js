const userData =
    localStorage.getItem("agrolink_user");


// Check login
if (!userData) {
    window.location.href = "index.html";
}


const user =
    JSON.parse(userData);


// Check farmer role
if (user.role !== "farmer") {
    window.location.href = "index.html";
}


// Show farmer name
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


// Add product
document
    .getElementById("productForm")
    .addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const productName =
                document
                    .getElementById("productName")
                    .value
                    .trim();


            const category =
                document
                    .getElementById("category")
                    .value;


            const quantity =
                document
                    .getElementById("quantity")
                    .value;


            const unit =
                document
                    .getElementById("unit")
                    .value;


            const price =
                document
                    .getElementById("price")
                    .value;


            const location =
                document
                    .getElementById("location")
                    .value
                    .trim();


            const description =
                document
                    .getElementById("description")
                    .value
                    .trim();


            const token =
                localStorage.getItem(
                    "agrolink_token"
                );


            try {

                const response =
                    await fetch(
                        "http://localhost:5000/api/products",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    "Bearer " + token
                            },

                            body: JSON.stringify({

                                product_name:
                                    productName,

                                category:
                                    category,

                                description:
                                    description,

                                quantity:
                                    quantity,

                                unit:
                                    unit,

                                price_per_unit:
                                    price,

                                location:
                                    location
                            })
                        }
                    );


                const data =
                    await response.json();


                if (data.success) {

                    alert(
                        "Product added successfully!"
                    );


                    document
                        .getElementById(
                            "productForm"
                        )
                        .reset();

                } else {

                    alert(
                        data.message ||
                        "Unable to add product."
                    );
                }

            } catch (error) {

                console.error(
                    "Add product error:",
                    error
                );

                alert(
                    "Unable to connect to the server."
                );
            }

        }
    );