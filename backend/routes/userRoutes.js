const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  getAdminAnalytics,
  getAdminReports,
  getAllCustomers,
  blockCustomer,
  deleteCustomer,
  getStaffMembers,
  addStaffMember,
  updateStaffAccess,
  deleteStaffMember,
} = require("../controllers/userController");

router.get("/admin/analytics", protect, authorize("admin"), getAdminAnalytics);
router.get("/admin/reports", protect, authorize("admin"), getAdminReports);
router.get("/admin/customers", protect, authorize("admin"), getAllCustomers);
router.patch(
  "/admin/customers/:id/block",
  protect,
  authorize("admin"),
  blockCustomer,
);
router.delete(
  "/admin/customers/:id",
  protect,
  authorize("admin"),
  deleteCustomer,
);
router.get("/admin/staff", protect, authorize("admin"), getStaffMembers);
router.post("/admin/staff", protect, authorize("admin"), addStaffMember);
router.patch(
  "/admin/staff/:id",
  protect,
  authorize("admin"),
  updateStaffAccess,
);
router.delete(
  "/admin/staff/:id",
  protect,
  authorize("admin"),
  deleteStaffMember,
);

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
