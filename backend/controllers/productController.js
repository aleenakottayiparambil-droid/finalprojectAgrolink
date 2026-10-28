const db = require("../config/db");


// Add a new product
const addProduct = async (req, res) => {
    try {

        const {
            product_name,
            category,
            description,
            quantity,
            unit,
            price_per_unit,
            location
        } = req.body;


        // Validate required fields
        if (
            !product_name ||
            !category ||
            !quantity ||
            !price_per_unit
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required fields"
            });
        }


        // Get farmer ID from logged-in user
        const farmer_id = req.user.id;


        const [result] =
            await db.promise().query(
                `INSERT INTO products
                (
                    farmer_id,
                    product_name,
                    category,
                    description,
                    quantity,
                    unit,
                    price_per_unit,
                    location
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    farmer_id,
                    product_name,
                    category,
                    description || null,
                    quantity,
                    unit || "kg",
                    price_per_unit,
                    location || null
                ]
            );


        res.status(201).json({
            success: true,
            message: "Product added successfully",
            productId: result.insertId
        });

    } catch (error) {

        console.error(
            "Add product error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error while adding product"
        });
    }
};

const getFarmerProducts = async (req, res) => {
    try {

        const farmer_id = req.user.id;

        const [products] =
            await db.promise().query(
                `SELECT *
                 FROM products
                 WHERE farmer_id = ?
                 ORDER BY created_at DESC`,
                [farmer_id]
            );

        res.json({
            success: true,
            products: products
        });

    } catch (error) {

        console.error(
            "Get farmer products error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error while fetching products"
        });
    }
};

const getAllProducts = async (req, res) => {
    try {

        const [products] =
            await db.promise().query(
                `SELECT
                    products.id,
                    products.product_name,
                    products.category,
                    products.description,
                    products.quantity,
                    products.unit,
                    products.price_per_unit,
                    products.location,
                    products.image_url,
                    products.status,
                    users.full_name AS farmer_name
                 FROM products
                 JOIN users
                    ON products.farmer_id = users.id
                 WHERE products.status = 'available'
                 ORDER BY products.created_at DESC`
            );

        res.json({
            success: true,
            products: products
        });

    } catch (error) {

        console.error(
            "Get all products error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while fetching marketplace products"
        });
    }
};

const addToCart = async (req, res) => {

    try {

        const consumer_id =
            req.user.id;

        const {
            product_id,
            quantity
        } = req.body;


        if (!product_id || !quantity) {

            return res.status(400).json({
                success: false,
                message:
                    "Product and quantity are required"
            });

        }


        // Check whether product exists

        const [products] =
            await db.promise().query(
                `SELECT id, quantity, status
                 FROM products
                 WHERE id = ?`,
                [product_id]
            );


        if (products.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Product not found"
            });

        }


        const product =
            products[0];


        if (product.status !== "available") {

            return res.status(400).json({
                success: false,
                message:
                    "This product is not available"
            });

        }


        if (quantity > product.quantity) {

            return res.status(400).json({
                success: false,
                message:
                    "Requested quantity is not available"
            });

        }


        // Check if product already exists in cart

        const [existingCart] =
            await db.promise().query(
                `SELECT id, quantity
                 FROM cart
                 WHERE consumer_id = ?
                 AND product_id = ?`,
                [
                    consumer_id,
                    product_id
                ]
            );


        if (existingCart.length > 0) {

            const newQuantity =
                Number(existingCart[0].quantity)
                + Number(quantity);


            if (newQuantity > product.quantity) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Total cart quantity exceeds available stock"
                });

            }


            await db.promise().query(
                `UPDATE cart
                 SET quantity = ?
                 WHERE id = ?`,
                [
                    newQuantity,
                    existingCart[0].id
                ]
            );


        } else {

            await db.promise().query(
                `INSERT INTO cart
                (
                    consumer_id,
                    product_id,
                    quantity
                )
                VALUES (?, ?, ?)`,
                [
                    consumer_id,
                    product_id,
                    quantity
                ]
            );

        }


        res.status(201).json({

            success: true,

            message:
                "Product added to cart successfully"

        });


    } catch (error) {

        console.error(
            "Add to cart error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Server error while adding product to cart"

        });

    }

};

const getCart = async (req, res) => {
    try {
        const consumer_id = req.user.id;

        const [cartItems] = await db.promise().query(
            `SELECT
                cart.id AS cart_id,
                cart.product_id,
                cart.quantity AS cart_quantity,
                products.product_name,
                products.category,
                products.unit,
                products.price_per_unit,
                products.location,
                users.full_name AS farmer_name
             FROM cart
             JOIN products
                ON cart.product_id = products.id
             JOIN users
                ON products.farmer_id = users.id
             WHERE cart.consumer_id = ?
             ORDER BY cart.created_at DESC`,
            [consumer_id]
        );

        res.json({
            success: true,
            cart: cartItems
        });

    } catch (error) {
        console.error("Get cart error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching cart"
        });
    }
};

const removeFromCart = async (req, res) => {
    try {
        const consumer_id = req.user.id;
        const { cart_id } = req.params;

        const [result] = await db.promise().query(
            `DELETE FROM cart
             WHERE id = ?
             AND consumer_id = ?`,
            [cart_id, consumer_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Cart item not found"
            });
        }

        res.json({
            success: true,
            message: "Product removed from cart"
        });

    } catch (error) {
        console.error("Remove from cart error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while removing product"
        });
    }
};

module.exports = {
    addProduct,
    getFarmerProducts,
    getAllProducts,
    addToCart,
    getCart,
    removeFromCart
};