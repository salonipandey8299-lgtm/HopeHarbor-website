import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";

const router = express.Router();

router.post("/register", async(req,res)=>{
  const {name,email,password} = req.body;
  const exist = await User.findOne({email});
  if(exist) return res.status(400).json({message:"Email Exists"});

  const user = await User.create({name,email,password});

  const token = jwt.sign(
    {id:user._id,role:user.role},
    process.env.JWT_SECRET,
    {expiresIn:"1d"}
  );

  res.json({token});
});

router.post("/login", async(req,res)=>{
  const {email,password} = req.body;
  const user = await User.findOne({email});
  if(!user) return res.status(400).json({message:"Not Found"});

  const match = await user.comparePassword(password);
  if(!match) return res.status(400).json({message:"Wrong Password"});

  const token = jwt.sign(
    {id:user._id,role:user.role},
    process.env.JWT_SECRET,
    {expiresIn:"1d"}
  );

  res.json({token});
});
// ===== FORGOT PASSWORD =====
router.post("/forgot", async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate reset token
        const token = crypto.randomBytes(32).toString("hex");
        user.resetToken = token;
        user.resetTokenExpire = Date.now() + 3600000; // 1 hour
        await user.save();

        // Create transporter
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const resetLink = `http://localhost:3000/reset/${token}`;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Password Reset",
            html: `<h3>Click below to reset password</h3>
                   <a href="${resetLink}">${resetLink}</a>`
        });

        res.json({ message: "Reset email sent successfully" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;