import express from "express";
import User from "../models/User.js";
import auth,{isAdmin} from "../middleware/auth.js";

const router = express.Router();

router.get("/profile",auth,async(req,res)=>{
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
});

router.get("/admin",auth,isAdmin,async(req,res)=>{
  const users = await User.find().select("-password");
  res.json(users);
});

export default router;