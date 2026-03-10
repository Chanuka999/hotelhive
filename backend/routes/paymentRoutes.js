const express = require("express");
const router = express.Router();

// Route placeholders
router.post("/create-payment-intent", (req, res) => {
  res.json({ message: "Create payment intent route" });
});

router.post("/webhook", (req, res) => {
  res.json({ message: "Stripe webhook route" });
});

module.exports = router;
