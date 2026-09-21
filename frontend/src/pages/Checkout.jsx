import React, { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CreditCard, Truck, QrCode } from 'lucide-react';
import useRazorpay from 'react-razorpay';
import { CartContext } from '../context/CartContext';
import orderService from '../services/orderService';
import { AuthContext } from '../context/AuthContext';

const Checkout = () => {
  const { cart, refreshCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [Razorpay] = useRazorpay();

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-sm text-center max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <Link to="/products" className="inline-block bg-primary-600 text-white px-6 py-2 rounded-md font-medium hover:bg-primary-700">
            Return to Shop
          </Link>
        </div>
      </div>
    );
  }

  const handleRazorpayPayment = async (orderData) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: orderData.amount,
      currency: orderData.currency,
      name: import.meta.env.VITE_UPI_MERCHANT_NAME || 'ShopInsight',
      description: 'Order Payment',
      order_id: orderData.razorpayOrderId,
      handler: async (response) => {
        try {
          setLoading(true);
          const verifyResult = await orderService.verifyPayment({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            order_id: orderData.orderId
          });
          
          if (verifyResult.success) {
            await refreshCart();
            navigate(`/orders/${orderData.orderId}/track`, { state: { justPlaced: true } });
          } else {
            setError('Payment verification failed.');
            navigate(`/orders/${orderData.orderId}`); // Let them see it as pending/failed
          }
        } catch (err) {
          setError(err.response?.data?.message || 'Payment verification failed.');
        } finally {
          setLoading(false);
        }
      },
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
      },
      theme: {
        color: '#2563eb', // primary-600
      },
    };

    const rzp = new Razorpay(options);

    rzp.on('payment.failed', function (response) {
      setError(response.error.description || 'Payment failed. Please try again.');
      setLoading(false);
    });

    rzp.open();
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      if (paymentMethod === 'COD') {
        const result = await orderService.createOrder({ paymentMethod });
        await refreshCart();
        navigate(`/orders/${result.data.orderId}/track`, { state: { justPlaced: true } });
      } else {
        // UPI or CARD via Razorpay
        const result = await orderService.createRazorpayOrder({ paymentMethod });
        handleRazorpayPayment(result.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
      setLoading(false); // Only set to false on error, keep loading true if Razorpay opens
    }
  };

  const discount = 0;
  const tax = 0;
  const shipping = cart.subtotal > 0 ? (cart.subtotal > 5000 ? 0 : 100) : 0;
  const total = cart.subtotal - discount + tax + shipping;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        {error && (
          <div className="mb-8 p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
            {error}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Items</h2>
              <div className="space-y-4">
                {cart.items.map(item => (
                  <div key={item.productId} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-4">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.productName} className="w-12 h-12 rounded object-cover" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">Img</div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-medium text-gray-900">₹{item.subtotal.toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Method</h2>
              <div className="space-y-3">
                <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'COD' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="payment" value="COD" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300" />
                  <span className="ml-3 flex items-center gap-2 font-medium text-gray-900">
                    <Truck size={18} className="text-gray-500" /> Cash on Delivery (COD)
                  </span>
                </label>
                <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'UPI' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="payment" value="UPI" checked={paymentMethod === 'UPI'} onChange={() => setPaymentMethod('UPI')} className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300" />
                  <span className="ml-3 flex items-center gap-2 font-medium text-gray-900">
                    <QrCode size={18} className="text-gray-500" /> Pay with UPI (Razorpay)
                  </span>
                </label>
                <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'CARD' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="payment" value="CARD" checked={paymentMethod === 'CARD'} onChange={() => setPaymentMethod('CARD')} className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300" />
                  <span className="ml-3 flex items-center gap-2 font-medium text-gray-900">
                    <CreditCard size={18} className="text-gray-500" /> Credit / Debit Card (Razorpay)
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-96">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 sticky top-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">₹{cart.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="font-medium text-gray-900">{shipping === 0 ? 'Free' : `₹${shipping.toLocaleString('en-IN')}`}</span>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-primary-600">₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button 
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full bg-primary-600 text-white py-4 px-4 rounded-md font-bold text-lg hover:bg-primary-700 disabled:opacity-75 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Processing...' : (paymentMethod === 'COD' ? 'Place Order' : 'Pay Now')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
