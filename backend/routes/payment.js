import express from "express";
import Razorpay from "razorpay";
import Payment from "../models/Payment.js";
import auth,{isAdmin} from "../middleware/auth.js";

const router = express.Router();


router.post("/single", auth, async (req, res) => {

  const Razorpay = (await import("razorpay")).default;

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "Your_key",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "your_secret_key"
  });

  const { amount } = req.body;

  const order = await razorpay.orders.create({
    amount: amount * 100,
    currency: "INR"
  });

  res.json({
    orderId: order.id,
    key: process.env.RAZORPAY_KEY_ID,
    currency: "INR"
  });
});

// Auto Payment
router.post("/auto",auth,async(req,res)=>{
  const fixedAmount = 500;
  await Payment.create({
    userId:req.user.id,
    amount:fixedAmount,
    type:"auto"
  });
  res.json({message:"Auto Payment Saved"});
});

// User Payment History
router.get("/history",auth,async(req,res)=>{
  const payments = await Payment.find({userId:req.user.id});
  res.json(payments);
});

// Admin Reports
router.get("/report",auth,isAdmin,async(req,res)=>{
  const payments = await Payment.find();

  const total = payments.reduce((a,b)=>a+b.amount,0);

  const zakat = payments
    .filter(p=>p.category==="zakat")
    .reduce((a,b)=>a+b.amount,0);

  res.json({
    totalCollection:total,
    zakatCollection:zakat,
    totalPayments:payments.length
  });
});

export default router;