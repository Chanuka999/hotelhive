import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import hotelService from "../../services/hotelService";

const initialState = {
  hotels: [],
  selectedHotel: null,
  loading: false,
  error: null,
};

export const fetchHotels = createAsyncThunk(
  "hotels/fetchAll",
  async (_, thunkAPI) => {
    try {
      return await hotelService.getHotels();
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.message || "Failed to fetch hotels",
      );
    }
  },
);

export const fetchHotelById = createAsyncThunk(
  "hotels/fetchById",
  async (id, thunkAPI) => {
    try {
      return await hotelService.getHotelById(id);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || "Failed to fetch hotel");
    }
  },
);

export const searchHotels = createAsyncThunk(
  "hotels/search",
  async (params, thunkAPI) => {
    try {
      return await hotelService.searchHotels(params);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || "Search failed");
    }
  },
);

const hotelSlice = createSlice({
  name: "hotels",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHotels.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchHotels.fulfilled, (state, action) => {
        state.loading = false;
        state.hotels = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchHotels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(String(action.payload));
      })
      .addCase(fetchHotelById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchHotelById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedHotel = action.payload;
      })
      .addCase(fetchHotelById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(searchHotels.fulfilled, (state, action) => {
        state.hotels = Array.isArray(action.payload) ? action.payload : [];
      });
  },
});

export default hotelSlice.reducer;
