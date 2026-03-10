import api from "./api";

const getHotelReviews = async (hotelId) => {
  const { data } = await api.get(`/reviews/hotel/${hotelId}`);
  return data.reviews || data.data || data || [];
};

const createReview = async (payload) => {
  const { data } = await api.post("/reviews", payload);
  return data.review || data.data || data;
};

export default {
  getHotelReviews,
  createReview,
};
