/**
 * Seed script — run once after init.sql to create users with real bcrypt hashes.
 * Usage: node seed.js
 * Creates:  admin   / admin123   (role: admin)
 *           captain / captain123 (role: captain)
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function seed() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'bar_restaurant',
    });

    const SALT_ROUNDS = 10;
    const users = [
        { username: 'admin', password: 'admin123', role: 'admin' },
        { username: 'captain', password: 'captain123', role: 'captain' },
    ];

    for (const u of users) {
        const hash = await bcrypt.hash(u.password, SALT_ROUNDS);
        // Insert or update so the script is idempotent
        await db.query(
            `INSERT INTO users (username, password, role)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE password = VALUES(password), role = VALUES(role)`,
            [u.username, hash, u.role]
        );
        console.log(`Upserted user: ${u.username} (${u.role})`);
    }

    console.log('\nDone. Login credentials:');
    console.log('  admin   / admin123');
    console.log('  captain / captain123');

    await db.end();
}

seed().catch(err => { console.error(err); process.exit(1); });
