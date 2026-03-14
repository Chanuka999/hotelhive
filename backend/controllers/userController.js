const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");
const Room = require("../models/Room");
const User = require("../models/User");

const staffRoles = ["staff", "staff_manager", "staff_support"];
const permissionList = [
  "manage_bookings",
  "manage_reviews",
  "manage_payments",
  "manage_rooms",
  "manage_customers",
  "view_reports",
];

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

exports.getAdminAnalytics = asyncHandler(async (req, res) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const lastMonthDate = new Date(currentYear, now.getMonth() - 1, 1);
  const lastMonthYear = lastMonthDate.getFullYear();
  const lastMonth = lastMonthDate.getMonth() + 1;

  const [
    totalBookings,
    totalHotels,
    totalCustomers,
    roomTotals,
    revenueRows,
    thisMonthRows,
    lastMonthRows,
    topRatedHotels,
    mostBookedHotels,
    bookingsByStatus,
    monthlyRevenue,
  ] = await Promise.all([
    Booking.countDocuments(),
    Hotel.countDocuments({ isActive: true }),
    User.countDocuments({ role: "user" }),
    Room.aggregate([
      {
        $match: {
          isActive: true,
        },
      },
      {
        $group: {
          _id: null,
          totalRooms: { $sum: "$totalRooms" },
          availableRooms: { $sum: "$availableRooms" },
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
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
          bookingsCount: { $sum: 1 },
        },
      },
    ]),
    Booking.aggregate([
      {
        $match: {
          status: { $ne: "cancelled" },
          $expr: {
            $and: [
              { $eq: [{ $year: "$createdAt" }, currentYear] },
              { $eq: [{ $month: "$createdAt" }, currentMonth] },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
    ]),
    Booking.aggregate([
      {
        $match: {
          status: { $ne: "cancelled" },
          $expr: {
            $and: [
              { $eq: [{ $year: "$createdAt" }, lastMonthYear] },
              { $eq: [{ $month: "$createdAt" }, lastMonth] },
            ],
          },
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
  const bookingsCountForRevenue = revenueRows[0]?.bookingsCount || 0;
  const totalRooms = roomTotals[0]?.totalRooms || 0;
  const availableRooms = roomTotals[0]?.availableRooms || 0;
  const occupiedRooms = Math.max(0, totalRooms - availableRooms);

  const thisMonthRevenue = thisMonthRows[0]?.totalRevenue || 0;
  const lastMonthRevenue = lastMonthRows[0]?.totalRevenue || 0;
  const revenueGrowthPercent =
    lastMonthRevenue > 0
      ? Number(
          (
            ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) *
            100
          ).toFixed(2),
        )
      : thisMonthRevenue > 0
        ? 100
        : 0;

  const averageBookingValue = bookingsCountForRevenue
    ? Number((totalRevenue / bookingsCountForRevenue).toFixed(2))
    : 0;

  const occupancyRate = totalRooms
    ? Number(((occupiedRooms / totalRooms) * 100).toFixed(2))
    : 0;

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
        totalCustomers,
        totalRooms,
        totalRevenue,
      },
      revenueStats: {
        thisMonthRevenue,
        lastMonthRevenue,
        revenueGrowthPercent,
        averageBookingValue,
        occupancyRate,
      },
      topRatedHotels,
      mostBookedHotels,
      bookingsByStatus,
      monthlyRevenue: chartMonthlyRevenue,
    },
  });
});

exports.getAdminReports = asyncHandler(async (req, res) => {
  const [
    monthlyRevenueRows,
    revenueByHotel,
    statusBreakdown,
    monthlyTrendRows,
    roomSummaryRows,
    occupancyByHotelRows,
  ] = await Promise.all([
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
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
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
          _id: "$hotel",
          revenue: { $sum: "$totalPrice" },
          bookings: { $sum: 1 },
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
          revenue: 1,
          bookings: 1,
        },
      },
      {
        $sort: {
          revenue: -1,
        },
      },
      {
        $limit: 8,
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
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            status: "$status",
          },
          bookings: { $sum: 1 },
          roomsRequested: { $sum: "$numberOfRooms" },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]),
    Room.aggregate([
      {
        $match: {
          isActive: true,
        },
      },
      {
        $group: {
          _id: null,
          totalRooms: { $sum: "$totalRooms" },
          availableRooms: { $sum: "$availableRooms" },
        },
      },
    ]),
    Room.aggregate([
      {
        $match: {
          isActive: true,
        },
      },
      {
        $group: {
          _id: "$hotel",
          totalRooms: { $sum: "$totalRooms" },
          availableRooms: { $sum: "$availableRooms" },
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
          totalRooms: 1,
          availableRooms: 1,
          occupiedRooms: { $subtract: ["$totalRooms", "$availableRooms"] },
        },
      },
      {
        $sort: {
          occupiedRooms: -1,
        },
      },
      {
        $limit: 8,
      },
    ]),
  ]);

  const totalRevenue = monthlyRevenueRows.reduce(
    (sum, row) => sum + row.revenue,
    0,
  );

  const monthlyRevenue = monthlyRevenueRows.map((row) => ({
    label: `${String(row._id.month).padStart(2, "0")}/${String(row._id.year).slice(-2)}`,
    revenue: row.revenue,
  }));

  const trendMap = monthlyTrendRows.reduce((acc, row) => {
    const label = `${String(row._id.month).padStart(2, "0")}/${String(row._id.year).slice(-2)}`;
    if (!acc[label]) {
      acc[label] = {
        label,
        totalBookings: 0,
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
        roomsRequested: 0,
      };
    }

    acc[label].totalBookings += row.bookings;
    acc[label].roomsRequested += row.roomsRequested;
    if (acc[label][row._id.status] !== undefined) {
      acc[label][row._id.status] += row.bookings;
    }

    return acc;
  }, {});

  const monthlyBookingTrends = Object.values(trendMap);

  const roomSummary = roomSummaryRows[0] || {
    totalRooms: 0,
    availableRooms: 0,
  };
  const occupiedRooms = Math.max(
    0,
    roomSummary.totalRooms - roomSummary.availableRooms,
  );
  const occupancyRate = roomSummary.totalRooms
    ? Number(((occupiedRooms / roomSummary.totalRooms) * 100).toFixed(2))
    : 0;

  const occupancyByHotel = occupancyByHotelRows.map((row) => ({
    ...row,
    occupancyRate: row.totalRooms
      ? Number(((row.occupiedRooms / row.totalRooms) * 100).toFixed(2))
      : 0,
  }));

  res.status(200).json({
    success: true,
    data: {
      revenue: {
        totalRevenue,
        monthlyRevenue,
        revenueByHotel,
      },
      occupancy: {
        totalRooms: roomSummary.totalRooms,
        availableRooms: roomSummary.availableRooms,
        occupiedRooms,
        occupancyRate,
        occupancyByHotel,
      },
      bookingTrends: {
        statusBreakdown,
        monthly: monthlyBookingTrends,
      },
    },
  });
});

