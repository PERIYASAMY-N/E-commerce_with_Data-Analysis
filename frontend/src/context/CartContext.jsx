import React, { createContext, useState, useEffect, useContext } from 'react';
import cartService from '../services/cartService';
import { AuthContext } from './AuthContext';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [cart, setCart] = useState({ items: [], itemCount: 0, subtotal: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCart({ items: [], itemCount: 0, subtotal: 0 });
    }
  }, [user]);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const data = await cartService.getCart();
      setCart(data.cart);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch cart', err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity) => {
    if (!user) {
      const error = new Error('Please login to add items to cart');
      error.status = 401;
      throw error;
    }
    try {
      await cartService.addToCart(productId, quantity);
      await fetchCart();
    } catch (err) {
      throw err;
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      await cartService.updateCartItem(productId, quantity);
      await fetchCart();
    } catch (err) {
      throw err;
    }
  };

  const removeFromCart = async (productId) => {
    try {
      await cartService.removeFromCart(productId);
      await fetchCart();
    } catch (err) {
      throw err;
    }
  };

  const clearCart = async () => {
    try {
      await cartService.clearCart();
      await fetchCart();
    } catch (err) {
      throw err;
    }
  };

  return (
    <CartContext.Provider value={{ cart, loading, error, addToCart, updateQuantity, removeFromCart, clearCart, refreshCart: fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};
