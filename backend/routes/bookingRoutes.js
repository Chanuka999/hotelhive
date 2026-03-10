const express = require("express");
const router = express.Router();

// Route placeholders
router.get("/", (req, res) => {
  res.json({ message: "Get all bookings route" });
});

router.get("/:id", (req, res) => {
  res.json({ message: "Get booking by ID route" });
});

router.post("/", (req, res) => {
  res.json({ message: "Create booking route" });
});

router.put("/:id", (req, res) => {
  res.json({ message: "Update booking route" });
});

router.delete("/:id", (req, res) => {
  res.json({ message: "Cancel booking route" });
});

module.exports = router;
