const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const {
    validateDates,
    getSummary,
    getSalesTrend,
    getTopProducts,
    getTopCategories,
    getTopCustomers,
    getProductPerformance,
    getCategoryPerformance,
    getOrdersBreakdown,
    getPaymentSummary
} = require('../controllers/analyticsController');

const router = express.Router();

// All analytics routes are admin-only
router.use(requireAuth, requireRole('admin'), validateDates);

router.get('/summary', getSummary);
router.get('/sales-trend', getSalesTrend);
router.get('/top-products', getTopProducts);
router.get('/top-categories', getTopCategories);
router.get('/top-customers', getTopCustomers);
router.get('/product-performance', getProductPerformance);
router.get('/category-performance', getCategoryPerformance);
router.get('/orders-breakdown', getOrdersBreakdown);
router.get('/payment-summary', getPaymentSummary);

module.exports = router;
