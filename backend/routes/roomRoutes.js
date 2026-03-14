const express = require("express");
const router = express.Router();
const {
  getRoomsByHotel,
  createRoom,
  updateRoom,
  deleteRoom,
} = require("../controllers/roomController");
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.get("/hotel/:hotelId", protect, authorize("admin"), getRoomsByHotel);
router.post(
  "/hotel/:hotelId",
  protect,
  authorize("admin"),
  upload.array("images", 8),
  createRoom,
);
router.put(
  "/:id",
  protect,
  authorize("admin"),
  upload.array("images", 8),
  updateRoom,
);
router.delete("/:id", protect, authorize("admin"), deleteRoom);

module.exports = router;
