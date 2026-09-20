import api from './api';

const getCategories = async () => {
  const response = await api.get('/categories');
  return response.data;
};

const getAdminCategories = async () => {
  const response = await api.get('/categories/admin');
  return response.data;
};

const getCategory = async (id) => {
  const response = await api.get(`/categories/${id}`);
  return response.data;
};

const createCategory = async (data) => {
  const response = await api.post('/categories', data);
  return response.data;
};

const updateCategory = async (id, data) => {
  const response = await api.put(`/categories/${id}`, data);
  return response.data;
};

const updateCategoryStatus = async (id, isActive) => {
  const response = await api.patch(`/categories/${id}/status`, { is_active: isActive });
  return response.data;
};

const deleteCategory = async (id) => {
  const response = await api.delete(`/categories/${id}`);
  return response.data;
};

export default { getCategories, getAdminCategories, getCategory, createCategory, updateCategory, updateCategoryStatus, deleteCategory };
