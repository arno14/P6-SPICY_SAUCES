const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  if (req.method === "OPTIONS") {
    console.info("Request options always allowed");
    next();
  }
  console.log("middleware auth:", req.headers.authorization, req.body);
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, "RANDOM_TOKEN_SECRET");
    const userId = decodedToken.userId;
    if (req.body.userId && req.body.userId !== userId) {
      throw "Invalid user ID";
    } else {
      next();
    }
  } catch (e) {
    console.info("Not allowed to connect");

    res.status(401).json({
      error: new Error("Invalid request!"),
    });
  }
};
