const pool = require('../config/db');

const getDateFilterSql = (startDate, endDate, prefix = 'o') => {
    let sql = '';
    const params = [];
    
    if (startDate) {
        sql += ` AND ${prefix}.order_date >= ?`;
        params.push(startDate);
    }
    if (endDate) {
        sql += ` AND ${prefix}.order_date < DATE_ADD(?, INTERVAL 1 DAY)`;
        params.push(endDate);
    }
    
    return { sql, params };
};

const getSummary = async (startDate, endDate) => {
    const { sql: dateSql, params: dateParams } = getDateFilterSql(startDate, endDate, 'o');
    
    const query = `
        SELECT 
            COALESCE(SUM(CASE WHEN o.status IN ('confirmed', 'processing', 'shipped', 'delivered') THEN oi.subtotal ELSE 0 END), 0) AS totalRevenue,
            COUNT(DISTINCT CASE WHEN o.status IN ('confirmed', 'processing', 'shipped', 'delivered') THEN o.id END) AS totalOrders,
            COALESCE(SUM(CASE WHEN o.status IN ('confirmed', 'processing', 'shipped', 'delivered') THEN oi.quantity ELSE 0 END), 0) AS totalUnitsSold,
            COALESCE(SUM(CASE WHEN o.status = 'refunded' THEN oi.subtotal ELSE 0 END), 0) AS refundedRevenue,
            COUNT(DISTINCT CASE WHEN o.status = 'refunded' THEN o.id END) AS refundedOrders,
            COUNT(DISTINCT CASE WHEN o.status = 'cancelled' THEN o.id END) AS cancelledOrders
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE 1=1 ${dateSql}
    `;
    
    const [rows] = await pool.query(query, dateParams);
    const summary = rows[0];
    
    const totalOrders = parseInt(summary.totalOrders || 0);
    const totalUnitsSold = parseInt(summary.totalUnitsSold || 0);
    const totalRevenue = parseFloat(summary.totalRevenue || 0);
    
    return {
        totalRevenue,
        totalOrders,
        totalUnitsSold,
        averageOrderValue: totalOrders > 0 ? parseFloat((totalRevenue / totalOrders).toFixed(2)) : 0,
        averageSellingPrice: totalUnitsSold > 0 ? parseFloat((totalRevenue / totalUnitsSold).toFixed(2)) : 0,
        refundedRevenue: parseFloat(summary.refundedRevenue || 0),
        refundedOrders: parseInt(summary.refundedOrders || 0),
        cancelledOrders: parseInt(summary.cancelledOrders || 0)
    };
};

const getSalesTrend = async (startDate, endDate, groupBy = 'month') => {
    const { sql: dateSql, params: dateParams } = getDateFilterSql(startDate, endDate, 'o');
    
    let groupExpr = '';
    if (groupBy === 'day') {
        groupExpr = "DATE(o.order_date)";
    } else if (groupBy === 'year') {
        groupExpr = "YEAR(o.order_date)";
    } else {
        // default month
        groupExpr = "DATE_FORMAT(o.order_date, '%Y-%m')";
    }

    const query = `
        SELECT 
            ${groupExpr} AS period,
            COALESCE(SUM(oi.subtotal), 0) AS revenue,
            COUNT(DISTINCT o.id) AS orders,
            COALESCE(SUM(oi.quantity), 0) AS unitsSold
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE o.status IN ('confirmed', 'processing', 'shipped', 'delivered')
        ${dateSql}
        GROUP BY period
        ORDER BY period ASC
    `;
    
    const [rows] = await pool.query(query, dateParams);
    return rows.map(r => ({
        period: String(r.period),
        revenue: parseFloat(r.revenue),
        orders: parseInt(r.orders),
        unitsSold: parseInt(r.unitsSold)
    }));
};

