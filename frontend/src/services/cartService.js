import api from './api';

const getCart = async () => {
  const response = await api.get('/cart');
  return response.data;
};

const addToCart = async (productId, quantity) => {
  const response = await api.post('/cart/items', { productId, quantity });
  return response.data;
};

const updateCartItem = async (productId, quantity) => {
  const response = await api.patch(`/cart/items/${productId}`, { quantity });
  return response.data;
};

const removeFromCart = async (productId) => {
  const response = await api.delete(`/cart/items/${productId}`);
  return response.data;
};

const clearCart = async () => {
  const response = await api.delete('/cart');
  return response.data;
};

export default {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};
