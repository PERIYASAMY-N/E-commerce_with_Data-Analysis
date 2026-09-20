const express = require('express');
const { 
  createOrder, 
  getMyOrders, 
  getMyOrderById, 
  getAdminOrders, 
  updateOrderStatus 
} = require('../controllers/orderController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(requireAuth);

// Customer routes
router.post('/', createOrder);
router.get('/', getMyOrders);
router.get('/:id', getMyOrderById);

// Admin routes
router.get('/admin/all', requireRole('admin'), getAdminOrders);
router.patch('/admin/:id/status', requireRole('admin'), updateOrderStatus);

module.exports = router;
