const express = require("express");
const router = express.Router();
const {
  getHotels,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel,
  searchHotels,
  updateHotelPricing,
  updateHotelDiscount,
} = require("../controllers/hotelController");
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.get("/", getHotels);
router.get("/search", searchHotels);
router.get("/:id", getHotelById);

router.post(
  "/",
  protect,
  authorize("admin"),
  upload.array("images", 8),
  createHotel,
);

router.put(
  "/:id",
  protect,
  authorize("admin"),
  upload.array("images", 8),
  updateHotel,
);

router.delete("/:id", protect, authorize("admin"), deleteHotel);
router.patch("/:id/pricing", protect, authorize("admin"), updateHotelPricing);
router.patch("/:id/discount", protect, authorize("admin"), updateHotelDiscount);

module.exports = router;
