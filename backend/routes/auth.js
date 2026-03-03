import express from "express";
const router = express.Router();

// ================= NORMAL REGISTER =================
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields required" });
        }

        // TODO: Save user in database here

        res.json({
            message: "User registered successfully"
        });

    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// ================= NORMAL LOGIN =================
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email & Password required" });
        }

        // TODO: Check user from database here

        res.json({
            message: "Login successful",
            token: "dummy-jwt-token"
        });

    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// ================= FORGOT PASSWORD =================
router.post("/forgot", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email required" });
        }

        res.json({ message: "Reset link sent" });

    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

export default router;