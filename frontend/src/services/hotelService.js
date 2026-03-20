import api from "./api";
import { demoHotels } from "../utils/constants";

const getHotels = async () => {
  try {
    const { data } = await api.get("/hotels");
    return data.hotels || data.data || data || demoHotels;
  } catch (error) {
    return demoHotels;
  }
};

const getHotelById = async (id) => {
  try {
    const { data } = await api.get(`/hotels/${id}`);
    return data.hotel || data.data || data;
  } catch (error) {
    return demoHotels.find((hotel) => hotel._id === id) || demoHotels[0];
  }
};

const searchHotels = async (params) => {
  try {
    const { data } = await api.get("/hotels/search", { params });
    return data.hotels || data.data || data || demoHotels;
  } catch (error) {
    return demoHotels;
  }
};

const createHotel = async (formData) => {
  const { data } = await api.post("/hotels", formData);
  return data.data || data.hotel || data;
};

const updateHotel = async (id, formData) => {
  const { data } = await api.put(`/hotels/${id}`, formData);
  return data.data || data.hotel || data;
};

const deleteHotel = async (id) => {
  const { data } = await api.delete(`/hotels/${id}`);
  return data;
};

const updatePricing = async (id, payload) => {
  const { data } = await api.patch(`/hotels/${id}/pricing`, payload);
  return data;
};

const updateDiscount = async (id, discountPercent) => {
  const { data } = await api.patch(`/hotels/${id}/discount`, {
    discountPercent,
  });
  return data.data || data;
};

export default {
  getHotels,
  getHotelById,
  searchHotels,
  createHotel,
  updateHotel,
  deleteHotel,
  updatePricing,
  updateDiscount,
};
