const express = require("express");
const router = express.Router();

// Route placeholders
router.get("/hotel/:hotelId", (req, res) => {
  res.json({ message: "Get reviews for hotel route" });
});

router.post("/", (req, res) => {
  res.json({ message: "Create review route" });
});

router.put("/:id", (req, res) => {
  res.json({ message: "Update review route" });
});

router.delete("/:id", (req, res) => {
  res.json({ message: "Delete review route" });
});

module.exports = router;
