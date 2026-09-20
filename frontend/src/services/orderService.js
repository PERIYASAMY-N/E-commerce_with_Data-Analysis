import api from './api';

const createOrder = async (orderData) => {
  const response = await api.post('/orders', orderData);
  return response.data;
};

const getMyOrders = async () => {
  const response = await api.get('/orders');
  return response.data;
};

const getMyOrderById = async (id) => {
  const response = await api.get(`/orders/${id}`);
  return response.data;
};

const getAdminOrders = async () => {
  const response = await api.get('/orders/admin/all');
  return response.data;
};

const updateOrderStatus = async (id, status) => {
  const response = await api.patch(`/orders/admin/${id}/status`, { status });
  return response.data;
};

export default {
  createOrder,
  getMyOrders,
  getMyOrderById,
  getAdminOrders,
  updateOrderStatus
};
