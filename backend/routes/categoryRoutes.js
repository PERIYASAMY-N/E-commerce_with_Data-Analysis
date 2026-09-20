const express = require('express');
const { getCategories, getAllCategoriesAdmin, getCategoryById, createCategory, updateCategory, updateCategoryStatus, deleteCategory } = require('../controllers/categoryController');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', getCategories);
router.get('/admin', requireAuth, requireRole('admin'), getAllCategoriesAdmin);
router.get('/:id', getCategoryById);

router.post('/', requireAuth, requireRole('admin'), createCategory);
router.put('/:id', requireAuth, requireRole('admin'), updateCategory);
router.patch('/:id/status', requireAuth, requireRole('admin'), updateCategoryStatus);
router.delete('/:id', requireAuth, requireRole('admin'), deleteCategory);

module.exports = router;
