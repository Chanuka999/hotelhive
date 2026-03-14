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
      const response = await bookingService.cancelBooking(id);
      return (
        response?.data || response?.booking || { _id: id, status: "cancelled" }
      );
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.message || "Failed to cancel booking",
      );
    }
  },
);

export const modifyBooking = createAsyncThunk(
  "bookings/modify",
  async ({ id, payload }, thunkAPI) => {
    try {
      return await bookingService.modifyBooking(id, payload);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response?.data?.error ||
          error.message ||
          "Failed to modify booking",
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
        const updatedBooking = action.payload;
        state.bookings = state.bookings.map((item) =>
          item._id === updatedBooking?._id
            ? { ...item, ...updatedBooking, status: "cancelled" }
            : item,
        );
        toast.info("Booking cancelled");
      })
      .addCase(modifyBooking.pending, (state) => {
        state.loading = true;
      })
      .addCase(modifyBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = state.bookings.map((item) =>
          item._id === action.payload?._id ? action.payload : item,
        );
        toast.success("Booking updated");
      })
      .addCase(modifyBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(String(action.payload));
      });
  },
});

export default bookingSlice.reducer;
