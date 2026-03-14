const Review = require("../models/Review");
const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const refreshHotelReviewStats = async (hotelId) => {
  if (!hotelId) {
    return;
  }

  const aggregateRows = await Review.aggregate([
    { $match: { hotel: hotelId } },
    {
      $group: {
        _id: "$hotel",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (!aggregateRows.length) {
    await Hotel.findByIdAndUpdate(hotelId, {
      averageRating: 0,
      totalReviews: 0,
    });
    return;
  }

  const aggregate = aggregateRows[0];
  await Hotel.findByIdAndUpdate(hotelId, {
    averageRating: Number(aggregate.averageRating.toFixed(1)),
    totalReviews: aggregate.totalReviews,
  });
};

exports.getReviewsByHotel = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ hotel: req.params.hotelId })
    .populate("user", "name")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews,
  });
});

exports.getAllReviewsAdmin = asyncHandler(async (req, res) => {
  const reviews = await Review.find({})
    .populate("user", "name email")
    .populate("hotel", "name")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews,
  });
});

exports.createReview = asyncHandler(async (req, res, next) => {
  const { hotel, booking, rating, comment } = req.body;

  if (!hotel || !booking || !rating || !comment) {
    const error = new Error("hotel, booking, rating and comment are required");
    error.statusCode = 400;
    return next(error);
  }

  const bookingDoc = await Booking.findById(booking);
  if (!bookingDoc) {
    const error = new Error("Booking not found");
    error.statusCode = 404;
    return next(error);
  }

  const isOwner = bookingDoc.user.toString() === req.user._id.toString();
  if (req.user.role !== "admin" && !isOwner) {
    const error = new Error("Not authorized to review this booking");
    error.statusCode = 403;
    return next(error);
  }

  const review = await Review.create({
    hotel,
    booking,
    user: req.user._id,
    rating: Number(rating),
    comment,
  });

  await refreshHotelReviewStats(review.hotel);

  res.status(201).json({
    success: true,
    data: review,
  });
});

exports.updateReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    const error = new Error("Review not found");
    error.statusCode = 404;
    return next(error);
  }

  const isOwner = review.user.toString() === req.user._id.toString();
  if (req.user.role !== "admin" && !isOwner) {
    const error = new Error("Not authorized to update this review");
    error.statusCode = 403;
    return next(error);
  }

  if (req.body.rating !== undefined) {
    review.rating = Number(req.body.rating);
  }
  if (req.body.comment !== undefined) {
    review.comment = req.body.comment;
  }

  await review.save();
  await refreshHotelReviewStats(review.hotel);

  res.status(200).json({
    success: true,
    data: review,
  });
});

exports.deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    const error = new Error("Review not found");
    error.statusCode = 404;
    return next(error);
  }

  const isOwner = review.user.toString() === req.user._id.toString();
  if (req.user.role !== "admin" && !isOwner) {
    const error = new Error("Not authorized to delete this review");
    error.statusCode = 403;
    return next(error);
  }

  const hotelId = review.hotel;
  await Review.findByIdAndDelete(review._id);
  await refreshHotelReviewStats(hotelId);

  res.status(200).json({
    success: true,
    data: {},
  });
});

exports.deleteInappropriateReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    const error = new Error("Review not found");
    error.statusCode = 404;
    return next(error);
  }

  const hotelId = review.hotel;
  await Review.findByIdAndDelete(review._id);
  await refreshHotelReviewStats(hotelId);

  res.status(200).json({
    success: true,
    data: {},
  });
});
