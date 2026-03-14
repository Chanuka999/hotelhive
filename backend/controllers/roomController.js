const Hotel = require("../models/Hotel");
const Room = require("../models/Room");
const cloudinary = require("../config/cloudinary");

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const uploadToCloudinary = (fileBuffer, folder = "hotelhive/rooms") => {
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

const parseNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseBoolean = (value, fallback = true) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value.toLowerCase() === "true") {
      return true;
    }
    if (value.toLowerCase() === "false") {
      return false;
    }
  }

  return fallback;
};

const parseArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value !== "string") {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter(Boolean);
    }
  } catch (error) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const getCapacity = (body) => {
  return {
    adults: parseNumber(
      body.capacityAdults ?? body["capacity.adults"] ?? body.capacity?.adults,
      1,
    ),
    children: parseNumber(
      body.capacityChildren ??
        body["capacity.children"] ??
        body.capacity?.children,
      0,
    ),
  };
};

const normalizeRoomPayload = async (req) => {
  const totalRooms = Math.max(1, parseNumber(req.body.totalRooms, 1));
  const availableRooms = Math.max(
    0,
    parseNumber(req.body.availableRooms, totalRooms),
  );

  if (availableRooms > totalRooms) {
    const error = new Error("Available rooms cannot exceed total rooms");
    error.statusCode = 400;
    throw error;
  }

  const existingImages = parseArray(req.body.existingImages).filter(
    (image) => image?.url && image?.public_id,
  );

  const uploadedImages = req.files?.length
    ? await Promise.all(
        req.files.map((file) => uploadToCloudinary(file.buffer)),
      )
    : [];

  return {
    roomType: req.body.roomType,
    description: req.body.description,
    price: parseNumber(req.body.price, 0),
    capacity: getCapacity(req.body),
    size: parseNumber(req.body.size, 0),
    bedType: req.body.bedType,
    amenities: parseArray(req.body.amenities),
    images: [
      ...existingImages,
      ...uploadedImages.map((image) => ({
        url: image.secure_url,
        public_id: image.public_id,
      })),
    ],
    totalRooms,
    availableRooms,
    isActive: parseBoolean(req.body.isActive, true),
  };
};

const syncHotelBasePrice = async (hotelId) => {
  const activeRooms = await Room.find({ hotel: hotelId, isActive: true })
    .sort({ price: 1 })
    .select("price");

  const lowestPrice = activeRooms.length ? activeRooms[0].price : 0;
  await Hotel.findByIdAndUpdate(hotelId, { basePrice: lowestPrice });
};

exports.getRoomsByHotel = asyncHandler(async (req, res, next) => {
  const hotel = await Hotel.findById(req.params.hotelId);

  if (!hotel || !hotel.isActive) {
    const error = new Error("Hotel not found");
    error.statusCode = 404;
    return next(error);
  }

  const filter = {
    hotel: hotel._id,
    ...(req.user?.role === "admin" ? {} : { isActive: true }),
  };

  const rooms = await Room.find(filter).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: rooms.length,
    data: rooms,
  });
});

exports.createRoom = asyncHandler(async (req, res, next) => {
  const hotel = await Hotel.findById(req.params.hotelId);

  if (!hotel || !hotel.isActive) {
    const error = new Error("Hotel not found");
    error.statusCode = 404;
    return next(error);
  }

  const payload = await normalizeRoomPayload(req);
  const room = await Room.create({
    ...payload,
    hotel: hotel._id,
  });

  if (
    !hotel.rooms.some((roomId) => roomId.toString() === room._id.toString())
  ) {
    hotel.rooms.push(room._id);
    await hotel.save();
  }

  await syncHotelBasePrice(hotel._id);

  res.status(201).json({
    success: true,
    data: room,
  });
});

exports.updateRoom = asyncHandler(async (req, res, next) => {
  const room = await Room.findById(req.params.id);

  if (!room) {
    const error = new Error("Room not found");
    error.statusCode = 404;
    return next(error);
  }

  const payload = await normalizeRoomPayload(req);

  Object.assign(room, payload);
  await room.save();
  await syncHotelBasePrice(room.hotel);

  res.status(200).json({
    success: true,
    data: room,
  });
});

exports.deleteRoom = asyncHandler(async (req, res, next) => {
  const room = await Room.findById(req.params.id);

  if (!room) {
    const error = new Error("Room not found");
    error.statusCode = 404;
    return next(error);
  }

  await Hotel.findByIdAndUpdate(room.hotel, {
    $pull: { rooms: room._id },
  });

  await Room.findByIdAndDelete(room._id);

  await syncHotelBasePrice(room.hotel);

  res.status(200).json({
    success: true,
    data: {},
  });
});
