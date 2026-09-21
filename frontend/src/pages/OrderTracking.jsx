import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Clock, Package, Truck, ArrowLeft, XCircle } from 'lucide-react';
import orderService from '../services/orderService';

const OrderTracking = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await orderService.getMyOrderById(id);
        setOrder(data.order);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load order tracking details');
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

  // Pre-define chronological steps
  const defaultSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
  
  // Track status mapping for icons
  const iconMap = {
    pending: <Clock size={24} />,
    confirmed: <CheckCircle size={24} />,
    processing: <Package size={24} />,
    shipped: <Truck size={24} />,
    delivered: <CheckCircle size={24} />,
    cancelled: <XCircle size={24} />,
    refunded: <XCircle size={24} />
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Order Placed';
      case 'confirmed': return 'Order Confirmed';
      case 'processing': return 'Processing';
      case 'shipped': return 'Shipped';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      case 'refunded': return 'Refunded';
      default: return status;
    }
  };
  
  const getStatusDesc = (status) => {
    switch (status) {
      case 'pending': return 'Your order has been received';
      case 'confirmed': return 'Your order has been confirmed';
      case 'processing': return 'Your order is being prepared';
      case 'shipped': return 'Your order is on the way';
      case 'delivered': return 'Your order has been delivered';
      case 'cancelled': return 'Your order was cancelled';
      case 'refunded': return 'Your payment was refunded';
      default: return '';
    }
  };

  const historyMap = {};
  if (order.statusHistory) {
    order.statusHistory.forEach(h => {
      historyMap[h.status] = h.changed_at;
    });
  } else {
    historyMap[order.status] = new Date(); 
  }

  const currentStatus = order.status;
  const isCancelled = currentStatus === 'cancelled' || currentStatus === 'refunded';
  
  // Prepare timeline data
  let timeline = [];
  if (isCancelled) {
    timeline = ['pending', 'confirmed', currentStatus].filter(s => historyMap[s]);
    if (!timeline.includes(currentStatus)) {
        timeline.push(currentStatus);
    }
  } else {
    timeline = [...defaultSteps];
  }

  const currentIndex = defaultSteps.indexOf(currentStatus);

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Track Order</h1>
            <p className="text-gray-500 mt-1">Order #{order.order_number}</p>
          </div>
          <Link to={`/orders/${order.id}`} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700">
            <ArrowLeft size={16} /> Back to Order
          </Link>
        </div>

        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden mb-8 p-6 sm:p-10">
          <div className="relative">
            {timeline.map((status, index) => {
              
              let isCompleted = false;
              let isCurrent = false;

              if (isCancelled) {
                 isCompleted = true; // For cancelled flows, show all displayed steps as reached (except styling differently for cancel)
                 isCurrent = status === currentStatus;
              } else {
                 isCompleted = defaultSteps.indexOf(status) <= currentIndex;
                 isCurrent = status === currentStatus;
              }

              const isLast = index === timeline.length - 1;
              const hasDate = historyMap[status];

              return (
                <div key={status} className="flex relative pb-12 last:pb-0">
                  {!isLast && (
                    <div 
                      className={`absolute left-[1.125rem] top-10 bottom-0 w-0.5 -ml-px ${isCompleted && !isCancelled && defaultSteps.indexOf(status) < currentIndex ? 'bg-primary-600' : 'bg-gray-200'}`}
                      aria-hidden="true"
                    />
                  )}
                  
                  <div className="relative flex items-start group">
                    <span className="h-9 flex items-center">
                      <span 
                        className={`relative z-10 w-9 h-9 flex items-center justify-center rounded-full border-2 
                          ${status === 'cancelled' || status === 'refunded' ? 'bg-red-50 border-red-500 text-red-500' : 
                            isCompleted ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-gray-300 text-gray-400'}`}
                      >
                        {iconMap[status] || <div className="w-2.5 h-2.5 rounded-full bg-current" />}
                      </span>
                    </span>
                    <div className="ml-4 min-w-0 flex flex-col">
                      <span className={`text-lg font-semibold ${isCompleted ? (isCancelled && (status === 'cancelled' || status === 'refunded') ? 'text-red-600' : 'text-gray-900') : 'text-gray-500'}`}>
                        {getStatusLabel(status)}
                      </span>
                      <span className="text-sm text-gray-500">{getStatusDesc(status)}</span>
                      {hasDate && (
                        <span className="mt-1 text-sm text-gray-400 font-medium">
                          {new Date(hasDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrderTracking;
