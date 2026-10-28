const express = require("express");


const {
    placeOrder,
    getConsumerOrders,
    getFarmerOrders,
    payForOrder,
    updateFarmerOrderStatus
} = require("../controllers/orderController");


const authMiddleware =
    require("../middleware/authMiddleware");

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    placeOrder
);

router.get(
    "/",
    authMiddleware,
    getConsumerOrders
);

router.get(
    "/farmer",
    authMiddleware,
    getFarmerOrders
);

router.put(
    "/:order_id/pay",
    authMiddleware,
    payForOrder
);


router.put(
    "/:order_id/status",
    authMiddleware,
    updateFarmerOrderStatus
);

module.exports = router;