import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import Payment from "../models/Payment.js";
import auth, { isAdmin } from "../middleware/auth.js";

const router = express.Router();

// ================= RAZORPAY INSTANCE =================
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


// =====================================================
// 1️⃣ CREATE ORDER (Single Payment)
// =====================================================
router.post("/single", auth, async (req, res) => {
  try {
    const { amount, category } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const options = {
      amount: amount * 100, // convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      key: process.env.RAZORPAY_KEY_ID,
      currency: "INR",
      amount,
      category: category || "general",
    });

  } catch (err) {
    console.error("Create Order Error:", err);
    res.status(500).json({ message: "Error creating Razorpay order" });
  }
});


// =====================================================
// 2️⃣ VERIFY PAYMENT (VERY IMPORTANT)
// =====================================================
router.post("/verify", auth, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
      category
    } = req.body;

    // 🔐 Signature Verification
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // ✅ Save successful payment
    await Payment.create({
      userId: req.user.id,
      amount,
      category: category || "general",
      type: "single",
      razorpayPaymentId: razorpay_payment_id,
      date: new Date(),
    });

    res.json({ message: "Payment verified & saved successfully!" });

  } catch (err) {
    console.error("Payment Verification Error:", err);
    res.status(500).json({ message: "Payment verification failed" });
  }
});


// =====================================================
// 3️⃣ AUTO PAYMENT
// =====================================================
router.post("/auto", auth, async (req, res) => {
  try {
    const fixedAmount = 500;

    await Payment.create({
      userId: req.user.id,
      amount: fixedAmount,
      category: "general",
      type: "auto",
      date: new Date(),
    });

    res.json({ message: "Auto Payment ₹500 saved successfully!" });

  } catch (err) {
    console.error("Auto Payment Error:", err);
    res.status(500).json({ message: "Error saving auto payment" });
  }
});


// =====================================================
// 4️⃣ USER PAYMENT HISTORY
// =====================================================
router.get("/history", auth, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.id })
      .sort({ date: -1 });

    res.json(payments || []);

  } catch (err) {
    console.error("Payment History Error:", err);
    res.status(500).json({ message: "Error fetching payment history" });
  }
});


// =====================================================
// 5️⃣ ADMIN REPORT
// =====================================================
router.get("/report", auth, adminOnly, async (req, res) => {
  try {
    const payments = await Payment.find();

    const totalCollection =
      payments.reduce((sum, p) => sum + p.amount, 0) || 0;

    const zakatCollection =
      payments
        .filter(p => p.category === "zakat")
        .reduce((sum, p) => sum + p.amount, 0) || 0;

    const generalCollection = totalCollection - zakatCollection;

    res.json({
      totalCollection,
      zakatCollection,
      generalCollection,
      totalPayments: payments.length || 0,
    });

  } catch (err) {
    console.error("Admin Report Error:", err);
    res.status(500).json({ message: "Error generating admin report" });
  }
});


export default router;