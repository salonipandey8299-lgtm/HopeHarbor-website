import "dotenv/config";  // loads .env
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import feedbackRoutes from "./routes/feedback.js";
import paymentRoutes from "./routes/payment.js";

const app = express();

// MIDDLEWARES
app.use(cors({ origin: '*' }))
app.use(express.json());

// DATABASE
mongoose.connect(process.env.MONGO_URI, { dbName: "trustDB" })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log(err));

// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/payment", paymentRoutes);

app.get("/", (req, res) => {
  res.send("Server is running!");
});

// SERVER START
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));