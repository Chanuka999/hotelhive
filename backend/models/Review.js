const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hotel",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: [true, "Please add a rating between 1 and 5"],
  },
  comment: {
    type: String,
    required: [true, "Please add a comment"],
    maxlength: [500, "Comment cannot be more than 500 characters"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Prevent user from submitting more than one review per booking
ReviewSchema.index({ booking: 1, user: 1 }, { unique: true });

// Static method to get average rating
ReviewSchema.statics.getAverageRating = async function (hotelId) {
  const obj = await this.aggregate([
    {
      $match: { hotel: hotelId },
    },
    {
      $group: {
        _id: "$hotel",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  try {
    await this.model("Hotel").findByIdAndUpdate(hotelId, {
      averageRating: obj[0].averageRating.toFixed(1),
      totalReviews: obj[0].totalReviews,
    });
  } catch (err) {
    console.error(err);
  }
};

// Call getAverageRating after save
ReviewSchema.post("save", function () {
  this.constructor.getAverageRating(this.hotel);
});

// Call getAverageRating before remove
ReviewSchema.pre("remove", function () {
  this.constructor.getAverageRating(this.hotel);
});

module.exports = mongoose.model("Review", ReviewSchema);
