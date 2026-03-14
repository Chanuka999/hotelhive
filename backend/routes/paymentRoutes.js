const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  createPaymentIntent,
  getUserPaymentHistory,
  getBookingInvoice,
  getPaymentsAdmin,
  refundPayment,
  getFinancialReports,
  handleStripeWebhook,
} = require("../controllers/paymentController");

router.post("/create-payment-intent", protect, createPaymentIntent);
router.get("/history", protect, getUserPaymentHistory);
router.get("/invoice/:bookingId", protect, getBookingInvoice);
router.get("/admin", protect, authorize("admin"), getPaymentsAdmin);
router.patch(
  "/admin/:bookingId/refund",
  protect,
  authorize("admin"),
  refundPayment,
);
router.get("/admin/reports", protect, authorize("admin"), getFinancialReports);

router.post("/webhook", handleStripeWebhook);

module.exports = router;
