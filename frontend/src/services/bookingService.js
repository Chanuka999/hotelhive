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

export default {
  getBookings,
  createBooking,
  cancelBooking,
};
