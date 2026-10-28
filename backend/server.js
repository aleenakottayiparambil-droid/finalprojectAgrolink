const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();
require("./config/db");
const authRoutes = require("./routes/authRoutes");
const productRoutes =
    require("./routes/productRoutes");

const orderRoutes =
    require("./routes/orderRoutes");
const diseaseRoutes = require("./routes/diseaseRoutes");
const app = express();

const PORT = process.env.PORT || 5000;



/* =========================
   MIDDLEWARE
========================= */

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));


/* =========================
   TEST ROUTE
========================= */

app.get("/", (req, res) => {

    res.json({
        success: true,
        message: "AgroLink AI Backend is running"
    });

});


/* =========================
   HEALTH CHECK
========================= */

app.get("/api/health", (req, res) => {

    res.json({
        success: true,
        message: "AgroLink AI Backend is healthy",
        timestamp: new Date()
    });

});

app.use("/api/auth", authRoutes);
app.use(
    "/api/products",
    productRoutes
);

app.use(
    "/api/orders",
    orderRoutes
);
app.use("/api/disease", diseaseRoutes);
/* =========================
   START SERVER
========================= */

app.listen(PORT, () => {

    console.log(
        `AgroLink AI Backend running on port ${PORT}`
    );

});