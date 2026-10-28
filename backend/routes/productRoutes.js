const express = require("express");

const {
    addProduct,
    getFarmerProducts,
    getAllProducts,
    addToCart,
    getCart,
    removeFromCart
} = require("../controllers/productController");

const authMiddleware =
    require("../middleware/authMiddleware");

const router = express.Router();


// Add product
router.post(
    "/",
    authMiddleware,
    addProduct
);


// Get farmer's products
router.get(
    "/farmer",
    authMiddleware,
    getFarmerProducts
);

router.get(
    "/",
    authMiddleware,
    getAllProducts
);

router.post(
    "/cart",
    authMiddleware,
    addToCart
);

router.get(
    "/cart",
    authMiddleware,
    getCart
);

router.delete(
    "/cart/:cart_id",
    authMiddleware,
    removeFromCart
);

module.exports = router;