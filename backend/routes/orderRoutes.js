const express = require('express');
const { 
  createOrder, 
  getMyOrders, 
  getMyOrderById, 
  getAdminOrders, 
  updateOrderStatus,
  createRazorpayOrder,
  verifyPayment,
  razorpayWebhook
} = require('../controllers/orderController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

// Webhook must be BEFORE requireAuth
router.post('/webhook', express.raw({type: 'application/json'}), razorpayWebhook);

router.use(requireAuth);

// Customer routes
router.post('/', createOrder);
router.post('/razorpay', createRazorpayOrder);
router.post('/verify-payment', verifyPayment);
router.get('/', getMyOrders);
router.get('/:id', getMyOrderById);

// Admin routes
router.get('/admin/all', requireRole('admin'), getAdminOrders);
router.patch('/admin/:id/status', requireRole('admin'), updateOrderStatus);

module.exports = router;
