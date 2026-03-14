import api from "./api";

const createPaymentIntent = async (payload) => {
  const { data } = await api.post("/payments/create-payment-intent", payload);
  return data.data || data;
};

const getPaymentHistory = async () => {
  const { data } = await api.get("/payments/history");
  return data.data || [];
};

const getInvoice = async (bookingId) => {
  const { data } = await api.get(`/payments/invoice/${bookingId}`);
  return data.data || data;
};

const getAllPaymentsAdmin = async (status = "") => {
  const params = status ? { status } : undefined;
  const { data } = await api.get("/payments/admin", { params });
  return data.data || [];
};

const refundPayment = async (bookingId) => {
  const { data } = await api.patch(`/payments/admin/${bookingId}/refund`);
  return data.data || data;
};

const getFinancialReports = async () => {
  const { data } = await api.get("/payments/admin/reports");
  return data.data || {};
};

export default {
  createPaymentIntent,
  getPaymentHistory,
  getInvoice,
  getAllPaymentsAdmin,
  refundPayment,
  getFinancialReports,
};
