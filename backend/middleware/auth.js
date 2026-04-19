const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }
  try {
    req.user = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

module.exports = { authenticate, requireAdmin };
