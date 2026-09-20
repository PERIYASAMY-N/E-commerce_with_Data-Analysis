require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || ''
    });

    try {
        console.log('Creating database if not exists...');
        await connection.query("CREATE DATABASE IF NOT EXISTS `shopinsight` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
        await connection.query("USE `shopinsight`;");

        console.log('Creating migrations table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                migration_name VARCHAR(255) NOT NULL UNIQUE,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;
        `);

        const [rows] = await connection.query("SELECT migration_name FROM migrations");
        const executedMigrations = new Set(rows.map(row => row.migration_name));

        const migrationsDir = path.join(__dirname, 'migrations');
        const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

        for (const file of files) {
            if (!executedMigrations.has(file)) {
                console.log(`Executing migration: ${file}...`);
                const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
                
                await connection.query(sql);
                await connection.query("INSERT INTO migrations (migration_name) VALUES (?)", [file]);
                console.log(`Completed migration: ${file}`);
            } else {
                console.log(`Skipping migration: ${file} (already executed)`);
            }
        }
        console.log('All migrations executed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
