import api from "./api";

const toBookingArray = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.bookings)) {
    return data.bookings;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
};

const getBookings = async () => {
  try {
    const { data } = await api.get("/bookings");
    return toBookingArray(data);
  } catch (error) {
    return [];
  }
};

const createBooking = async (payload) => {
  const { data } = await api.post("/bookings", payload);
  return data.booking || data.data || data;
};

const cancelBooking = async (id) => {
  const { data } = await api.delete(`/bookings/${id}`);
  return data;
};

const modifyBooking = async (id, payload) => {
  const { data } = await api.patch(`/bookings/${id}/modify`, payload);
  return data.data || data;
};

const getAllBookingsAdmin = async () => {
  const { data } = await api.get("/bookings/admin/all");
  return toBookingArray(data);
};

const approveBooking = async (id) => {
  const { data } = await api.patch(`/bookings/${id}/approve`);
  return data.data || data;
};

const updateBookingStatus = async (id, status, cancellationReason = "") => {
  const payload = { status };
  if (status === "cancelled" && cancellationReason) {
    payload.cancellationReason = cancellationReason;
  }

  const { data } = await api.patch(`/bookings/${id}/status`, payload);
  return data.data || data;
};

export default {
  getBookings,
  createBooking,
  cancelBooking,
  modifyBooking,
  getAllBookingsAdmin,
  approveBooking,
  updateBookingStatus,
};
