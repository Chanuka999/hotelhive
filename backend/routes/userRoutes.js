const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const { getAdminAnalytics } = require("../controllers/userController");

router.get("/admin/analytics", protect, authorize("admin"), getAdminAnalytics);

// Route placeholders
router.get("/", (req, res) => {
  res.json({ message: "Get all users route (Admin only)" });
});

router.get("/:id", (req, res) => {
  res.json({ message: "Get user by ID route" });
});

router.put("/:id", (req, res) => {
  res.json({ message: "Update user route" });
});

router.delete("/:id", (req, res) => {
  res.json({ message: "Delete user route" });
});

module.exports = router;
