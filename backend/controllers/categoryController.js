const pool = require('../config/db');

const getCategories = async (req, res) => {
  try {
    const [categories] = await pool.query('SELECT * FROM categories WHERE is_active = 1 ORDER BY name ASC');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAllCategoriesAdmin = async (req, res) => {
  try {
    const [categories] = await pool.query('SELECT * FROM categories ORDER BY created_at DESC');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const [categories] = await pool.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    if (categories.length === 0) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json(categories[0]);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, slug, description } = req.body;
    if (!name || !slug) return res.status(400).json({ success: false, message: 'Name and slug are required' });

    await pool.query(
      'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)',
      [name, slug, description || null]
    );
    res.status(201).json({ success: true, message: 'Category created' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Name or slug already exists' });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { name, slug, description } = req.body;
    await pool.query(
      'UPDATE categories SET name = ?, slug = ?, description = ? WHERE id = ?',
      [name, slug, description, req.params.id]
    );
    res.json({ success: true, message: 'Category updated' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Name or slug already exists' });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateCategoryStatus = async (req, res) => {
  try {
    const { is_active } = req.body;
    await pool.query('UPDATE categories SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, req.params.id]);
    res.json({ success: true, message: 'Status updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const [products] = await pool.query('SELECT id FROM products WHERE category_id = ? LIMIT 1', [req.params.id]);
    if (products.length > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete category with existing products. Deactivate it instead.' });
    }
    
    await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getCategories, getAllCategoriesAdmin, getCategoryById, createCategory, updateCategory, updateCategoryStatus, deleteCategory };
