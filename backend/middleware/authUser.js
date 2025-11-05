import jwt from "jsonwebtoken";

// user authentication middleware
const authUser = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Not Authorized. Login Again.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.body.userId = decoded.id; // Attach userId to the request
    next();
  } catch (error) {
    console.log(error);
    res.status(403).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export default authUser;
