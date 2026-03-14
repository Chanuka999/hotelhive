const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  getReviewsByHotel,
  getAllReviewsAdmin,
  createReview,
  updateReview,
  deleteReview,
  deleteInappropriateReview,
} = require("../controllers/reviewController");

router.get("/hotel/:hotelId", getReviewsByHotel);
router.get("/admin/all", protect, authorize("admin"), getAllReviewsAdmin);
router.post("/", protect, createReview);
router.put("/:id", protect, updateReview);
router.delete("/:id", protect, deleteReview);
router.delete(
  "/admin/:id",
  protect,
  authorize("admin"),
  deleteInappropriateReview,
);

module.exports = router;