const getTopProducts = async (startDate, endDate, limit = 10) => {
    const { sql: dateSql, params: dateParams } = getDateFilterSql(startDate, endDate, 'o');
    const safeLimit = Math.max(1, Math.min(parseInt(limit) || 10, 50));
    
    const query = `
        SELECT 
            oi.product_id AS productId,
            oi.product_name AS productName,
            COALESCE(SUM(oi.quantity), 0) AS unitsSold,
            COALESCE(SUM(oi.subtotal), 0) AS revenue,
            COUNT(DISTINCT o.id) AS ordersCount
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE o.status IN ('confirmed', 'processing', 'shipped', 'delivered')
        ${dateSql}
        GROUP BY oi.product_id, oi.product_name
        ORDER BY revenue DESC
        LIMIT ?
    `;
    
    const [rows] = await pool.query(query, [...dateParams, safeLimit]);
    return rows.map(r => ({
        ...r,
        unitsSold: parseInt(r.unitsSold),
        revenue: parseFloat(r.revenue),
        ordersCount: parseInt(r.ordersCount),
        averageSellingPrice: parseInt(r.unitsSold) > 0 ? parseFloat((parseFloat(r.revenue) / parseInt(r.unitsSold)).toFixed(2)) : 0
    }));
};

const getTopCategories = async (startDate, endDate, limit = 10) => {
    const { sql: dateSql, params: dateParams } = getDateFilterSql(startDate, endDate, 'o');
    const safeLimit = Math.max(1, Math.min(parseInt(limit) || 10, 50));
    
    const query = `
        SELECT 
            c.id AS categoryId,
            c.name AS categoryName,
            COALESCE(SUM(oi.quantity), 0) AS unitsSold,
            COALESCE(SUM(oi.subtotal), 0) AS revenue,
            COUNT(DISTINCT o.id) AS ordersCount
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        JOIN categories c ON p.category_id = c.id
        WHERE o.status IN ('confirmed', 'processing', 'shipped', 'delivered')
        ${dateSql}
        GROUP BY c.id, c.name
        ORDER BY revenue DESC
        LIMIT ?
    `;
    
    const [rows] = await pool.query(query, [...dateParams, safeLimit]);
    return rows.map(r => ({
        ...r,
        unitsSold: parseInt(r.unitsSold),
        revenue: parseFloat(r.revenue),
        ordersCount: parseInt(r.ordersCount)
    }));
};

const getTopCustomers = async (startDate, endDate, limit = 10) => {
    const { sql: dateSql, params: dateParams } = getDateFilterSql(startDate, endDate, 'o');
    const safeLimit = Math.max(1, Math.min(parseInt(limit) || 10, 50));
    
    const query = `
        SELECT 
            u.id AS customerId,
            u.name AS customerName,
            u.email AS email,
            COUNT(DISTINCT o.id) AS ordersCount,
            COALESCE(SUM(oi.subtotal), 0) AS totalSpent
        FROM users u
        JOIN orders o ON u.id = o.user_id
        JOIN order_items oi ON o.id = oi.order_id
        WHERE o.status IN ('confirmed', 'processing', 'shipped', 'delivered')
        ${dateSql}
        GROUP BY u.id, u.name, u.email
        ORDER BY totalSpent DESC
        LIMIT ?
    `;
    
    const [rows] = await pool.query(query, [...dateParams, safeLimit]);
    return rows.map(r => ({
        ...r,
        ordersCount: parseInt(r.ordersCount),
        totalSpent: parseFloat(r.totalSpent),
        averageOrderValue: parseInt(r.ordersCount) > 0 ? parseFloat((parseFloat(r.totalSpent) / parseInt(r.ordersCount)).toFixed(2)) : 0
    }));
};

