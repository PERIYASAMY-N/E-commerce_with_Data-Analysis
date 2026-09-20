const express = require('express');
const { 
  getProducts, 
  getAllProductsAdmin, 
  getProductById, 
  createProduct, 
  updateProduct, 
  updateProductStatus, 
  deleteProduct 
} = require('../controllers/productController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', getProducts);
router.get('/admin', requireAuth, requireRole('admin'), getAllProductsAdmin);
router.get('/:id', getProductById);

router.post('/', requireAuth, requireRole('admin'), createProduct);
router.put('/:id', requireAuth, requireRole('admin'), updateProduct);
router.patch('/:id/status', requireAuth, requireRole('admin'), updateProductStatus);
router.delete('/:id', requireAuth, requireRole('admin'), deleteProduct);

module.exports = router;
