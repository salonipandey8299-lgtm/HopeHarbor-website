import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import Payment from "../models/Payment.js";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


// ================= CREATE ORDER =================
router.post("/single", async (req, res) => {
  try {
    const { amount, category } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      key: process.env.RAZORPAY_KEY_ID,
      currency: order.currency,
    });

  } catch (err) {
    res.status(500).json({ message: "Order creation failed" });
  }
});


// ================= VERIFY PAYMENT =================
router.post("/verify", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
      category
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    // Save to DB
    await Payment.create({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount,
      category,
      date: new Date()
    });

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ message: "Verification error" });
  }
});

export default router;