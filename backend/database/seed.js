require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function seed() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'shopinsight',
        multipleStatements: true
    });

    try {
        console.log('Clearing existing data (in correct order)...');
        await connection.query(`
            SET FOREIGN_KEY_CHECKS = 0;
            TRUNCATE TABLE payments;
            TRUNCATE TABLE order_items;
            TRUNCATE TABLE orders;
            TRUNCATE TABLE cart_items;
            TRUNCATE TABLE products;
            TRUNCATE TABLE categories;
            TRUNCATE TABLE users;
            SET FOREIGN_KEY_CHECKS = 1;
        `);

        console.log('Seeding Users...');
        const adminHash = await bcrypt.hash('admin123', 10);
        const custHash = await bcrypt.hash('password123', 10);
        
        await connection.query(`
            INSERT INTO users (name, email, password_hash, role) VALUES 
            ('Admin User', 'admin@shopinsight.com', ?, 'admin'),
            ('Alice Smith', 'alice@example.com', ?, 'customer'),
            ('Bob Jones', 'bob@example.com', ?, 'customer'),
            ('Charlie Brown', 'charlie@example.com', ?, 'customer'),
            ('Diana Prince', 'diana@example.com', ?, 'customer'),
            ('Eve Torres', 'eve@example.com', ?, 'customer');
        `, [adminHash, custHash, custHash, custHash, custHash, custHash]);

        console.log('Seeding Categories...');
        await connection.query(`
            INSERT INTO categories (name, slug, description) VALUES 
            ('Electronics', 'electronics', 'Gadgets and devices'),
            ('Fashion', 'fashion', 'Clothing and apparel'),
            ('Home & Kitchen', 'home-kitchen', 'Appliances and decor'),
            ('Beauty', 'beauty', 'Cosmetics and skincare'),
            ('Sports', 'sports', 'Sporting goods and equipment'),
            ('Books', 'books', 'Fiction and non-fiction books');
        `);

        console.log('Seeding Products...');
        const products = [];
        for (let i = 1; i <= 25; i++) {
            const categoryId = (i % 6) + 1; 
            products.push([
                categoryId,
                `Product ${i}`,
                `product-${i}`,
                `Description for product ${i}`,
                ((i * 150.50) % 5000 + 100).toFixed(2),
                Math.floor(Math.random() * 100) + 10
            ]);
        }
        await connection.query(`
            INSERT INTO products (category_id, name, slug, description, price, stock_quantity) 
            VALUES ?
        `, [products]);

        console.log('Seeding Orders and Order Items...');
        for (let i = 1; i <= 15; i++) {
            const userId = (i % 5) + 2; 
            const status = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'][i % 7];
            const items = [
                { productId: (i % 25) + 1, price: 500.00, qty: 2 },
                { productId: ((i + 5) % 25) + 1, price: 1500.00, qty: 1 }
            ];
            
            const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
            const total_amount = subtotal; 

            const [orderResult] = await connection.query(`
                INSERT INTO orders (user_id, order_number, status, subtotal, total_amount, order_date)
                VALUES (?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY))
            `, [userId, `ORD-100${i}`, status, subtotal, total_amount, i]);

            const orderId = orderResult.insertId;

            for (const item of items) {
                await connection.query(`
                    INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [orderId, item.productId, `Seeded Product ${item.productId}`, item.price, item.qty, item.price * item.qty]);
            }

            const paymentStatus = (status === 'cancelled') ? 'failed' : (status === 'refunded' ? 'refunded' : (status === 'pending' ? 'pending' : 'paid'));
            if(status !== 'pending' && status !== 'cancelled') {
                await connection.query(`
                    INSERT INTO payments (order_id, payment_reference, payment_method, amount, status, paid_at)
                    VALUES (?, ?, ?, ?, ?, NOW())
                `, [orderId, `PAY-${orderId}-${i}`, 'card', total_amount, paymentStatus]);
            }
        }
        console.log('Seeding completed successfully.');

    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        await connection.end();
    }
}

seed();
