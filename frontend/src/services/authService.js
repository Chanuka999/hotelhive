import api from "./api";

const resolveAuthPayload = (data) => {
  const token = data?.token;
  const user = data?.user;

  if (!token || !user) {
    throw new Error("Invalid auth response from server");
  }

  return { token, user };
};

const register = async (payload) => {
  const { data } = await api.post("/auth/register", payload);
  return resolveAuthPayload(data);
};

const login = async (payload) => {
  const { data } = await api.post("/auth/login", payload);
  return resolveAuthPayload(data);
};

const getCurrentUser = async () => {
  const { data } = await api.get("/auth/me");
  return data.user || data;
};

const updateProfile = async (payload) => {
  const { data } = await api.put("/auth/me", payload);
  return data.user || data;
};

export default {
  register,
  login,
  getCurrentUser,
  updateProfile,
};
