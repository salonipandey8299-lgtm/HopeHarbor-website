import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  userId:{type:mongoose.Schema.Types.ObjectId,ref:"User"},
  amount:Number,
  type:{type:String,default:"single"}, // single or auto
  category:{type:String,default:"general"}, // zakat or donation
  date:{type:Date,default:Date.now}
});

export default mongoose.model("Payment",paymentSchema);