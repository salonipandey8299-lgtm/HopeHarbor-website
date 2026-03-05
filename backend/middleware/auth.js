import jwt from "jsonwebtoken";

export default function auth(req,res,next){
  const token = req.headers.authorization?.split(" ")[1];
  if(!token) return res.status(401).json({message:"No Token"});

  try{
    const decoded = jwt.verify(token,process.env.JWT_SECRET);
    req.user = decoded;
    next();
  }catch{
    res.status(401).json({message:"Invalid Token"});
  }
}

export default function adminOnly(req, res, next) {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access only" });
    }
    next();
}