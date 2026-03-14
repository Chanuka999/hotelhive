import api from "./api";

const appendIfDefined = (formData, key, value) => {
  if (value === undefined || value === null) {
    return;
  }

  formData.append(key, value);
};

const buildRoomFormData = (payload) => {
  const formData = new FormData();

  appendIfDefined(formData, "roomType", payload.roomType);
  appendIfDefined(formData, "description", payload.description);
  appendIfDefined(formData, "price", payload.price);
  appendIfDefined(formData, "size", payload.size);
  appendIfDefined(formData, "bedType", payload.bedType);
  appendIfDefined(formData, "capacityAdults", payload.capacityAdults);
  appendIfDefined(formData, "capacityChildren", payload.capacityChildren);
  appendIfDefined(formData, "totalRooms", payload.totalRooms);
  appendIfDefined(formData, "availableRooms", payload.availableRooms);
  appendIfDefined(formData, "isActive", payload.isActive);
  formData.append("amenities", JSON.stringify(payload.amenities || []));
  formData.append(
    "existingImages",
    JSON.stringify(payload.existingImages || []),
  );

  (payload.images || []).forEach((file) => {
    formData.append("images", file);
  });

  return formData;
};

const getRoomsByHotel = async (hotelId) => {
  const { data } = await api.get(`/rooms/hotel/${hotelId}`);
  return data.data || [];
};

const createRoom = async (hotelId, payload) => {
  const { data } = await api.post(
    `/rooms/hotel/${hotelId}`,
    buildRoomFormData(payload),
  );
  return data.data || data;
};

const updateRoom = async (roomId, payload) => {
  const { data } = await api.put(
    `/rooms/${roomId}`,
    buildRoomFormData(payload),
  );
  return data.data || data;
};

const deleteRoom = async (roomId) => {
  const { data } = await api.delete(`/rooms/${roomId}`);
  return data;
};

export default {
  getRoomsByHotel,
  createRoom,
  updateRoom,
  deleteRoom,
};
