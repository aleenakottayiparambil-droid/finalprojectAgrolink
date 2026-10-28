const db = require("../config/db");

const placeOrder = async (req, res) => {
    const connection = await db.promise().getConnection();

    try {
        const consumer_id = req.user.id;
        const { delivery_address } = req.body;

        if (!delivery_address) {
            connection.release();

            return res.status(400).json({
                success: false,
                message: "Delivery address is required"
            });
        }

        await connection.beginTransaction();

        // Get consumer cart
        const [cartItems] = await connection.query(
            `SELECT
                cart.product_id,
                cart.quantity,
                products.product_name,
                products.farmer_id,
                products.quantity AS available_quantity,
                products.price_per_unit,
                products.status
             FROM cart
             JOIN products
                ON cart.product_id = products.id
             WHERE cart.consumer_id = ?`,
            [consumer_id]
        );

        if (cartItems.length === 0) {
            await connection.rollback();
            connection.release();

            return res.status(400).json({
                success: false,
                message: "Your cart is empty"
            });
        }

        let total_amount = 0;

        // Check stock and calculate total
        for (const item of cartItems) {

            if (item.status !== "available") {
                await connection.rollback();
                connection.release();

                return res.status(400).json({
                    success: false,
                    message:
                        `${item.product_name} is no longer available`
                });
            }

            if (
                Number(item.quantity) >
                Number(item.available_quantity)
            ) {
                await connection.rollback();
                connection.release();

                return res.status(400).json({
                    success: false,
                    message:
                        `Not enough stock for ${item.product_name}`
                });
            }

            total_amount +=
                Number(item.quantity) *
                Number(item.price_per_unit);
        }

        // Create order
        const [orderResult] = await connection.query(
            `INSERT INTO orders
            (
                consumer_id,
                total_amount,
                payment_status,
                order_status,
                delivery_address
            )
            VALUES (?, ?, 'pending', 'placed', ?)`,
            [
                consumer_id,
                total_amount,
                delivery_address
            ]
        );

        const order_id = orderResult.insertId;

        // Add order items
        for (const item of cartItems) {

            const subtotal =
                Number(item.quantity) *
                Number(item.price_per_unit);

            await connection.query(
                `INSERT INTO order_items
                (
                    order_id,
                    product_id,
                    farmer_id,
                    quantity,
                    price_per_unit,
                    subtotal
                )
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    order_id,
                    item.product_id,
                    item.farmer_id,
                    item.quantity,
                    item.price_per_unit,
                    subtotal
                ]
            );

            // Reduce product stock
            const remainingStock =
                Number(item.available_quantity) -
                Number(item.quantity);

            const newStatus =
                remainingStock <= 0
                    ? "out_of_stock"
                    : "available";

            await connection.query(
                `UPDATE products
                 SET quantity = ?,
                     status = ?
                 WHERE id = ?`,
                [
                    remainingStock,
                    newStatus,
                    item.product_id
                ]
            );
        }

        // Clear cart
        await connection.query(
            `DELETE FROM cart
             WHERE consumer_id = ?`,
            [consumer_id]
        );

        await connection.commit();

        connection.release();

        res.status(201).json({
            success: true,
            message: "Order placed successfully",
            order_id: order_id,
            total_amount: total_amount
        });

    } catch (error) {

        await connection.rollback();
        connection.release();

        console.error(
            "Place order error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Server error while placing order"
        });
    }
};

const getConsumerOrders = async (req, res) => {
    try {
        const consumer_id = req.user.id;

        const [orders] = await db.promise().query(
            `SELECT
                id,
                total_amount,
                payment_status,
                order_status,
                delivery_address,
                created_at
             FROM orders
             WHERE consumer_id = ?
             ORDER BY created_at DESC`,
            [consumer_id]
        );

        res.json({
            success: true,
            orders: orders
        });

    } catch (error) {

        console.error(
            "Get consumer orders error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error while fetching orders"
        });
    }
};

const getFarmerOrders = async (req, res) => {
    try {
        const farmer_id = req.user.id;

        const [orders] = await db.promise().query(
            `SELECT
                orders.id AS order_id,
                orders.order_status,
                orders.payment_status,
                orders.delivery_address,
                orders.created_at,
                users.full_name AS consumer_name,
                order_items.product_id,
                products.product_name,
                order_items.quantity,
                products.unit,
                order_items.price_per_unit,
                order_items.subtotal
             FROM order_items
             JOIN orders
                ON order_items.order_id = orders.id
             JOIN users
                ON orders.consumer_id = users.id
             JOIN products
                ON order_items.product_id = products.id
             WHERE order_items.farmer_id = ?
             ORDER BY orders.created_at DESC`,
            [farmer_id]
        );

        res.json({
            success: true,
            orders: orders
        });

    } catch (error) {
        console.error("Get farmer orders error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching farmer orders"
        });
    }
};

const payForOrder = async (req, res) => {
    try {
        const consumer_id = req.user.id;
        const { order_id } = req.params;

        const [orders] = await db.promise().query(
            `SELECT id, payment_status
             FROM orders
             WHERE id = ? AND consumer_id = ?`,
            [order_id, consumer_id]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        if (orders[0].payment_status === "paid") {
            return res.status(400).json({
                success: false,
                message: "This order has already been paid"
            });
        }

        if (orders[0].payment_status === "failed") {
            return res.status(400).json({
                success: false,
                message: "Payment has failed for this order"
            });
        }

        await db.promise().query(
            `UPDATE orders
             SET payment_status = 'paid'
             WHERE id = ? AND consumer_id = ?`,
            [order_id, consumer_id]
        );

        res.json({
            success: true,
            message: "Payment successful",
            order_id: order_id
        });

    } catch (error) {
        console.error("Payment error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while processing payment"
        });
    }
}; 


 // ================================
 // UPDATE ORDER STATUS BY FARMER
 // ================================

const updateFarmerOrderStatus = async (req, res) => {
    try {
        const farmer_id = req.user.id;
        const { order_id } = req.params;
        const { order_status } = req.body;

        const allowedStatuses = [
            "confirmed",
            "rejected",
            "processing",
            "shipped",
            "delivered"
        ];

        if (!allowedStatuses.includes(order_status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order status"
            });
        }

        // Check whether this order contains products
        // belonging to the logged-in farmer.
        const [items] = await db.promise().query(
            `SELECT oi.id
             FROM order_items oi
             JOIN orders o ON o.id = oi.order_id
             WHERE oi.order_id = ?
               AND oi.farmer_id = ?
             LIMIT 1`,
            [order_id, farmer_id]
        );

        if (items.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found for this farmer"
            });
        }

        // Read the current order status.
        const [orders] = await db.promise().query(
            `SELECT order_status
             FROM orders
             WHERE id = ?`,
            [order_id]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const currentStatus = orders[0].order_status;

        // Only newly placed orders can be confirmed or rejected.
        if (
            ["confirmed", "rejected"].includes(order_status) &&
            currentStatus !== "placed"
        ) {
            return res.status(400).json({
                success: false,
                message: "Only newly placed orders can be confirmed or rejected"
            });
        }

        // Enforce the order progression.
        const allowedTransitions = {
            confirmed: ["processing"],
            processing: ["shipped"],
            shipped: ["delivered"]
        };

        if (
            ["processing", "shipped", "delivered"].includes(order_status) &&
            !allowedTransitions[currentStatus]?.includes(order_status)
        ) {
            return res.status(400).json({
                success: false,
                message: `Cannot change order from ${currentStatus} to ${order_status}`
            });
        }

        await db.promise().query(
            `UPDATE orders
             SET order_status = ?
             WHERE id = ?`,
            [order_status, order_id]
        );

        return res.json({
            success: true,
            message: `Order ${order_status} successfully`,
            order_id,
            order_status
        });

    } catch (error) {
        console.error("Update farmer order status error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while updating order status"
        });
    }
};



module.exports = {
    placeOrder,
    getConsumerOrders,
    getFarmerOrders,
    payForOrder,
    updateFarmerOrderStatus
};
