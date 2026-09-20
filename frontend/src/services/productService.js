import api from './api';

const getProducts = async (params) => {
  const response = await api.get('/products', { params });
  return response.data;
};

const getAdminProducts = async (params) => {
  const response = await api.get('/products/admin', { params });
  return response.data;
};

const getProduct = async (idOrSlug) => {
  const response = await api.get(`/products/${idOrSlug}`);
  return response.data;
};

const createProduct = async (data) => {
  const response = await api.post('/products', data);
  return response.data;
};

const updateProduct = async (id, data) => {
  const response = await api.put(`/products/${id}`, data);
  return response.data;
};

const updateProductStatus = async (id, isActive) => {
  const response = await api.patch(`/products/${id}/status`, { is_active: isActive });
  return response.data;
};

const deleteProduct = async (id) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};

export default { getProducts, getAdminProducts, getProduct, createProduct, updateProduct, updateProductStatus, deleteProduct };
