require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mysql = require('mysql2/promise');

async function verify() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'shopinsight',
    });

    try {
        console.log('--- Verification Tests ---');
        
        const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
        console.log(`Users count: ${users[0].count}`);

        const [categories] = await connection.query('SELECT COUNT(*) as count FROM categories');
        console.log(`Categories count: ${categories[0].count}`);

        const [products] = await connection.query('SELECT COUNT(*) as count FROM products');
        console.log(`Products count: ${products[0].count}`);

        const [orders] = await connection.query('SELECT COUNT(*) as count FROM orders');
        console.log(`Orders count: ${orders[0].count}`);

        const [orderItems] = await connection.query('SELECT COUNT(*) as count FROM order_items');
        console.log(`Order items count: ${orderItems[0].count}`);

        const [sales] = await connection.query("SELECT SUM(total_amount) as total FROM orders WHERE status IN ('delivered', 'confirmed', 'shipped')");
        console.log(`Total seeded sales (completed): ${sales[0].total}`);

        const [negativeStock] = await connection.query('SELECT COUNT(*) as count FROM products WHERE stock_quantity < 0');
        console.log(`Products with negative stock: ${negativeStock[0].count}`);

        try {
            await connection.query("INSERT INTO users (name, email, password_hash) VALUES ('Test', 'admin@shopinsight.com', 'hash')");
            console.log('FAIL: Duplicate email allowed.');
        } catch (e) {
            console.log('PASS: Duplicate email correctly rejected.');
        }

        try {
            await connection.query("INSERT INTO products (category_id, name, slug, price, stock_quantity) VALUES (1, 'Test', 'test-slug', 10.00, -5)");
            console.log('FAIL: Negative stock allowed.');
        } catch (e) {
            console.log('PASS: Negative stock correctly rejected.');
        }

        try {
            await connection.query("INSERT INTO cart_items (user_id, product_id, quantity) VALUES (2, 1, 1)");
            await connection.query("INSERT INTO cart_items (user_id, product_id, quantity) VALUES (2, 1, 1)");
            console.log('FAIL: Duplicate cart entries allowed.');
        } catch (e) {
            console.log('PASS: Duplicate cart entries correctly rejected.');
        }
        
    } catch (error) {
        console.error('Verification failed:', error.message);
    } finally {
        await connection.end();
    }
}

verify();
