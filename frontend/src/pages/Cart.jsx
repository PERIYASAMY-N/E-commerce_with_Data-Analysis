import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import { CartContext } from '../context/CartContext';

const Cart = () => {
  const { cart, loading, updateQuantity, removeFromCart, clearCart } = useContext(CartContext);
  const [actionLoading, setActionLoading] = useState(null);
  const navigate = useNavigate();

  const handleUpdate = async (productId, currentQuantity, change, stockQuantity, isActive) => {
    if (!isActive) return;
    
    const newQuantity = currentQuantity + change;
    
    if (newQuantity <= 0) {
      handleRemove(productId);
      return;
    }
    
    if (newQuantity > stockQuantity) {
      alert(`Only ${stockQuantity} units available.`);
      return;
    }

    setActionLoading(`update-${productId}`);
    try {
      await updateQuantity(productId, newQuantity);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update quantity');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (productId) => {
    setActionLoading(`remove-${productId}`);
    try {
      await removeFromCart(productId);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove item');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Are you sure you want to clear your cart?')) return;
    
    setActionLoading('clear');
    try {
      await clearCart();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to clear cart');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && cart.items.length === 0) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        <div className="bg-white p-10 rounded-2xl shadow-sm text-center max-w-md w-full border border-gray-100">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-10 w-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
          <Link 
            to="/products" 
            className="w-full inline-flex justify-center items-center gap-2 bg-primary-600 text-white font-medium py-3 px-4 rounded-md hover:bg-primary-700 transition-colors"
          >
            Start Shopping <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
        
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Items ({cart.itemCount})</h2>
                <button 
                  onClick={handleClear}
                  disabled={actionLoading === 'clear'}
                  className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  {actionLoading === 'clear' ? 'Clearing...' : 'Clear Cart'}
                </button>
              </div>
              
              <ul className="divide-y divide-gray-200">
                {cart.items.map((item) => (
                  <li key={item.productId} className={`p-6 flex flex-col sm:flex-row gap-6 ${!item.isActive ? 'bg-gray-50 opacity-75' : ''}`}>
                    <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-gray-400">No image</span>
                      )}
                    </div>
                    
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            <Link to={`/products/${item.productId}`} className="hover:text-primary-600">
                              {item.productName}
                            </Link>
                          </h3>
                          {!item.isActive ? (
                            <p className="mt-1 text-sm font-medium text-red-600">This product is currently unavailable.</p>
                          ) : item.stockQuantity < item.quantity ? (
                            <p className="mt-1 text-sm font-medium text-red-600">Only {item.stockQuantity} available in stock.</p>
                          ) : (
                            <p className="mt-1 text-sm text-gray-500">₹{item.unitPrice.toLocaleString('en-IN')}</p>
                          )}
                        </div>
                        <p className="text-lg font-semibold text-gray-900">
                          ₹{item.subtotal.toLocaleString('en-IN')}
                        </p>
                      </div>

                      <div className="mt-auto pt-4 flex items-center justify-between">
                        <div className="flex items-center border border-gray-300 rounded-md">
                          <button 
                            type="button"
                            onClick={() => handleUpdate(item.productId, item.quantity, -1, item.stockQuantity, item.isActive)}
                            disabled={!item.isActive || actionLoading === `update-${item.productId}`}
                            className="p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-12 text-center text-sm font-medium text-gray-900">
                            {item.quantity}
                          </span>
                          <button 
                            type="button"
                            onClick={() => handleUpdate(item.productId, item.quantity, 1, item.stockQuantity, item.isActive)}
                            disabled={!item.isActive || item.quantity >= item.stockQuantity || actionLoading === `update-${item.productId}`}
                            className="p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        
                        <button
                          onClick={() => handleRemove(item.productId)}
                          disabled={actionLoading === `remove-${item.productId}`}
                          className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm font-medium disabled:opacity-50"
                        >
                          <Trash2 size={16} /> Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="w-full lg:w-96 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">₹{cart.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-sm italic">Calculated at checkout</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Taxes</span>
                  <span className="text-sm italic">Calculated at checkout</span>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-gray-900">Estimated Total</span>
                  <span className="text-xl font-bold text-gray-900">₹{cart.subtotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Link 
                  to="/checkout"
                  className="w-full bg-primary-600 text-white font-medium py-3 px-4 rounded-md text-center flex items-center justify-center gap-2 hover:bg-primary-700 transition-colors"
                >
                  Proceed to Checkout <ArrowRight size={18} />
                </Link>
                
                <Link 
                  to="/products"
                  className="w-full inline-block text-center text-primary-600 font-medium py-3 px-4 rounded-md hover:bg-primary-50 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
