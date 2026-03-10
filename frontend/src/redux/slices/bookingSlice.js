import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import bookingService from "../../services/bookingService";

const initialState = {
  bookings: [],
  loading: false,
  error: null,
};

export const fetchUserBookings = createAsyncThunk(
  "bookings/fetchUser",
  async (_, thunkAPI) => {
    try {
      return await bookingService.getBookings();
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.message || "Failed to fetch bookings",
      );
    }
  },
);

export const createBooking = createAsyncThunk(
  "bookings/create",
  async (payload, thunkAPI) => {
    try {
      return await bookingService.createBooking(payload);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.message || "Failed to create booking",
      );
    }
  },
);

export const cancelBooking = createAsyncThunk(
  "bookings/cancel",
  async (id, thunkAPI) => {
    try {
      await bookingService.cancelBooking(id);
      return id;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.message || "Failed to cancel booking",
      );
    }
  },
);

const bookingSlice = createSlice({
  name: "bookings",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserBookings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchUserBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createBooking.pending, (state) => {
        state.loading = true;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && typeof action.payload === "object") {
          state.bookings.unshift(action.payload);
        }
        toast.success("Booking created");
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(String(action.payload));
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.bookings = state.bookings.filter(
          (item) => item._id !== action.payload,
        );
        toast.info("Booking cancelled");
      });
  },
});

export default bookingSlice.reducer;
