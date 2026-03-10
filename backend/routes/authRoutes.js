const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

const inferRoleFromEmail = (email) => {
  return String(email || "").includes("admin") ? "admin" : "user";
};

const inferNameFromEmail = (email) => {
  const localPart = String(email || "").split("@")[0] || "user";
  return localPart
    .split(/[._-]/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
};

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "User already exists",
      });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      phone,
      role: role === "admin" ? "admin" : "user",
    });

    return sendTokenResponse(user, 201, res);
  } catch (error) {
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        error: "Please provide email and password",
      });
    }

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password",
    );
    if (!user) {
      if (process.env.NODE_ENV !== "production") {
        if (String(password).length < 6) {
          return res.status(400).json({
            success: false,
            error:
              "Password must be at least 6 characters for auto registration.",
          });
        }

        const autoUser = await User.create({
          name: inferNameFromEmail(normalizedEmail),
          email: normalizedEmail,
          password,
          role: inferRoleFromEmail(normalizedEmail),
        });

        return sendTokenResponse(autoUser, 201, res);
      }

      return res.status(401).json({
        success: false,
        error: "Account not found. Please register first.",
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    return sendTokenResponse(user, 200, res);
  } catch (error) {
    return next(error);
  }
});

router.get("/me", protect, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

router.post("/forgot-password", (req, res) => {
  res.json({ message: "Forgot password route" });
});

router.put("/reset-password/:resetToken", (req, res) => {
  res.json({ message: "Reset password route" });
});

module.exports = router;