exports.getAllCustomers = asyncHandler(async (req, res) => {
  const customers = await User.find({ role: "user" })
    .select("name email phone isBlocked isVerified createdAt")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: customers.length,
    data: customers,
  });
});

exports.blockCustomer = asyncHandler(async (req, res, next) => {
  const customer = await User.findById(req.params.id);

  if (!customer) {
    const error = new Error("Customer not found");
    error.statusCode = 404;
    return next(error);
  }

  if (customer.role === "admin") {
    const error = new Error("Cannot block admin accounts");
    error.statusCode = 400;
    return next(error);
  }

  const blocked =
    typeof req.body?.blocked === "boolean" ? req.body.blocked : true;
  customer.isBlocked = blocked;
  await customer.save();

  res.status(200).json({
    success: true,
    data: {
      _id: customer._id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      isBlocked: customer.isBlocked,
      isVerified: customer.isVerified,
      createdAt: customer.createdAt,
    },
  });
});

exports.deleteCustomer = asyncHandler(async (req, res, next) => {
  const customer = await User.findById(req.params.id);

  if (!customer) {
    const error = new Error("Customer not found");
    error.statusCode = 404;
    return next(error);
  }

  if (customer.role === "admin") {
    const error = new Error("Cannot delete admin accounts");
    error.statusCode = 400;
    return next(error);
  }

  await User.findByIdAndDelete(customer._id);

  res.status(200).json({
    success: true,
    data: {},
  });
});

exports.getStaffMembers = asyncHandler(async (req, res) => {
  const staff = await User.find({ role: { $in: staffRoles } })
    .select("name email phone role permissions isBlocked createdAt")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: staff.length,
    data: staff,
  });
});

exports.addStaffMember = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone, role, permissions } = req.body;
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();

  if (!name || !normalizedEmail || !password) {
    const error = new Error("name, email and password are required");
    error.statusCode = 400;
    return next(error);
  }

  if (!staffRoles.includes(role)) {
    const error = new Error(
      "role must be one of: staff, staff_manager, staff_support",
    );
    error.statusCode = 400;
    return next(error);
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error("User already exists with this email");
    error.statusCode = 400;
    return next(error);
  }

  const normalizedPermissions = Array.isArray(permissions)
    ? permissions.filter((value) => permissionList.includes(value))
    : [];

  const staff = await User.create({
    name,
    email: normalizedEmail,
    password,
    phone,
    role,
    permissions: normalizedPermissions,
    isBlocked: false,
  });

  res.status(201).json({
    success: true,
    data: {
      _id: staff._id,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      role: staff.role,
      permissions: staff.permissions,
      isBlocked: staff.isBlocked,
      createdAt: staff.createdAt,
    },
  });
});

exports.updateStaffAccess = asyncHandler(async (req, res, next) => {
  const staff = await User.findById(req.params.id);

  if (!staff) {
    const error = new Error("Staff member not found");
    error.statusCode = 404;
    return next(error);
  }

  if (!staffRoles.includes(staff.role)) {
    const error = new Error("Selected user is not a staff member");
    error.statusCode = 400;
    return next(error);
  }

  if (req.body.role !== undefined) {
    if (!staffRoles.includes(req.body.role)) {
      const error = new Error("Invalid staff role");
      error.statusCode = 400;
      return next(error);
    }
    staff.role = req.body.role;
  }

  if (req.body.permissions !== undefined) {
    if (!Array.isArray(req.body.permissions)) {
      const error = new Error("permissions must be an array");
      error.statusCode = 400;
      return next(error);
    }

    staff.permissions = req.body.permissions.filter((value) =>
      permissionList.includes(value),
    );
  }

  if (typeof req.body.isBlocked === "boolean") {
    staff.isBlocked = req.body.isBlocked;
  }

  await staff.save();

  res.status(200).json({
    success: true,
    data: {
      _id: staff._id,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      role: staff.role,
      permissions: staff.permissions,
      isBlocked: staff.isBlocked,
      createdAt: staff.createdAt,
    },
  });
});

exports.deleteStaffMember = asyncHandler(async (req, res, next) => {
  const staff = await User.findById(req.params.id);

  if (!staff) {
    const error = new Error("Staff member not found");
    error.statusCode = 404;
    return next(error);
  }

  if (!staffRoles.includes(staff.role)) {
    const error = new Error("Selected user is not a staff member");
    error.statusCode = 400;
    return next(error);
  }

  await User.findByIdAndDelete(staff._id);

  res.status(200).json({
    success: true,
    data: {},
  });
});
