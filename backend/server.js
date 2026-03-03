import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import paymentRoutes from "./routes/payment.js";
import userRoutes from "./routes/user.js";
import feedbackRoutes from "./routes/feedback.js";

dotenv.config();
const app = express();

// ================= CORS =================
app.use(cors({
    origin: "https://hope-harbor-website-1.onrender.com", // your frontend URL
    credentials: true,
}));

app.use(express.json());

// ================= MongoDB =================
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// ================= Routes =================
app.use("/api/auth", authRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/feedback", feedbackRoutes);

// ================= Health Check =================
app.get("/", (req, res) => {
    res.send("Server Running");
});

// ================= Start Server =================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));