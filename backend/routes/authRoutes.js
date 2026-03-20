const express = require("express");
const crypto = require("crypto");
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
      isBlocked: user.isBlocked,
      permissions: user.permissions || [],
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

const createPublicUrl = (path) => {
  const base =
    process.env.CLIENT_URL ||
    process.env.FRONTEND_URL ||
    "http://localhost:5173";
  return `${base.replace(/\/$/, "")}${path}`;
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
      isVerified: true,
    });

    const emailVerificationToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    const verificationUrl = createPublicUrl(
      `/verify-email/${emailVerificationToken}`,
    );

    const token = user.getSignedJwtToken();

    return res.status(201).json({
      success: true,
      token,
      verificationUrl,
      message:
        "Registration successful. Please verify your email using the verification link.",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked,
        isVerified: user.isVerified,
        permissions: user.permissions || [],
      },
    });
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

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        error: "Your account is blocked. Contact support.",
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

router.put("/me", protect, async (req, res, next) => {
  try {
    const updates = {};
    const { name, phone, email } = req.body;

    if (typeof name === "string" && name.trim()) {
      updates.name = name.trim();
    }

    if (typeof phone === "string") {
      updates.phone = phone.trim();
    }

    if (typeof email === "string" && email.trim()) {
      const normalizedEmail = email.trim().toLowerCase();
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing && existing._id.toString() !== req.user._id.toString()) {
        return res.status(400).json({
          success: false,
          error: "Email is already used by another account",
        });
      }

      updates.email = normalizedEmail;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/forgot-password", async (req, res, next) => {
  try {
    const normalizedEmail = String(req.body?.email || "")
      .trim()
      .toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        error: "Please provide email",
      });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If that email exists, a reset link has been generated.",
      });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = createPublicUrl(`/reset-password/${resetToken}`);

    return res.status(200).json({
      success: true,
      message: "Password reset link generated",
      resetUrl,
    });
  } catch (error) {
    return next(error);
  }
});

router.put("/reset-password/:resetToken", async (req, res, next) => {
  try {
    const tokenHash = crypto
      .createHash("sha256")
      .update(req.params.resetToken)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpire: { $gt: Date.now() },
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired reset token",
      });
    }

    const password = String(req.body?.password || "");
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters",
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return sendTokenResponse(user, 200, res);
  } catch (error) {
    return next(error);
  }
});

router.get("/verify-email/:verifyToken", async (req, res, next) => {
  try {
    const tokenHash = crypto
      .createHash("sha256")
      .update(req.params.verifyToken)
      .digest("hex");

    const user = await User.findOne({
      emailVerifyToken: tokenHash,
      emailVerifyExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired verification token",
      });
    }

    user.isVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/resend-verification", async (req, res, next) => {
  try {
    const normalizedEmail = String(req.body?.email || "")
      .trim()
      .toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(200).json({
        success: true,
        message: "Email is already verified",
      });
    }

    const emailVerificationToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: "Verification link generated",
      verificationUrl: createPublicUrl(
        `/verify-email/${emailVerificationToken}`,
      ),
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
