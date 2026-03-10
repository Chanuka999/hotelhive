import api from "./api";

const createPaymentIntent = async (payload) => {
  const { data } = await api.post("/payments/create-payment-intent", payload);
  return data;
};

export default {
  createPaymentIntent,
};
