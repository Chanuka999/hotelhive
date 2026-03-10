export const formatDate = (value) => {
  if (!value) {
    return "";
  }
  return new Date(value).toLocaleDateString();
};

export const toCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount || 0);
};
