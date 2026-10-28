const bcrypt = require("bcryptjs");
const db = require("../config/db");

const registerUser = async (req, res) => {
    try {
        const {
            full_name,
            email,
            phone,
            password,
            role
        } = req.body;

        // Check required fields
        if (!full_name || !email || !phone || !password || !role) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Check valid role
        if (role !== "farmer" && role !== "consumer") {
            return res.status(400).json({
                success: false,
                message: "Invalid role"
            });
        }

        // Check if email already exists
        const [existingUser] = await db.promise().query(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await db.promise().query(
            `INSERT INTO users
            (full_name, email, phone, password, role)
            VALUES (?, ?, ?, ?, ?)`,
            [
                full_name,
                email,
                phone,
                hashedPassword,
                role
            ]
        );

        res.status(201).json({
            success: true,
            message: "Account created successfully",
            userId: result.insertId
        });

    } catch (error) {
        console.error("Registration error:", error);

        res.status(500).json({
            success: false,
            message: "Server error during registration"
        });
    }
};

const jwt = require("jsonwebtoken");

const loginUser = async (req, res) => {

    try {

        const {
            email,
            password,
            role
        } = req.body;


        // Check required fields
        if (!email || !password || !role) {

            return res.status(400).json({
                success: false,
                message: "Email, password and role are required"
            });

        }


        // Find user
        const [users] = await db.promise().query(
            "SELECT * FROM users WHERE email = ? AND role = ?",
            [email, role]
        );


        if (users.length === 0) {

            return res.status(401).json({
                success: false,
                message: "Invalid email, password or role"
            });

        }


        const user = users[0];


        // Check password
        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!passwordMatch) {

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });

        }


        // Create JWT token
        const token = jwt.sign(
            {
                id: user.id,
                role: user.role
            },

            process.env.JWT_SECRET,

            {
                expiresIn: "1d"
            }
        );


        // Successful login
        res.json({

            success: true,

            message: "Login successful",

            token: token,

            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }

        });

    }

    catch (error) {

        console.error(
            "Login error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Server error during login"

        });

    }
};


module.exports = {
    registerUser,
    loginUser
};