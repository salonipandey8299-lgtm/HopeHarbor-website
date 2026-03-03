router.post("/verify", auth, async (req,res)=>{
  const { amount, category } = req.body;

  await Payment.create({
    userId: req.user.id,
    amount,
    category,
    type:"single"
  });

  res.json({ message:"Payment Verified & Saved" });
});