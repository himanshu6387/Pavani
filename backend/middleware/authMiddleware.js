const jwt = require("jsonwebtoken");

/*
|--------------------------------------------------------------------------
| LifeVault AI - Authentication Middleware
|--------------------------------------------------------------------------
*/

const authMiddleware = (req, res, next) => {
  try {
    // ================================================================
    // GET AUTHORIZATION HEADER
    // ================================================================

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      console.log(
        "Authentication failed: No authorization header."
      );

      return res.status(401).json({
        success: false,
        message: "Authentication required. No token provided.",
      });
    }

    // ================================================================
    // CHECK BEARER FORMAT
    // ================================================================

    if (!authHeader.startsWith("Bearer ")) {
      console.log(
        "Authentication failed: Invalid authorization format."
      );

      return res.status(401).json({
        success: false,
        message: "Invalid authorization format.",
      });
    }

    // ================================================================
    // EXTRACT TOKEN
    // ================================================================

    const token = authHeader
      .substring(7)
      .trim();

    if (!token) {
      console.log(
        "Authentication failed: Empty token."
      );

      return res.status(401).json({
        success: false,
        message: "No token found.",
      });
    }

    // ================================================================
    // JWT SECRET
    // ================================================================

    if (!process.env.JWT_SECRET) {
      console.error(
        "CRITICAL ERROR: JWT_SECRET is missing from .env"
      );

      return res.status(500).json({
        success: false,
        message:
          "Server authentication configuration error.",
      });
    }

    // ================================================================
    // VERIFY TOKEN
    // ================================================================

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // ================================================================
    // GET USER ID
    // ================================================================

    const userId =
      decoded.id ||
      decoded.userId ||
      decoded._id ||
      decoded.user?.id ||
      decoded.user?._id;

    if (!userId) {
      console.error(
        "Authentication failed: User ID missing from token."
      );

      return res.status(401).json({
        success: false,
        message:
          "Invalid authentication token.",
      });
    }

    // ================================================================
    // ATTACH USER
    // ================================================================
    //
    // IMPORTANT:
    // Existing document routes use req.user._id.
    // Existing controllers may use req.user.id.
    //
    // So we provide BOTH.
    //
    // ================================================================

    req.user = {
      ...decoded,

      id: userId,

      _id: userId,
    };

    console.log(
      "Authentication successful:",
      String(userId)
    );

    // ================================================================
    // CONTINUE
    // ================================================================

    next();

  } catch (error) {

    console.error(
      "Authentication middleware error:",
      error.message
    );

    if (
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication token has expired.",
        code: "TOKEN_EXPIRED",
      });
    }

    if (
      error.name === "JsonWebTokenError"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authentication token.",
        code: "INVALID_TOKEN",
      });
    }

    return res.status(401).json({
      success: false,
      message:
        "Authentication failed.",
    });
  }
};


// ================================================================
// COMMONJS EXPORT
// ================================================================

module.exports = authMiddleware;