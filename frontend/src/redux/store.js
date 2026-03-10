import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import hotelReducer from "./slices/hotelSlice";
import bookingReducer from "./slices/bookingSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    hotels: hotelReducer,
    bookings: bookingReducer,
  },
});
