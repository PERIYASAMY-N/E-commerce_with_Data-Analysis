import React, { useState, useEffect, useCallback } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, Package, ShoppingBag, CreditCard, RefreshCw, AlertCircle, BarChart3, Users } from 'lucide-react';
import analyticsApi from '../../services/analyticsApi';

// Reusable Formatters
const formatCurrency = (value) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);

const formatNumber = (value) => 
  new Intl.NumberFormat('en-IN').format(value || 0);

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

// Sub-components
const KPICard = ({ title, value, icon: Icon, subtitle, loading }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start gap-4">
    <div className="p-3 bg-primary-50 rounded-lg text-primary-600">
      <Icon size={24} />
    </div>
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      {loading ? (
        <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4 mb-1"></div>
      ) : (
        <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      )}
      {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
    </div>
  </div>
);

const AdminAnalytics = () => {
  // Filters State
  const defaultYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${defaultYear}-01-01`);
  const [endDate, setEndDate] = useState(`${defaultYear}-12-31`);
  const [activeStartDate, setActiveStartDate] = useState(`${defaultYear}-01-01`);
  const [activeEndDate, setActiveEndDate] = useState(`${defaultYear}-12-31`);
  
  // Data State
  const [summary, setSummary] = useState(null);
  const [salesTrend, setSalesTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [categoryPerf, setCategoryPerf] = useState([]);
  const [orderStatus, setOrderStatus] = useState({});
  const [paymentSummary, setPaymentSummary] = useState([]);
  
  // UI State
  const [groupBy, setGroupBy] = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateError, setDateError] = useState('');

  const fetchAnalytics = useCallback(async (start, end, group) => {
    setLoading(true);
    setError(null);
    try {
      const [sumData, trendData, prodData, catData, orderData, payData] = await Promise.all([
        analyticsApi.getSummary(start, end),
        analyticsApi.getSalesTrend(start, end, group),
        analyticsApi.getTopProducts(start, end, 10),
        analyticsApi.getCategoryPerformance(start, end),
        analyticsApi.getOrdersBreakdown(start, end),
        analyticsApi.getPaymentSummary(start, end)
      ]);

      setSummary(sumData.data);
      setSalesTrend(trendData.data);
      setTopProducts(prodData.data);
      setCategoryPerf(catData.data);
      setOrderStatus(orderData.data);
      setPaymentSummary(payData.data);
      
      setActiveStartDate(start);
      setActiveEndDate(end);
    } catch (err) {
      setError('Unable to load sales analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(startDate, endDate, groupBy);
  }, [fetchAnalytics, startDate, endDate, groupBy]); // Initial load

  const handleApplyFilters = () => {
    setDateError('');
    if (startDate > endDate) {
      setDateError('Start date cannot be after end date.');
      return;
    }
    fetchAnalytics(startDate, endDate, groupBy);
  };

  const handleRefresh = () => {
    fetchAnalytics(activeStartDate, activeEndDate, groupBy);
  };

  const handleGroupByChange = (e) => {
    const newGroup = e.target.value;
    setGroupBy(newGroup);
    fetchAnalytics(activeStartDate, activeEndDate, newGroup);
  };

  // Quick ranges
  const setQuickRange = (type) => {
    const today = new Date();
    let start = '';
    let end = today.toISOString().split('T')[0];

    if (type === 'thisMonth') {
      start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    } else if (type === 'last30') {
      const d = new Date();
      d.setDate(today.getDate() - 30);
      start = d.toISOString().split('T')[0];
    } else if (type === 'thisYear') {
      start = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
    }
    
    setStartDate(start);
    setEndDate(end);
    fetchAnalytics(start, end, groupBy);
  };

  const hasData = summary && summary.totalOrders > 0;

  // Format order status for PieChart
  const orderStatusData = Object.entries(orderStatus || {})
    .filter(([_, val]) => val > 0)
    .map(([key, val]) => ({ name: key, value: val }));

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header & Filters */}
      <div className="flex flex-col xl:flex-row xl:justify-between xl:items-end gap-6 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="text-primary-600" /> Sales Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor revenue, orders, products, and sales performance.
          </p>
          <p className="text-xs font-medium text-primary-600 mt-2 bg-primary-50 inline-block px-2 py-1 rounded">
            Showing sales from {activeStartDate} to {activeEndDate}
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" className="border border-gray-300 rounded px-3 py-1.5 text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
              <input type="date" className="border border-gray-300 rounded px-3 py-1.5 text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <button onClick={handleApplyFilters} className="bg-primary-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-primary-700">Apply</button>
            <button onClick={handleRefresh} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded border border-gray-200"><RefreshCw size={18} /></button>
          </div>
          
          {dateError && <p className="text-xs text-red-600 font-medium">{dateError}</p>}
          
          <div className="flex gap-2 text-xs">
            <button onClick={() => setQuickRange('last30')} className="text-primary-600 hover:underline">Last 30 Days</button>
            <span className="text-gray-300">|</span>
            <button onClick={() => setQuickRange('thisMonth')} className="text-primary-600 hover:underline">This Month</button>
            <span className="text-gray-300">|</span>
            <button onClick={() => setQuickRange('thisYear')} className="text-primary-600 hover:underline">This Year</button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-red-700 flex items-center gap-3">
          <AlertCircle size={20} />
          <div>
            <p className="font-medium">{error}</p>
            <button onClick={handleRefresh} className="text-sm underline mt-1 hover:text-red-900">Retry</button>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <KPICard title="Total Revenue" value={formatCurrency(summary?.totalRevenue)} icon={TrendingUp} loading={loading} />
            <KPICard title="Total Orders" value={formatNumber(summary?.totalOrders)} icon={ShoppingBag} loading={loading} />
            <KPICard title="Units Sold" value={formatNumber(summary?.totalUnitsSold)} icon={Package} loading={loading} />
            <KPICard title="Average Order Value" value={formatCurrency(summary?.averageOrderValue)} icon={CreditCard} loading={loading} />
            <KPICard title="Average Selling Price" value={formatCurrency(summary?.averageSellingPrice)} icon={BarChart3} loading={loading} />
          </div>

          {!hasData && !loading ? (
            <div className="bg-white p-12 rounded-xl border border-gray-200 text-center shadow-sm">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No sales data for the selected period.</h3>
              <p className="text-gray-500 mt-2">Adjust your date filters to view analytics.</p>
            </div>
          ) : (
            <>
              {/* Main Charts Area */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Sales Trend */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-gray-900">Sales Trend</h2>
                    <select 
                      value={groupBy} 
                      onChange={handleGroupByChange}
                      className="border border-gray-300 rounded text-sm px-2 py-1"
                      disabled={loading}
                    >
                      <option value="day">Daily</option>
                      <option value="month">Monthly</option>
                      <option value="year">Yearly</option>
                    </select>
                  </div>
                  <div className="h-80">
                    {loading ? (
                      <div className="w-full h-full bg-gray-50 animate-pulse rounded"></div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={salesTrend} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                          <YAxis 
                            yAxisId="left" 
                            tickFormatter={(value) => `₹${value / 1000}k`} 
                            tick={{ fontSize: 12, fill: '#64748b' }} 
                            axisLine={false} 
                            tickLine={false} 
                          />
                          <RechartsTooltip 
                            formatter={(value, name) => [
                              name === 'Revenue' ? formatCurrency(value) : formatNumber(value), 
                              name
                            ]}
                            labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                          <Legend wrapperStyle={{ fontSize: '12px' }}/>
                          <Line yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Order Status Breakdown */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900 mb-6">Order Status</h2>
                  <div className="h-64">
                    {loading ? (
                      <div className="w-full h-full bg-gray-50 animate-pulse rounded flex items-center justify-center rounded-full mx-auto" style={{ width: '200px' }}></div>
                    ) : orderStatusData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={orderStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {orderStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(value) => formatNumber(value)} />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400 text-sm">No data</div>
                    )}
                  </div>
                  
                  {/* Payment Summary Snippet */}
                  {!loading && paymentSummary.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Payment Methods</h3>
                      <div className="space-y-2">
                        {paymentSummary.slice(0,3).map((p, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-gray-500 uppercase">{p.paymentMethod}</span>
                            <span className="font-medium text-gray-900">{formatCurrency(p.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Data Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Top Products */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Top Products by Revenue</h2>
                  </div>
                  <div className="flex-1 overflow-x-auto">
                    {loading ? (
                      <div className="p-6 space-y-4">
                        {[1,2,3,4,5].map(i => <div key={i} className="h-8 bg-gray-50 animate-pulse rounded"></div>)}
                      </div>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Units</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Orders</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {topProducts.length === 0 ? (
                            <tr><td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">No product sales found</td></tr>
                          ) : topProducts.map((p, i) => (
                            <tr key={p.productId || i} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.productName}</td>
                              <td className="px-6 py-4 text-sm text-gray-500 text-right">{formatNumber(p.unitsSold)}</td>
                              <td className="px-6 py-4 text-sm text-gray-500 text-right">{formatNumber(p.ordersCount)}</td>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">{formatCurrency(p.revenue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Category Performance */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Category Performance</h2>
                  </div>
                  <div className="flex-1 overflow-x-auto">
                    {loading ? (
                      <div className="p-6 space-y-4">
                        {[1,2,3,4,5].map(i => <div key={i} className="h-8 bg-gray-50 animate-pulse rounded"></div>)}
                      </div>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Products</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Units</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {categoryPerf.length === 0 ? (
                            <tr><td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">No category performance data found</td></tr>
                          ) : categoryPerf.map((c, i) => (
                            <tr key={c.categoryId || i} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.categoryName || 'Unknown'}</td>
                              <td className="px-6 py-4 text-sm text-gray-500 text-right">{formatNumber(c.productCount)}</td>
                              <td className="px-6 py-4 text-sm text-gray-500 text-right">{formatNumber(c.unitsSold)}</td>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">{formatCurrency(c.revenue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Optional: Refunds / Cancellations specific notice if there are any */}
              {(summary?.refundedRevenue > 0 || summary?.cancelledOrders > 0) && (
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex gap-6 text-sm text-orange-800 items-center justify-between">
                  <div>
                    <span className="font-semibold block">Lost Revenue Tracking</span>
                    This period includes {formatNumber(summary.cancelledOrders)} cancelled orders and {formatNumber(summary.refundedOrders)} refunds ({formatCurrency(summary.refundedRevenue)}). These are cleanly excluded from main gross revenue metrics above.
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AdminAnalytics;
