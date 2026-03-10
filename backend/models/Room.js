const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hotel",
    required: true,
  },
  roomType: {
    type: String,
    required: [true, "Please add a room type"],
    enum: ["Single", "Double", "Suite", "Deluxe", "Presidential"],
  },
  description: {
    type: String,
    required: [true, "Please add a description"],
  },
  price: {
    type: Number,
    required: [true, "Please add a price"],
  },
  capacity: {
    adults: {
      type: Number,
      required: true,
      default: 2,
    },
    children: {
      type: Number,
      default: 0,
    },
  },
  size: {
    type: Number, // in square meters
    required: true,
  },
  bedType: {
    type: String,
    enum: ["Single", "Double", "Queen", "King"],
  },
  amenities: [
    {
      type: String,
    },
  ],
  images: [
    {
      url: String,
      public_id: String,
    },
  ],
  totalRooms: {
    type: Number,
    required: true,
    default: 1,
  },
  availableRooms: {
    type: Number,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Room", RoomSchema);
