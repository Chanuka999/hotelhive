const Hotel = require("../models/Hotel");
const Room = require("../models/Room");
const cloudinary = require("../config/cloudinary");

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const uploadToCloudinary = (fileBuffer, folder = "hotelhive/hotels") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      },
    );

    stream.end(fileBuffer);
  });
};

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

exports.getHotels = asyncHandler(async (req, res) => {
  const hotels = await Hotel.find({ isActive: true })
    .populate("owner", "name email")
    .populate({
      path: "rooms",
      match: { isActive: true },
    });

  res.status(200).json({
    success: true,
    count: hotels.length,
    data: hotels,
  });
});

exports.getHotelById = asyncHandler(async (req, res, next) => {
  const hotel = await Hotel.findById(req.params.id)
    .populate("owner", "name email")
    .populate({
      path: "rooms",
      match: { isActive: true },
    });

  if (!hotel || !hotel.isActive) {
    const error = new Error("Hotel not found");
    error.statusCode = 404;
    return next(error);
  }

  res.status(200).json({
    success: true,
    data: hotel,
  });
});

exports.searchHotels = asyncHandler(async (req, res) => {
  const {
    location,
    city,
    country,
    minRating,
    starRating,
    amenities,
    minPrice,
    maxPrice,
    roomType,
    availableOnly,
  } = req.query;

  const query = { isActive: true };

  if (city) {
    query["address.city"] = { $regex: city, $options: "i" };
  }

  if (location) {
    query.$or = [
      { "address.city": { $regex: location, $options: "i" } },
      { "address.state": { $regex: location, $options: "i" } },
      { "address.country": { $regex: location, $options: "i" } },
    ];
  }

  if (country) {
    query["address.country"] = { $regex: country, $options: "i" };
  }
  if (minRating) {
    query.averageRating = { $gte: parseNumber(minRating, 0) };
  }
  if (starRating) {
    query.starRating = parseNumber(starRating, 3);
  }
  if (amenities) {
    const amenitiesList = String(amenities)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (amenitiesList.length) {
      query.amenities = { $all: amenitiesList };
    }
  }

  let hotels = await Hotel.find(query).populate({
    path: "rooms",
    match: { isActive: true },
  });

  if (minPrice || maxPrice || roomType || availableOnly === "true") {
    const min = parseNumber(minPrice, 0);
    const max = parseNumber(maxPrice, Number.MAX_SAFE_INTEGER);
    const onlyAvailable = availableOnly === "true";

    hotels = hotels.filter((hotel) => {
      const discountFactor = 1 - parseNumber(hotel.discountPercent, 0) / 100;
      const matchingRooms = hotel.rooms.filter((room) => {
        const typeMatches = roomType ? room.roomType === roomType : true;
        const availabilityMatches = onlyAvailable
          ? room.availableRooms > 0
          : true;
        const effectivePrice = room.price * discountFactor;
        const priceMatches = effectivePrice >= min && effectivePrice <= max;
        return typeMatches && priceMatches && availabilityMatches;
      });
      return matchingRooms.length > 0;
    });
  }

  res.status(200).json({
    success: true,
    count: hotels.length,
    data: hotels,
  });
});

exports.createHotel = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
    owner: req.user._id,
  };

  if (req.files?.length) {
    const uploadedImages = await Promise.all(
      req.files.map((file) => uploadToCloudinary(file.buffer)),
    );

    payload.images = uploadedImages.map((image) => ({
      url: image.secure_url,
      public_id: image.public_id,
    }));
  }

  const hotel = await Hotel.create(payload);

  res.status(201).json({
    success: true,
    data: hotel,
  });
});

exports.updateHotel = asyncHandler(async (req, res, next) => {
  const hotel = await Hotel.findById(req.params.id);

  if (!hotel || !hotel.isActive) {
    const error = new Error("Hotel not found");
    error.statusCode = 404;
    return next(error);
  }

  const isOwner = hotel.owner.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    const error = new Error("Not authorized to update this hotel");
    error.statusCode = 403;
    return next(error);
  }

  if (req.files?.length) {
    const uploadedImages = await Promise.all(
      req.files.map((file) => uploadToCloudinary(file.buffer)),
    );

    req.body.images = uploadedImages.map((image) => ({
      url: image.secure_url,
      public_id: image.public_id,
    }));
  }

  const updatedHotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: updatedHotel,
  });
});

exports.deleteHotel = asyncHandler(async (req, res, next) => {
  const hotel = await Hotel.findById(req.params.id);

  if (!hotel || !hotel.isActive) {
    const error = new Error("Hotel not found");
    error.statusCode = 404;
    return next(error);
  }

  const isOwner = hotel.owner.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    const error = new Error("Not authorized to delete this hotel");
    error.statusCode = 403;
    return next(error);
  }

  hotel.isActive = false;
  await hotel.save();

  res.status(200).json({
    success: true,
    data: {},
  });
});

exports.updateHotelPricing = asyncHandler(async (req, res, next) => {
  const hotel = await Hotel.findById(req.params.id);

  if (!hotel || !hotel.isActive) {
    const error = new Error("Hotel not found");
    error.statusCode = 404;
    return next(error);
  }

  const { roomType, price, percentageAdjustment } = req.body;

  const hasPrice = Number.isFinite(Number(price));
  const hasAdjustment = Number.isFinite(Number(percentageAdjustment));

  if (!hasPrice && !hasAdjustment) {
    const error = new Error("Provide 'price' or 'percentageAdjustment'");
    error.statusCode = 400;
    return next(error);
  }

  const roomFilter = { hotel: hotel._id, isActive: true };
  if (roomType) {
    roomFilter.roomType = roomType;
  }

  const rooms = await Room.find(roomFilter);

  if (!rooms.length) {
    const error = new Error("No rooms found for pricing update");
    error.statusCode = 404;
    return next(error);
  }

  await Promise.all(
    rooms.map(async (room) => {
      if (hasPrice) {
        room.price = Number(price);
      } else {
        const factor = 1 + Number(percentageAdjustment) / 100;
        room.price = Math.max(0, Number((room.price * factor).toFixed(2)));
      }
      await room.save();
    }),
  );

  if (hasPrice && !roomType) {
    hotel.basePrice = Number(price);
    await hotel.save();
  }

  res.status(200).json({
    success: true,
    message: "Room prices updated successfully",
  });
});

exports.updateHotelDiscount = asyncHandler(async (req, res, next) => {
  const hotel = await Hotel.findById(req.params.id);

  if (!hotel || !hotel.isActive) {
    const error = new Error("Hotel not found");
    error.statusCode = 404;
    return next(error);
  }

  const discountPercent = Number(req.body.discountPercent);
  if (
    !Number.isFinite(discountPercent) ||
    discountPercent < 0 ||
    discountPercent > 90
  ) {
    const error = new Error(
      "discountPercent must be a number between 0 and 90",
    );
    error.statusCode = 400;
    return next(error);
  }

  hotel.discountPercent = discountPercent;
  await hotel.save();

  res.status(200).json({
    success: true,
    data: hotel,
  });
});
