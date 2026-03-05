import express from "express";
import Feedback from "../models/Feedback.js";

const router = express.Router();

// POST Feedback
router.post("/", async (req, res) => {
  try {
    const { message, name } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Feedback is required" });
    }

    const newFeedback = new Feedback({
      message,
      name: name || "Anonymous"
    });

    await newFeedback.save();

    res.json({ message: "Feedback submitted successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET All Feedback
router.get("/", async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ date: -1 });
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;   // 👈 THIS LINE MUST BE HERE