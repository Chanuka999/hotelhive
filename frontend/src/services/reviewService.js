import api from "./api";

const getHotelReviews = async (hotelId) => {
  const { data } = await api.get(`/reviews/hotel/${hotelId}`);
  return data.reviews || data.data || data || [];
};

const createReview = async (payload) => {
  const { data } = await api.post("/reviews", payload);
  return data.review || data.data || data;
};

const getAllReviewsAdmin = async () => {
  const { data } = await api.get("/reviews/admin/all");
  return data.data || [];
};

const deleteReview = async (id) => {
  const { data } = await api.delete(`/reviews/${id}`);
  return data;
};

const deleteInappropriateReview = async (id) => {
  const { data } = await api.delete(`/reviews/admin/${id}`);
  return data;
};

export default {
  getHotelReviews,
  createReview,
  getAllReviewsAdmin,
  deleteReview,
  deleteInappropriateReview,
};
