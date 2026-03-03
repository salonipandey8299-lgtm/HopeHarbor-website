import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: String,

  email: { 
    type: String, 
    unique: true 
  },

  password: String,

  role: { 
    type: String, 
    default: "user" 
  },

  // 🔐 ADD THESE TWO FIELDS
  resetToken: String,
  resetTokenExpire: Date

}, { timestamps: true });


// ✅ Password Hashing (Mongoose 7+ Safe)
userSchema.pre("save", async function () {

  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);

});


// ✅ Compare Password
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

// ✅ FIXED FOR MONGOOSE 7+
userSchema.pre("save", async function () {

  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);

});

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);

};

export default mongoose.model("User", userSchema);