import express from "express";
import Razorpay from "razorpay";
import Payment from "../models/Payment.js";
import auth, { isAdmin } from "../middleware/auth.js";

const router = express.Router();

// ===== SINGLE PAYMENT =====
router.post("/single", auth, async (req, res) => {
  try {
    const { amount, category } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || "Your_key",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "Your_secret_key",
    });

    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: "INR",
    });

    // Save the payment as pending
    await Payment.create({
      userId: req.user.id,
      amount,
      category: category || "general",
      type: "single",
      date: new Date(),
    });

    res.json({
      orderId: order.id,
      key: process.env.RAZORPAY_KEY_ID,
      currency: "INR",
    });
  } catch (err) {
    console.error("Single Payment Error:", err);
    res.status(500).json({ message: "Server error while creating payment" });
  }
});

// ===== AUTO PAYMENT =====
router.post("/auto", auth, async (req, res) => {
  try {
    const fixedAmount = 500;

    await Payment.create({
      userId: req.user.id,
      amount: fixedAmount,
      type: "auto",
      category: "general",
      date: new Date(),
    });

    res.json({ message: "Auto Payment ₹500 saved successfully!" });
  } catch (err) {
    console.error("Auto Payment Error:", err);
    res.status(500).json({ message: "Server error while saving auto payment" });
  }
});

// ===== USER PAYMENT HISTORY =====
router.get("/history", auth, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.id }).sort({ date: -1 });
    res.json(payments);
  } catch (err) {
    console.error("Payment History Error:", err);
    res.status(500).json({ message: "Server error while fetching payment history" });
  }
});

// ===== ADMIN REPORTS =====
router.get("/report", auth, isAdmin, async (req, res) => {
  try {
    const payments = await Payment.find();

    const totalCollection = payments.reduce((sum, p) => sum + p.amount, 0);

    const zakatCollection = payments
      .filter(p => p.category === "zakat")
      .reduce((sum, p) => sum + p.amount, 0);

    const generalCollection = totalCollection - zakatCollection;

    res.json({
      totalCollection,
      zakatCollection,
      generalCollection,
      totalPayments: payments.length,
    });
  } catch (err) {
    console.error("Admin Report Error:", err);
    res.status(500).json({ message: "Server error while generating report" });
  }
});

export default router;