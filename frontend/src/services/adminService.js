import api from "./api";

const getAnalytics = async () => {
  const { data } = await api.get("/users/admin/analytics");
  return data.data || {};
};

export default {
  getAnalytics,
};
