const pool = require('../config/db');

const getCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    const query = `
      SELECT 
        ci.id as cart_item_id,
        ci.product_id,
        ci.quantity,
        p.name as product_name,
        p.price as unit_price,
        p.image_url,
        p.stock_quantity,
        p.is_active
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
    `;
    const [items] = await pool.query(query, [userId]);

    let subtotal = 0;
    let itemCount = 0;

    const formattedItems = items.map(item => {
      const itemSubtotal = parseFloat(item.unit_price) * item.quantity;
      subtotal += itemSubtotal;
      itemCount += item.quantity;

      return {
        id: item.cart_item_id,
        productId: item.product_id,
        productName: item.product_name,
        imageUrl: item.image_url,
        unitPrice: parseFloat(item.unit_price),
        quantity: item.quantity,
        subtotal: itemSubtotal,
        stockQuantity: item.stock_quantity,
        isActive: item.is_active === 1
      };
    });

    res.json({
      success: true,
      cart: {
        items: formattedItems,
        itemCount,
        subtotal
      }
    });
  } catch (error) {
    console.error('getCart Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const addToCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined || quantity <= 0 || !Number.isInteger(quantity)) {
      return res.status(400).json({ success: false, message: 'Invalid product or quantity' });
    }

    const [products] = await pool.query('SELECT stock_quantity, is_active FROM products WHERE id = ?', [productId]);
    if (products.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const product = products[0];
    if (product.is_active === 0) {
      return res.status(400).json({ success: false, message: 'Product is currently unavailable' });
    }

    const [existingItem] = await pool.query('SELECT quantity FROM cart_items WHERE user_id = ? AND product_id = ?', [userId, productId]);
    
    let newQuantity = quantity;
    if (existingItem.length > 0) {
      newQuantity += existingItem[0].quantity;
    }

    if (newQuantity > product.stock_quantity) {
      return res.status(400).json({ success: false, message: `Only ${product.stock_quantity} units are currently available.` });
    }

    if (existingItem.length > 0) {
      await pool.query(
        'UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?',
        [newQuantity, userId, productId]
      );
    } else {
      await pool.query(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [userId, productId, quantity]
      );
    }

    res.json({ success: true, message: 'Added to cart' });
  } catch (error) {
    console.error('addToCart Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const productId = req.params.productId;
    const { quantity } = req.body;

    if (quantity === undefined || quantity <= 0 || !Number.isInteger(quantity)) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive integer' });
    }

    const [products] = await pool.query('SELECT stock_quantity, is_active FROM products WHERE id = ?', [productId]);
    if (products.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const product = products[0];
    if (product.is_active === 0) {
      return res.status(400).json({ success: false, message: 'Product is currently unavailable' });
    }

    if (quantity > product.stock_quantity) {
      return res.status(400).json({ success: false, message: `Only ${product.stock_quantity} units are currently available.` });
    }

    const [result] = await pool.query(
      'UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?',
      [quantity, userId, productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    res.json({ success: true, message: 'Cart updated' });
  } catch (error) {
    console.error('updateCartItem Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const productId = req.params.productId;

    await pool.query('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', [userId, productId]);
    
    res.json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    console.error('removeFromCart Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const clearCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    await pool.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);
    
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    console.error('clearCart Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};
