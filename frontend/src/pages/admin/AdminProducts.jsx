import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Power, PowerOff } from 'lucide-react';
import productService from '../../services/productService';
import categoryService from '../../services/categoryService';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState({ 
    id: null, name: '', categoryId: '', description: '', price: '', stockQuantity: '', imageUrl: '' 
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page]);

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories');
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await productService.getAdminProducts({ page, limit: 10 });
      setProducts(data.products);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setCurrentProduct({ id: null, name: '', categoryId: '', description: '', price: '', stockQuantity: '', imageUrl: '' });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (prod) => {
    setCurrentProduct({
      id: prod.id,
      name: prod.name,
      categoryId: prod.category_id,
      description: prod.description || '',
      price: prod.price,
      stockQuantity: prod.stock_quantity,
      imageUrl: prod.image_url || ''
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await productService.updateProduct(currentProduct.id, currentProduct);
      } else {
        await productService.createProduct(currentProduct);
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save product');
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await productService.updateProductStatus(id, !currentStatus);
      fetchProducts();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product? (Will fail if used in orders)')) {
      try {
        await productService.deleteProduct(id);
        fetchProducts();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete product');
      }
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
        <button onClick={openAddModal} className="bg-primary-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-primary-500">
          <Plus size={18} /> Add Product
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">{error}</div>}

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="6" className="text-center py-8">Loading...</td></tr>
            ) : products.map(prod => (
              <tr key={prod.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{prod.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{prod.category_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{parseFloat(prod.price).toLocaleString('en-IN')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{prod.stock_quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${prod.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {prod.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-3">
                  <button onClick={() => openEditModal(prod)} className="text-blue-600 hover:text-blue-900"><Edit size={18} /></button>
                  <button onClick={() => toggleStatus(prod.id, prod.is_active)} className={`${prod.is_active ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}>
                    {prod.is_active ? <PowerOff size={18} /> : <Power size={18} />}
                  </button>
                  <button onClick={() => handleDelete(prod.id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex justify-between items-center">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 border rounded-md disabled:opacity-50 bg-white">Previous</button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 border rounded-md disabled:opacity-50 bg-white">Next</button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-md w-full my-8">
            <h2 className="text-xl font-bold mb-4">{isEditing ? 'Edit Product' : 'Add Product'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" required className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" value={currentProduct.name} onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select required className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" value={currentProduct.categoryId} onChange={e => setCurrentProduct({...currentProduct, categoryId: e.target.value})}>
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
                <input type="number" step="0.01" min="0" required className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" value={currentProduct.price} onChange={e => setCurrentProduct({...currentProduct, price: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Stock Quantity</label>
                <input type="number" min="0" required className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" value={currentProduct.stockQuantity} onChange={e => setCurrentProduct({...currentProduct, stockQuantity: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Image URL</label>
                <input type="url" className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" value={currentProduct.imageUrl} onChange={e => setCurrentProduct({...currentProduct, imageUrl: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" rows="3" value={currentProduct.description} onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
