const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  getUserBookings,
  getAllBookingsAdmin,
  getBookingById,
  createBooking,
  cancelBooking,
  modifyUserBooking,
  approveBooking,
  updateBookingStatus,
} = require("../controllers/bookingController");

router.get("/", protect, getUserBookings);
router.get("/admin/all", protect, authorize("admin"), getAllBookingsAdmin);
router.get("/:id", protect, getBookingById);
router.post("/", protect, createBooking);
router.delete("/:id", protect, cancelBooking);
router.patch("/:id/modify", protect, modifyUserBooking);
router.patch("/:id/approve", protect, authorize("admin"), approveBooking);
router.patch("/:id/status", protect, authorize("admin"), updateBookingStatus);

module.exports = router;