const getProductPerformance = async (startDate, endDate, sortBy = 'revenue') => {
    const { sql: dateSql, params: dateParams } = getDateFilterSql(startDate, endDate, 'o');
    
    // Sort whitelist mapping
    const sortMap = {
        'revenue': 'revenue DESC',
        'unitsSold': 'unitsSold DESC',
        'revenue_asc': 'revenue ASC',
        'unitsSold_asc': 'unitsSold ASC'
    };
    const orderClause = sortMap[sortBy] || 'revenue DESC';

    const query = `
        SELECT 
            p.id AS productId,
            p.name AS productName,
            c.name AS categoryName,
            p.stock_quantity AS currentStock,
            COALESCE(SUM(oi.quantity), 0) AS unitsSold,
            COALESCE(SUM(oi.subtotal), 0) AS revenue,
            COUNT(DISTINCT o.id) AS ordersCount
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id 
            AND o.status IN ('confirmed', 'processing', 'shipped', 'delivered')
            ${dateSql.replace(/AND o.order_date/g, 'AND o.order_date')}
        GROUP BY p.id, p.name, c.name, p.stock_quantity
        ORDER BY ${orderClause}
    `;
    
    const [rows] = await pool.query(query, dateParams);
    return rows.map(r => ({
        ...r,
        unitsSold: parseInt(r.unitsSold),
        revenue: parseFloat(r.revenue),
        ordersCount: parseInt(r.ordersCount)
    }));
};

const getCategoryPerformance = async (startDate, endDate) => {
    const { sql: dateSql, params: dateParams } = getDateFilterSql(startDate, endDate, 'o');
    
    const query = `
        SELECT 
            c.id AS categoryId,
            c.name AS categoryName,
            COUNT(DISTINCT p.id) AS productCount,
            COALESCE(SUM(oi.quantity), 0) AS unitsSold,
            COALESCE(SUM(oi.subtotal), 0) AS revenue,
            COUNT(DISTINCT o.id) AS ordersCount
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id 
            AND o.status IN ('confirmed', 'processing', 'shipped', 'delivered')
            ${dateSql.replace(/AND o.order_date/g, 'AND o.order_date')}
        GROUP BY c.id, c.name
        ORDER BY revenue DESC
    `;
    
    const [rows] = await pool.query(query, dateParams);
    return rows.map(r => ({
        ...r,
        productCount: parseInt(r.productCount),
        unitsSold: parseInt(r.unitsSold),
        revenue: parseFloat(r.revenue),
        ordersCount: parseInt(r.ordersCount),
        averageSellingPrice: parseInt(r.unitsSold) > 0 ? parseFloat((parseFloat(r.revenue) / parseInt(r.unitsSold)).toFixed(2)) : 0
    }));
};

const getOrdersBreakdown = async (startDate, endDate) => {
    const { sql: dateSql, params: dateParams } = getDateFilterSql(startDate, endDate, 'o');
    
    const query = `
        SELECT 
            status,
            COUNT(id) AS count
        FROM orders o
        WHERE 1=1 ${dateSql}
        GROUP BY status
    `;
    
    const [rows] = await pool.query(query, dateParams);
    const breakdown = {
        confirmed: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        refunded: 0,
        pending: 0
    };
    
    rows.forEach(r => {
        if (breakdown[r.status] !== undefined) {
            breakdown[r.status] = parseInt(r.count);
        }
    });
    
    return breakdown;
};

const getPaymentSummary = async (startDate, endDate) => {
    const { sql: dateSql, params: dateParams } = getDateFilterSql(startDate, endDate, 'o');
    
    const query = `
        SELECT 
            p.payment_method,
            p.status,
            COUNT(p.id) AS count,
            COALESCE(SUM(p.amount), 0) AS totalAmount
        FROM payments p
        JOIN orders o ON p.order_id = o.id
        WHERE 1=1 ${dateSql}
        GROUP BY p.payment_method, p.status
    `;
    
    const [rows] = await pool.query(query, dateParams);
    return rows.map(r => ({
        paymentMethod: r.payment_method,
        status: r.status,
        count: parseInt(r.count),
        amount: parseFloat(r.totalAmount)
    }));
};

module.exports = {
    getSummary,
    getSalesTrend,
    getTopProducts,
    getTopCategories,
    getTopCustomers,
    getProductPerformance,
    getCategoryPerformance,
    getOrdersBreakdown,
    getPaymentSummary
};
