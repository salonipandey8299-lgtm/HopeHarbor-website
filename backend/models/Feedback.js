import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const Feedback = mongoose.model("Feedback", feedbackSchema);

export default Feedback;   // 👈 THIS LINE IS IMPORTANT