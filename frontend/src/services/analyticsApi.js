import api from './api';

const getParams = (startDate, endDate, extraParams = {}) => {
  const params = { ...extraParams };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  return { params };
};

export const getSummary = async (startDate, endDate) => {
  const response = await api.get('/admin/analytics/summary', getParams(startDate, endDate));
  return response.data;
};

export const getSalesTrend = async (startDate, endDate, groupBy = 'month') => {
  const response = await api.get('/admin/analytics/sales-trend', getParams(startDate, endDate, { groupBy }));
  return response.data;
};

export const getTopProducts = async (startDate, endDate, limit = 10) => {
  const response = await api.get('/admin/analytics/top-products', getParams(startDate, endDate, { limit }));
  return response.data;
};

export const getTopCategories = async (startDate, endDate, limit = 10) => {
  const response = await api.get('/admin/analytics/top-categories', getParams(startDate, endDate, { limit }));
  return response.data;
};

export const getTopCustomers = async (startDate, endDate, limit = 10) => {
  const response = await api.get('/admin/analytics/top-customers', getParams(startDate, endDate, { limit }));
  return response.data;
};

export const getProductPerformance = async (startDate, endDate, sortBy = 'revenue') => {
  const response = await api.get('/admin/analytics/product-performance', getParams(startDate, endDate, { sortBy }));
  return response.data;
};

export const getCategoryPerformance = async (startDate, endDate) => {
  const response = await api.get('/admin/analytics/category-performance', getParams(startDate, endDate));
  return response.data;
};

export const getOrdersBreakdown = async (startDate, endDate) => {
  const response = await api.get('/admin/analytics/orders-breakdown', getParams(startDate, endDate));
  return response.data;
};

export const getPaymentSummary = async (startDate, endDate) => {
  const response = await api.get('/admin/analytics/payment-summary', getParams(startDate, endDate));
  return response.data;
};

export default {
  getSummary,
  getSalesTrend,
  getTopProducts,
  getTopCategories,
  getTopCustomers,
  getProductPerformance,
  getCategoryPerformance,
  getOrdersBreakdown,
  getPaymentSummary
};
