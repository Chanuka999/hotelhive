import api from "./api";

const getAnalytics = async () => {
  const { data } = await api.get("/users/admin/analytics");
  return data.data || {};
};

const getReports = async () => {
  const { data } = await api.get("/users/admin/reports");
  return data.data || {};
};

const getCustomers = async () => {
  const { data } = await api.get("/users/admin/customers");
  return data.data || [];
};

const blockCustomer = async (id, blocked = true) => {
  const { data } = await api.patch(`/users/admin/customers/${id}/block`, {
    blocked,
  });
  return data.data || data;
};

const deleteCustomer = async (id) => {
  const { data } = await api.delete(`/users/admin/customers/${id}`);
  return data;
};

const getStaff = async () => {
  const { data } = await api.get("/users/admin/staff");
  return data.data || [];
};

const addStaff = async (payload) => {
  const { data } = await api.post("/users/admin/staff", payload);
  return data.data || data;
};

const updateStaffAccess = async (id, payload) => {
  const { data } = await api.patch(`/users/admin/staff/${id}`, payload);
  return data.data || data;
};

const deleteStaff = async (id) => {
  const { data } = await api.delete(`/users/admin/staff/${id}`);
  return data;
};

export default {
  getAnalytics,
  getReports,
  getCustomers,
  blockCustomer,
  deleteCustomer,
  getStaff,
  addStaff,
  updateStaffAccess,
  deleteStaff,
};
