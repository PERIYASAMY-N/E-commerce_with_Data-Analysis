import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, AlertCircle, ShoppingCart } from 'lucide-react';
import productService from '../services/productService';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';

const ProductDetails = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await productService.getProduct(slug);
        setProduct(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/products/${slug}` } } });
      return;
    }

    setAddingToCart(true);
    try {
      await addToCart(product.id, quantity);
      // Optional: show a success toast here
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{error || 'Product not found'}</h2>
        <Link to="/products" className="text-primary-600 hover:underline flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/products" className="text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center gap-2 mb-8 w-max">
          <ArrowLeft size={16} /> Back to Catalog
        </Link>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            <div className="bg-gray-100 p-8 flex items-center justify-center min-h-[400px]">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="max-w-full h-auto rounded-lg shadow-sm" />
              ) : (
                <div className="text-gray-400 font-medium text-lg">No image available</div>
              )}
            </div>

            <div className="p-8 md:p-12 flex flex-col">
              <div className="mb-2 flex items-center justify-between">
                <span className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                  {product.category.name}
                </span>
                {!product.isActive && (
                  <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                    Inactive
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
              
              <p className="text-4xl font-bold text-gray-900 mb-6">
                ₹{parseFloat(product.price).toLocaleString('en-IN')}
              </p>

              <div className="prose prose-sm text-gray-600 mb-8">
                <p>{product.description || 'No description provided.'}</p>
              </div>

              <div className="mt-auto">
                <div className="mb-6 flex items-center gap-2">
                  {product.stockQuantity > 5 ? (
                    <><Check size={18} className="text-green-500" /><span className="text-sm font-medium text-green-700">In Stock ({product.stockQuantity} available)</span></>
                  ) : product.stockQuantity > 0 ? (
                    <><AlertCircle size={18} className="text-orange-500" /><span className="text-sm font-medium text-orange-700">Low Stock (Only {product.stockQuantity} left)</span></>
                  ) : (
                    <><AlertCircle size={18} className="text-red-500" /><span className="text-sm font-medium text-red-700">Out of Stock</span></>
                  )}
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  {product.isActive && product.stockQuantity > 0 ? (
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-shrink-0 flex items-center border border-gray-300 rounded-md bg-white">
                        <button 
                          className="px-4 py-2 text-gray-600 hover:bg-gray-50"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        >-</button>
                        <span className="w-12 text-center text-sm font-medium text-gray-900">{quantity}</span>
                        <button 
                          className="px-4 py-2 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                          onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                          disabled={quantity >= product.stockQuantity}
                        >+</button>
                      </div>
                      <button 
                        onClick={handleAddToCart}
                        disabled={addingToCart}
                        className="flex-1 bg-primary-600 text-white font-medium py-3 px-4 rounded-md hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
                      >
                        <ShoppingCart size={18} />
                        {addingToCart ? 'Adding...' : 'Add to Cart'}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-sm font-medium text-red-600">
                        {!product.isActive ? 'This product is currently unavailable.' : 'Out of stock'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
