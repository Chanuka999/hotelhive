const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

exports.getAdminAnalytics = asyncHandler(async (req, res) => {
  const [
    totalBookings,
    totalHotels,
    revenueRows,
    topRatedHotels,
    mostBookedHotels,
    bookingsByStatus,
    monthlyRevenue,
  ] = await Promise.all([
    Booking.countDocuments(),
    Hotel.countDocuments({ isActive: true }),
    Booking.aggregate([
      {
        $match: {
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
    ]),
    Hotel.find({ isActive: true })
      .sort({ averageRating: -1, totalReviews: -1 })
      .limit(5)
      .select("name averageRating totalReviews"),
    Booking.aggregate([
      {
        $match: {
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: "$hotel",
          bookingsCount: { $sum: 1 },
          revenue: { $sum: "$totalPrice" },
        },
      },
      {
        $lookup: {
          from: "hotels",
          localField: "_id",
          foreignField: "_id",
          as: "hotel",
        },
      },
      {
        $unwind: "$hotel",
      },
      {
        $project: {
          _id: 0,
          hotelId: "$hotel._id",
          hotelName: "$hotel.name",
          bookingsCount: 1,
          revenue: 1,
        },
      },
      {
        $sort: {
          bookingsCount: -1,
        },
      },
      {
        $limit: 5,
      },
    ]),
    Booking.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          status: "$_id",
          count: 1,
        },
      },
    ]),
    Booking.aggregate([
      {
        $match: {
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$totalPrice" },
          bookings: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          revenue: 1,
          bookings: 1,
        },
      },
    ]),
  ]);

  const totalRevenue = revenueRows[0]?.totalRevenue || 0;

  const chartMonthlyRevenue = monthlyRevenue.map((row) => ({
    label: `${String(row.month).padStart(2, "0")}/${String(row.year).slice(-2)}`,
    revenue: row.revenue,
    bookings: row.bookings,
  }));

  res.status(200).json({
    success: true,
    data: {
      totals: {
        totalBookings,
        totalHotels,
        totalRevenue,
      },
      topRatedHotels,
      mostBookedHotels,
      bookingsByStatus,
      monthlyRevenue: chartMonthlyRevenue,
    },
  });
});
