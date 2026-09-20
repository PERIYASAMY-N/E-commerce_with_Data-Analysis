const pool = require('../config/db');

const getProducts = async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, sort, page = 1, limit = 12 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const offset = (pageNum - 1) * limitNum;

    let query = `
      SELECT p.*, c.name as category_name, c.slug as category_slug 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.is_active = 1
    `;
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.is_active = 1
    `;
    const queryParams = [];

    if (search) {
      query += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
      countQuery += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      if (!isNaN(category)) {
        query += ` AND p.category_id = ?`;
        countQuery += ` AND p.category_id = ?`;
        queryParams.push(category);
      } else {
        query += ` AND c.slug = ?`;
        countQuery += ` AND c.slug = ?`;
        queryParams.push(category);
      }
    }

    if (minPrice) {
      query += ` AND p.price >= ?`;
      countQuery += ` AND p.price >= ?`;
      queryParams.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      query += ` AND p.price <= ?`;
      countQuery += ` AND p.price <= ?`;
      queryParams.push(parseFloat(maxPrice));
    }

    const sortOptions = {
      price_asc: 'p.price ASC',
      price_desc: 'p.price DESC',
      name_asc: 'p.name ASC',
      name_desc: 'p.name DESC',
      newest: 'p.created_at DESC',
      oldest: 'p.created_at ASC'
    };

    const orderBy = sortOptions[sort] || 'p.created_at DESC';
    query += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
    
    const [countResult] = await pool.query(countQuery, queryParams);
    const total = countResult[0].total;

    queryParams.push(limitNum, offset);
    const [products] = await pool.query(query, queryParams);

    const formattedProducts = products.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      stockQuantity: p.stock_quantity,
      imageUrl: p.image_url,
      isActive: p.is_active === 1,
      category: {
        id: p.category_id,
        name: p.category_name,
        slug: p.category_slug
      }
    }));

    res.json({
      products: formattedProducts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('getProducts Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAllProductsAdmin = async (req, res) => {
  try {
    const { search, category, status, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const offset = (pageNum - 1) * limitNum;

    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE 1=1
    `;
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM products p 
      WHERE 1=1
    `;
    const queryParams = [];

    if (search) {
      query += ` AND (p.name LIKE ? OR p.slug LIKE ?)`;
      countQuery += ` AND (p.name LIKE ? OR p.slug LIKE ?)`;
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      query += ` AND p.category_id = ?`;
      countQuery += ` AND p.category_id = ?`;
      queryParams.push(category);
    }

    if (status !== undefined && status !== '') {
      const isActive = status === 'active' ? 1 : 0;
      query += ` AND p.is_active = ?`;
      countQuery += ` AND p.is_active = ?`;
      queryParams.push(isActive);
    }

    query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    
    const [countResult] = await pool.query(countQuery, queryParams);
    const total = countResult[0].total;

    queryParams.push(limitNum, offset);
    const [products] = await pool.query(query, queryParams);

    res.json({
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getProductById = async (req, res) => {
  try {
    const [products] = await pool.query(`
      SELECT p.*, c.name as category_name, c.slug as category_slug 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.id = ? OR p.slug = ?
    `, [req.params.id, req.params.id]);

    if (products.length === 0) return res.status(404).json({ success: false, message: 'Product not found' });
    
    const p = products[0];
    res.json({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      stockQuantity: p.stock_quantity,
      imageUrl: p.image_url,
      isActive: p.is_active === 1,
      category: {
        id: p.category_id,
        name: p.category_name,
        slug: p.category_slug
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createProduct = async (req, res) => {
  try {
    const { categoryId, name, description, price, stockQuantity, imageUrl } = req.body;

    const errors = {};
    if (!categoryId) errors.categoryId = 'Category is required';
    if (!name || name.trim() === '') errors.name = 'Name is required';
    if (price === undefined || price < 0) errors.price = 'Price must be >= 0';
    if (stockQuantity === undefined || stockQuantity < 0) errors.stockQuantity = 'Stock must be >= 0';
    
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const [existing] = await pool.query('SELECT id FROM products WHERE slug = ?', [slug]);
    let finalSlug = slug;
    if (existing.length > 0) {
      finalSlug = `${slug}-${Date.now()}`;
    }

    const [catExists] = await pool.query('SELECT id FROM categories WHERE id = ?', [categoryId]);
    if (catExists.length === 0) return res.status(400).json({ success: false, message: 'Category does not exist' });

    await pool.query(
      'INSERT INTO products (category_id, name, slug, description, price, stock_quantity, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [categoryId, name.trim(), finalSlug, description || null, price, stockQuantity, imageUrl || null]
    );

    res.status(201).json({ success: true, message: 'Product created' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { categoryId, name, description, price, stockQuantity, imageUrl } = req.body;

    const errors = {};
    if (!categoryId) errors.categoryId = 'Category is required';
    if (!name || name.trim() === '') errors.name = 'Name is required';
    if (price === undefined || price < 0) errors.price = 'Price must be >= 0';
    if (stockQuantity === undefined || stockQuantity < 0) errors.stockQuantity = 'Stock must be >= 0';
    
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    await pool.query(
      'UPDATE products SET category_id = ?, name = ?, description = ?, price = ?, stock_quantity = ?, image_url = ? WHERE id = ?',
      [categoryId, name.trim(), description || null, price, stockQuantity, imageUrl || null, req.params.id]
    );

    res.json({ success: true, message: 'Product updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateProductStatus = async (req, res) => {
  try {
    const { is_active } = req.body;
    await pool.query('UPDATE products SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, req.params.id]);
    res.json({ success: true, message: 'Product status updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const [orderItems] = await pool.query('SELECT id FROM order_items WHERE product_id = ? LIMIT 1', [req.params.id]);
    if (orderItems.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product has historical orders and cannot be physically deleted. Please deactivate it instead.' 
      });
    }

    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Product safely deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getProducts,
  getAllProductsAdmin,
  getProductById,
  createProduct,
  updateProduct,
  updateProductStatus,
  deleteProduct
};
