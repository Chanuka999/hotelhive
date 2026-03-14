const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");
const Room = require("../models/Room");

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const parseDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const calculateNights = (checkIn, checkOut) => {
  const diff = checkOut.getTime() - checkIn.getTime();
  const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return Math.max(1, nights);
};

const applyBookingStatus = async (booking, nextStatus, reason = "") => {
  const wasCancelled = booking.status === "cancelled";
  const willBeCancelled = nextStatus === "cancelled";

  if (wasCancelled === willBeCancelled) {
    booking.status = nextStatus;
    if (willBeCancelled) {
      booking.cancelledAt = booking.cancelledAt || new Date();
      booking.cancellationReason = reason || booking.cancellationReason;
    }
    if (!willBeCancelled) {
      booking.cancelledAt = undefined;
      booking.cancellationReason = undefined;
    }
    return booking.save();
  }

  const room = await Room.findById(booking.room);
  if (!room) {
    const error = new Error("Assigned room not found");
    error.statusCode = 404;
    throw error;
  }

  if (willBeCancelled) {
    room.availableRooms = Math.min(
      room.totalRooms,
      room.availableRooms + booking.numberOfRooms,
    );
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason || booking.cancellationReason;
  } else {
    if (room.availableRooms < booking.numberOfRooms) {
      const error = new Error(
        "Not enough room availability to restore booking",
      );
      error.statusCode = 400;
      throw error;
    }
    room.availableRooms -= booking.numberOfRooms;
    booking.cancelledAt = undefined;
    booking.cancellationReason = undefined;
  }

  booking.status = nextStatus;
  await room.save();
  return booking.save();
};

exports.getUserBookings = asyncHandler(async (req, res) => {
  const filter = req.user.role === "admin" ? {} : { user: req.user._id };

  const bookings = await Booking.find(filter)
    .populate("hotel", "name address.city address.country")
    .populate("room", "roomType price")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings,
  });
});

exports.getAllBookingsAdmin = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({})
    .populate("user", "name email")
    .populate("hotel", "name")
    .populate("room", "roomType price")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings,
  });
});

exports.getBookingById = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id)
    .populate("user", "name email")
    .populate("hotel", "name")
    .populate("room", "roomType price");

  if (!booking) {
    const error = new Error("Booking not found");
    error.statusCode = 404;
    return next(error);
  }

  const isOwner = booking.user?._id.toString() === req.user._id.toString();
  if (req.user.role !== "admin" && !isOwner) {
    const error = new Error("Not authorized to view this booking");
    error.statusCode = 403;
    return next(error);
  }

  res.status(200).json({
    success: true,
    data: booking,
  });
});

exports.createBooking = asyncHandler(async (req, res, next) => {
  const {
    hotel: hotelId,
    room: requestedRoomId,
    checkIn,
    checkOut,
    guests,
    numberOfRooms,
    specialRequests,
  } = req.body;

  const hotel = await Hotel.findById(hotelId);
  if (!hotel || !hotel.isActive) {
    const error = new Error("Hotel not found");
    error.statusCode = 404;
    return next(error);
  }

  const startDate = parseDate(checkIn);
  const endDate = parseDate(checkOut);
  if (!startDate || !endDate || endDate <= startDate) {
    const error = new Error("Invalid check-in or check-out date");
    error.statusCode = 400;
    return next(error);
  }

  const roomsCount = Math.max(1, Number(numberOfRooms) || 1);

  let room;
  if (requestedRoomId) {
    room = await Room.findOne({
      _id: requestedRoomId,
      hotel: hotel._id,
      isActive: true,
    });
  } else {
    room = await Room.findOne({
      hotel: hotel._id,
      isActive: true,
      availableRooms: { $gte: roomsCount },
    }).sort({ price: 1 });
  }

  if (!room) {
    const error = new Error("No room available for this hotel");
    error.statusCode = 404;
    return next(error);
  }

  if (room.availableRooms < roomsCount) {
    const error = new Error("Not enough available rooms");
    error.statusCode = 400;
    return next(error);
  }

  const nights = calculateNights(startDate, endDate);
  const discountFactor = 1 - (Number(hotel.discountPercent) || 0) / 100;
  const totalPrice = Math.max(
    0,
    room.price * roomsCount * nights * discountFactor,
  );

  const booking = await Booking.create({
    user: req.user._id,
    hotel: hotel._id,
    room: room._id,
    checkIn: startDate,
    checkOut: endDate,
    guests: {
      adults: Math.max(1, Number(guests?.adults) || 1),
      children: Math.max(0, Number(guests?.children) || 0),
    },
    numberOfRooms: roomsCount,
    totalPrice: Number(totalPrice.toFixed(2)),
    specialRequests,
  });

  room.availableRooms -= roomsCount;
  await room.save();

  const populatedBooking = await Booking.findById(booking._id)
    .populate("hotel", "name")
    .populate("room", "roomType price");

  res.status(201).json({
    success: true,
    data: populatedBooking,
  });
});

