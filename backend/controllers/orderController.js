const pool = require('../config/db');

const generateOrderNumber = () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SI-${dateStr}-${randomStr}`;
};

const createOrder = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const userId = req.user.userId;
    const { paymentMethod = 'COD' } = req.body;
    
    await connection.beginTransaction();

    const [cartItems] = await connection.query(
      'SELECT product_id, quantity FROM cart_items WHERE user_id = ?', 
      [userId]
    );

    if (cartItems.length === 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Your cart is empty.' });
    }

    const productIds = cartItems.map(item => item.product_id).sort((a, b) => a - b);

    const [products] = await connection.query(
      'SELECT id, name, price, stock_quantity, is_active FROM products WHERE id IN (?) FOR UPDATE',
      [productIds]
    );

    let subtotal = 0;
    const orderItems = [];
    const stockUpdates = [];

    const productMap = products.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});

    for (const item of cartItems) {
      const product = productMap[item.product_id];

      if (!product) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: 'A product in your cart no longer exists.' });
      }

      if (!product.is_active) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: `Product "${product.name}" is no longer available.` });
      }

      if (item.quantity > product.stock_quantity) {
        await connection.rollback();
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for "${product.name}". Available: ${product.stock_quantity}, Requested: ${item.quantity}` 
        });
      }

      const unitPrice = parseFloat(product.price);
      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        unit_price: unitPrice,
        quantity: item.quantity,
        subtotal: itemSubtotal
      });

      stockUpdates.push({
        id: product.id,
        new_quantity: product.stock_quantity - item.quantity
      });
    }

    const discount = 0;
    const tax = 0;
    const shipping = subtotal > 0 ? (subtotal > 5000 ? 0 : 100) : 0;
    const total = subtotal - discount + tax + shipping;

    const orderNumber = generateOrderNumber();
    const orderStatus = 'confirmed';

    const [orderResult] = await connection.query(
      `INSERT INTO orders 
       (user_id, order_number, status, subtotal, discount_amount, tax_amount, shipping_amount, total_amount) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, orderNumber, orderStatus, subtotal, discount, tax, shipping, total]
    );
    
    const orderId = orderResult.insertId;

    for (const item of orderItems) {
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.product_name, item.unit_price, item.quantity, item.subtotal]
      );
    }

    const paymentStatus = paymentMethod === 'COD' ? 'pending' : 'paid';
    const paymentRef = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    await connection.query(
      `INSERT INTO payments (order_id, payment_reference, payment_method, amount, status)
       VALUES (?, ?, ?, ?, ?)`,
      [orderId, paymentRef, paymentMethod, total, paymentStatus]
    );

    for (const update of stockUpdates) {
      const [updateResult] = await connection.query(
        'UPDATE products SET stock_quantity = ? WHERE id = ? AND stock_quantity >= ?',
        [update.new_quantity, update.id, update.new_quantity]
      );
      if (updateResult.affectedRows === 0) {
        throw new Error('Failed to update inventory safely');
      }
    }

    await connection.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);

    await connection.commit();

    res.json({
      success: true,
      message: 'Order placed successfully',
      data: {
        orderId,
        orderNumber,
        totalAmount: total
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Checkout Transaction Error:', error);
    res.status(500).json({ success: false, message: 'Failed to process order' });
  } finally {
    connection.release();
  }
};

const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.userId;
    const [orders] = await pool.query(
      `SELECT o.*, p.payment_method, p.status as payment_status 
       FROM orders o 
       LEFT JOIN payments p ON o.id = p.order_id 
       WHERE o.user_id = ? 
       ORDER BY o.created_at DESC`,
      [userId]
    );
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getMyOrderById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const orderId = req.params.id;
    
    const [orders] = await pool.query(
      `SELECT o.*, p.payment_method, p.payment_reference, p.status as payment_status 
       FROM orders o 
       LEFT JOIN payments p ON o.id = p.order_id 
       WHERE o.id = ? AND o.user_id = ?`,
      [orderId, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const [items] = await pool.query(
      'SELECT * FROM order_items WHERE order_id = ?',
      [orderId]
    );

    res.json({ success: true, order: { ...orders[0], items } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAdminOrders = async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT o.*, u.name as customer_name, u.email as customer_email, p.payment_method, p.status as payment_status 
       FROM orders o 
       JOIN users u ON o.user_id = u.id
       LEFT JOIN payments p ON o.id = p.order_id 
       ORDER BY o.created_at DESC`
    );
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateOrderStatus = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      connection.release();
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    await connection.beginTransaction();

    const [orders] = await connection.query('SELECT status FROM orders WHERE id = ? FOR UPDATE', [orderId]);
    if (orders.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const currentStatus = orders[0].status;

    if (currentStatus === 'cancelled') {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: 'Cannot update a cancelled order.' });
    }

    if (status === 'cancelled' || status === 'refunded') {
      if (currentStatus !== 'cancelled' && currentStatus !== 'refunded') {
        const [items] = await connection.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderId]);
        for (const item of items) {
          await connection.query(
            'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
            [item.quantity, item.product_id]
          );
        }
      }
    }

    await connection.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);

    if (status === 'refunded') {
      await connection.query('UPDATE payments SET status = "refunded" WHERE order_id = ?', [orderId]);
    }

    await connection.commit();
    res.json({ success: true, message: 'Order status updated' });
  } catch (error) {
    await connection.rollback();
    console.error('Update Order Status Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    connection.release();
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getMyOrderById,
  getAdminOrders,
  updateOrderStatus
};
