import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import authService from "../../services/authService";

const getApiErrorMessage = (error, fallback) => {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
};

const token = localStorage.getItem("token");
const user = localStorage.getItem("user");
const hasStaleToken = token === "demo-token";

if (hasStaleToken) {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

const initialState = {
  user: !hasStaleToken && user ? JSON.parse(user) : null,
  token: !hasStaleToken ? token : null,
  loading: false,
  error: null,
};

export const registerUser = createAsyncThunk(
  "auth/register",
  async (payload, thunkAPI) => {
    try {
      return await authService.register(payload);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        getApiErrorMessage(error, "Registration failed"),
      );
    }
  },
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (payload, thunkAPI) => {
    try {
      return await authService.login(payload);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        getApiErrorMessage(error, "Login failed"),
      );
    }
  },
);

export const fetchCurrentUser = createAsyncThunk(
  "auth/currentUser",
  async (_, thunkAPI) => {
    try {
      return await authService.getCurrentUser();
    } catch (error) {
      return thunkAPI.rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch user"),
      );
    }
  },
);

export const updateCurrentUserProfile = createAsyncThunk(
  "auth/updateProfile",
  async (payload, thunkAPI) => {
    try {
      return await authService.updateProfile(payload);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        getApiErrorMessage(error, "Failed to update profile"),
      );
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      state.user = null;
      state.token = null;
      toast.info("Logged out");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem("token", action.payload.token || "");
        localStorage.setItem("user", JSON.stringify(action.payload.user || {}));
        toast.success("Account created");
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.user = null;
        state.token = null;
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        toast.error(String(action.payload));
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem("token", action.payload.token || "");
        localStorage.setItem("user", JSON.stringify(action.payload.user || {}));
        toast.success("Login successful");
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.user = null;
        state.token = null;
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        toast.error(String(action.payload));
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        localStorage.setItem("user", JSON.stringify(action.payload || {}));
      })
      .addCase(updateCurrentUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCurrentUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        localStorage.setItem("user", JSON.stringify(action.payload || {}));
        toast.success("Profile updated");
      })
      .addCase(updateCurrentUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(String(action.payload));
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