exports.cancelBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    const error = new Error("Booking not found");
    error.statusCode = 404;
    return next(error);
  }

  const isOwner = booking.user.toString() === req.user._id.toString();
  if (req.user.role !== "admin" && !isOwner) {
    const error = new Error("Not authorized to cancel this booking");
    error.statusCode = 403;
    return next(error);
  }

  await applyBookingStatus(
    booking,
    "cancelled",
    req.body?.cancellationReason || "Cancelled by user",
  );

  res.status(200).json({
    success: true,
    data: booking,
  });
});

exports.modifyUserBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    const error = new Error("Booking not found");
    error.statusCode = 404;
    return next(error);
  }

  const isOwner = booking.user.toString() === req.user._id.toString();
  if (req.user.role !== "admin" && !isOwner) {
    const error = new Error("Not authorized to modify this booking");
    error.statusCode = 403;
    return next(error);
  }

  if (["cancelled", "completed"].includes(booking.status)) {
    const error = new Error("This booking cannot be modified");
    error.statusCode = 400;
    return next(error);
  }

  if (booking.paymentStatus === "paid") {
    const error = new Error("Paid bookings cannot be modified");
    error.statusCode = 400;
    return next(error);
  }

  const room = await Room.findById(booking.room);
  if (!room) {
    const error = new Error("Assigned room not found");
    error.statusCode = 404;
    return next(error);
  }

  const hotel = await Hotel.findById(booking.hotel);
  const discountFactor = 1 - (Number(hotel?.discountPercent) || 0) / 100;

  const nextCheckIn = req.body?.checkIn
    ? parseDate(req.body.checkIn)
    : booking.checkIn;
  const nextCheckOut = req.body?.checkOut
    ? parseDate(req.body.checkOut)
    : booking.checkOut;

  if (!nextCheckIn || !nextCheckOut || nextCheckOut <= nextCheckIn) {
    const error = new Error("Invalid check-in or check-out date");
    error.statusCode = 400;
    return next(error);
  }

  const currentRooms = Math.max(1, Number(booking.numberOfRooms) || 1);
  const requestedRooms = req.body?.numberOfRooms;
  const nextRooms = requestedRooms
    ? Math.max(1, Number(requestedRooms) || 1)
    : currentRooms;

  const roomDelta = nextRooms - currentRooms;
  if (roomDelta > 0) {
    if (room.availableRooms < roomDelta) {
      const error = new Error("Not enough available rooms for modification");
      error.statusCode = 400;
      return next(error);
    }
    room.availableRooms -= roomDelta;
  } else if (roomDelta < 0) {
    room.availableRooms = Math.min(
      room.totalRooms,
      room.availableRooms + Math.abs(roomDelta),
    );
  }

  const nights = calculateNights(nextCheckIn, nextCheckOut);
  const totalPrice = Math.max(
    0,
    room.price * nextRooms * nights * discountFactor,
  );

  booking.checkIn = nextCheckIn;
  booking.checkOut = nextCheckOut;
  booking.numberOfRooms = nextRooms;
  booking.guests = {
    adults: Math.max(
      1,
      Number(req.body?.guests?.adults) || Number(booking.guests?.adults) || 1,
    ),
    children: Math.max(
      0,
      Number.isFinite(Number(req.body?.guests?.children))
        ? Number(req.body.guests.children)
        : Number(booking.guests?.children) || 0,
    ),
  };

  if (typeof req.body?.specialRequests === "string") {
    booking.specialRequests = req.body.specialRequests;
  }

  booking.totalPrice = Number(totalPrice.toFixed(2));

  await room.save();
  await booking.save();

  const populatedBooking = await Booking.findById(booking._id)
    .populate("hotel", "name address.city address.country")
    .populate("room", "roomType price");

  res.status(200).json({
    success: true,
    data: populatedBooking,
  });
});

exports.approveBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    const error = new Error("Booking not found");
    error.statusCode = 404;
    return next(error);
  }

  await applyBookingStatus(booking, "confirmed");

  res.status(200).json({
    success: true,
    data: booking,
  });
});

exports.updateBookingStatus = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    const error = new Error("Booking not found");
    error.statusCode = 404;
    return next(error);
  }

  const status = req.body?.status;
  const allowedStatuses = ["pending", "confirmed", "cancelled", "completed"];

  if (!allowedStatuses.includes(status)) {
    const error = new Error("Invalid booking status");
    error.statusCode = 400;
    return next(error);
  }

  await applyBookingStatus(
    booking,
    status,
    req.body?.cancellationReason || "Cancelled by admin",
  );

  res.status(200).json({
    success: true,
    data: booking,
  });
});
