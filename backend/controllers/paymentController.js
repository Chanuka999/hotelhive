const Booking = require("../models/Booking");

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const createFakePaymentId = () =>
  `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const createFakeRefundId = () =>
  `refund_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

exports.createPaymentIntent = asyncHandler(async (req, res, next) => {
  const bookingId = req.body?.bookingId;
  const paymentMethodRaw = String(
    req.body?.paymentMethod || "stripe",
  ).toLowerCase();
  const paymentMethod = ["stripe", "paypal", "card"].includes(paymentMethodRaw)
    ? paymentMethodRaw
    : "stripe";

  if (!bookingId) {
    const error = new Error("bookingId is required");
    error.statusCode = 400;
    return next(error);
  }

  const booking = await Booking.findById(bookingId);

  if (!booking) {
    const error = new Error("Booking not found");
    error.statusCode = 404;
    return next(error);
  }

  const isOwner = booking.user.toString() === req.user._id.toString();
  if (req.user.role !== "admin" && !isOwner) {
    const error = new Error("Not authorized to process this payment");
    error.statusCode = 403;
    return next(error);
  }

  if (booking.paymentStatus === "paid") {
    const error = new Error("Booking is already paid");
    error.statusCode = 400;
    return next(error);
  }

  if (booking.paymentStatus === "refunded") {
    const error = new Error("Booking payment has already been refunded");
    error.statusCode = 400;
    return next(error);
  }

  booking.paymentStatus = "paid";
  booking.paymentInfo = {
    ...(booking.paymentInfo || {}),
    paymentId: createFakePaymentId(),
    paymentMethod,
    paidAt: new Date(),
    refundedAt: undefined,
    refundId: undefined,
  };
  await booking.save();

  res.status(200).json({
    success: true,
    data: {
      bookingId: booking._id,
      paymentStatus: booking.paymentStatus,
      paymentInfo: booking.paymentInfo,
      paymentGateway: paymentMethod,
      clientSecret: `mock_secret_${booking._id}`,
    },
  });
});

exports.getUserPaymentHistory = asyncHandler(async (req, res) => {
  const payments = await Booking.find({ user: req.user._id })
    .populate("hotel", "name")
    .populate("room", "roomType")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: payments.length,
    data: payments,
  });
});

exports.getBookingInvoice = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.bookingId)
    .populate("user", "name email")
    .populate("hotel", "name address.city address.country")
    .populate("room", "roomType");

  if (!booking) {
    const error = new Error("Booking not found");
    error.statusCode = 404;
    return next(error);
  }

  const isOwner = booking.user?._id.toString() === req.user._id.toString();
  if (req.user.role !== "admin" && !isOwner) {
    const error = new Error("Not authorized to view this invoice");
    error.statusCode = 403;
    return next(error);
  }

  const nights = Math.max(
    1,
    Math.ceil(
      (new Date(booking.checkOut).getTime() -
        new Date(booking.checkIn).getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );

  res.status(200).json({
    success: true,
    data: {
      invoiceNumber: `INV-${booking._id.toString().slice(-8).toUpperCase()}`,
      issuedAt: new Date(),
      bookingId: booking._id,
      customer: {
        name: booking.user?.name || "Customer",
        email: booking.user?.email || "N/A",
      },
      hotel: {
        name: booking.hotel?.name || "N/A",
        city: booking.hotel?.address?.city || "N/A",
        country: booking.hotel?.address?.country || "N/A",
      },
      room: {
        type: booking.room?.roomType || "N/A",
      },
      stay: {
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        nights,
      },
      guests: booking.guests,
      totals: {
        amount: booking.totalPrice,
        currency: "USD",
      },
      payment: {
        status: booking.paymentStatus,
        paymentId: booking.paymentInfo?.paymentId || null,
        method: booking.paymentInfo?.paymentMethod || null,
        paidAt: booking.paymentInfo?.paidAt || null,
      },
    },
  });
});

exports.getPaymentsAdmin = asyncHandler(async (req, res) => {
  const status = req.query?.status;
  const query = {};

  if (["pending", "paid", "refunded"].includes(status)) {
    query.paymentStatus = status;
  }

  const payments = await Booking.find(query)
    .populate("user", "name email")
    .populate("hotel", "name")
    .populate("room", "roomType")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: payments.length,
    data: payments,
  });
});

exports.refundPayment = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.bookingId)
    .populate("user", "name email")
    .populate("hotel", "name");

  if (!booking) {
    const error = new Error("Payment record not found");
    error.statusCode = 404;
    return next(error);
  }

  if (booking.paymentStatus !== "paid") {
    const error = new Error("Only paid bookings can be refunded");
    error.statusCode = 400;
    return next(error);
  }

  booking.paymentStatus = "refunded";
  booking.paymentInfo = {
    ...(booking.paymentInfo || {}),
    refundedAt: new Date(),
    refundId: createFakeRefundId(),
  };
  await booking.save();

  res.status(200).json({
    success: true,
    data: booking,
  });
});

exports.getFinancialReports = asyncHandler(async (req, res) => {
  const [paidRows, refundedRows, totalsByStatus, monthlyRows] =
    await Promise.all([
      Booking.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
      Booking.aggregate([
        { $match: { paymentStatus: "refunded" } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
      Booking.aggregate([
        {
          $group: {
            _id: "$paymentStatus",
            count: { $sum: 1 },
            amount: { $sum: "$totalPrice" },
          },
        },
        {
          $project: {
            _id: 0,
            status: "$_id",
            count: 1,
            amount: 1,
          },
        },
        { $sort: { status: 1 } },
      ]),
      Booking.aggregate([
        { $match: { paymentStatus: { $in: ["paid", "refunded"] } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              status: "$paymentStatus",
            },
            amount: { $sum: "$totalPrice" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
    ]);

  const totalPaid = paidRows[0]?.total || 0;
  const totalRefunded = refundedRows[0]?.total || 0;

  const groupedMonthly = monthlyRows.reduce((acc, row) => {
    const key = `${row._id.year}-${row._id.month}`;
    if (!acc[key]) {
      acc[key] = {
        label: `${String(row._id.month).padStart(2, "0")}/${String(row._id.year).slice(-2)}`,
        paid: 0,
        refunded: 0,
        paidCount: 0,
        refundedCount: 0,
      };
    }

    if (row._id.status === "paid") {
      acc[key].paid = row.amount;
      acc[key].paidCount = row.count;
    } else {
      acc[key].refunded = row.amount;
      acc[key].refundedCount = row.count;
    }

    return acc;
  }, {});

  res.status(200).json({
    success: true,
    data: {
      summary: {
        totalPaid,
        totalRefunded,
        netRevenue: totalPaid - totalRefunded,
      },
      totalsByStatus,
      monthly: Object.values(groupedMonthly),
    },
  });
});

exports.handleStripeWebhook = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Webhook received",
  });
});
