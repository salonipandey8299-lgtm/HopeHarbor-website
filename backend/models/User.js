import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  email: { 
    type: String, 
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: true
  },

  role: { 
    type: String, 
    default: "user",
    enum: ["user", "admin"]
  },

}, { timestamps: true });

// ===== PASSWORD HASHING =====
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// ===== COMPARE PASSWORD =====
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// ===== EXPORT MODEL =====
export default mongoose.model("User", userSchema);