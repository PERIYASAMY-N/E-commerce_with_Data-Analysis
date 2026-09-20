import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import orderService from '../services/orderService';

const OrderDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const justPlaced = location.state?.justPlaced;
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await orderService.getMyOrderById(id);
        setOrder(data.order);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{error || 'Order not found'}</h2>
        <Link to="/orders" className="text-primary-600 hover:underline">View My Orders</Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {justPlaced && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-8 flex items-center gap-3 rounded-r-md shadow-sm">
            <CheckCircle className="text-green-500 h-6 w-6" />
            <div>
              <h3 className="text-green-800 font-bold text-lg">Order Placed Successfully!</h3>
              <p className="text-green-700">Thank you for your purchase. We have received your order.</p>
            </div>
          </div>
        )}

        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
          <Link to="/orders" className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700">
            <ArrowLeft size={16} /> Back to Orders
          </Link>
        </div>

        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden mb-8">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <p className="text-sm text-gray-500 font-medium">Order Number</p>
              <p className="text-lg font-bold text-gray-900">{order.order_number}</p>
            </div>
            <div className="flex gap-4">
              <div>
                <p className="text-sm text-gray-500 font-medium">Date</p>
                <p className="font-medium text-gray-900">{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Status</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                  {order.status}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Items Ordered</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="pb-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                    <th className="pb-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="pb-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.items.map(item => (
                    <tr key={item.id}>
                      <td className="py-4 text-sm font-medium text-gray-900">{item.product_name}</td>
                      <td className="py-4 text-sm text-gray-500 text-center">{item.quantity}</td>
                      <td className="py-4 text-sm text-gray-500 text-right">₹{parseFloat(item.unit_price).toLocaleString('en-IN')}</td>
                      <td className="py-4 text-sm font-medium text-gray-900 text-right">₹{parseFloat(item.subtotal).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 border-t border-gray-200 pt-6">
              <div className="flex justify-end">
                <dl className="space-y-3 text-sm text-gray-600 w-full sm:w-64">
                  <div className="flex justify-between">
                    <dt>Subtotal</dt>
                    <dd className="font-medium text-gray-900">₹{parseFloat(order.subtotal).toLocaleString('en-IN')}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Shipping</dt>
                    <dd className="font-medium text-gray-900">{parseFloat(order.shipping_amount) === 0 ? 'Free' : `₹${parseFloat(order.shipping_amount).toLocaleString('en-IN')}`}</dd>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-3 text-base">
                    <dt className="font-bold text-gray-900">Total</dt>
                    <dd className="font-bold text-primary-600">₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">Payment Information</h3>
            <div className="flex flex-col sm:flex-row gap-8">
              <div>
                <p className="text-sm text-gray-500 mb-1">Method</p>
                <p className="text-sm font-medium text-gray-900">{order.payment_method}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-800 capitalize">
                  {order.payment_status}
                </span>
              </div>
              {order.payment_reference && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Reference ID</p>
                  <p className="text-sm font-medium text-gray-900">{order.payment_reference}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Link to="/products" className="bg-primary-600 text-white px-6 py-2 rounded-md font-medium hover:bg-primary-700 transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
