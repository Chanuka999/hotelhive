const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hotel",
    required: true,
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room",
    required: true,
  },
  checkIn: {
    type: Date,
    required: [true, "Please add check-in date"],
  },
  checkOut: {
    type: Date,
    required: [true, "Please add check-out date"],
  },
  guests: {
    adults: {
      type: Number,
      required: true,
      default: 1,
    },
    children: {
      type: Number,
      default: 0,
    },
  },
  numberOfRooms: {
    type: Number,
    required: true,
    default: 1,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled", "completed"],
    default: "pending",
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "refunded"],
    default: "pending",
  },
  paymentInfo: {
    paymentId: String,
    paymentMethod: String,
    paidAt: Date,
    refundedAt: Date,
    refundId: String,
  },
  specialRequests: {
    type: String,
    maxlength: [500, "Special requests cannot be more than 500 characters"],
  },
  cancellationReason: String,
  cancelledAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Calculate number of nights
BookingSchema.virtual("numberOfNights").get(function () {
  const diffTime = Math.abs(this.checkOut - this.checkIn);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

module.exports = mongoose.model("Booking", BookingSchema);
