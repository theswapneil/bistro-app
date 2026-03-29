require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'bar_restaurant',
});

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// ── Auth ────────────────────────────────────────────────────────────────────

app.post('/api/login', async (req, res) => {
    try {
        console.log('Login attempt:', req.body);
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ message: 'Username and password required' });

        const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        console.log('User lookup result:', rows);
        if (rows.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

        const user = rows[0];
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ token, role: user.role });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ── Middleware ───────────────────────────────────────────────────────────────

function authorize(roles = []) {
    return (req, res, next) => {
        const auth = req.headers['authorization'];
        if (!auth) return res.status(401).json({ message: 'No token' });
        try {
            const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
            if (roles.length && !roles.includes(decoded.role)) {
                return res.status(403).json({ message: 'Forbidden' });
            }
            req.user = decoded;
            return next();
        } catch {
            return res.status(401).json({ message: 'Invalid token' });
        }
    };
}

// ── Inventory (admin only) ───────────────────────────────────────────────────

app.get('/api/inventory', authorize(['admin']), async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM inventory ORDER BY item_name');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/inventory', authorize(['admin']), async (req, res) => {
    try {
        const { item_name, quantity, price } = req.body;
        if (!item_name || quantity == null || price == null) {
            return res.status(400).json({ message: 'item_name, quantity and price are required' });
        }
        await db.query('INSERT INTO inventory (item_name, quantity, price) VALUES (?, ?, ?)', [item_name, quantity, price]);
        res.json({ message: 'Item added' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/api/inventory/:id', authorize(['admin']), async (req, res) => {
    try {
        const { item_name, quantity, price } = req.body;
        await db.query('UPDATE inventory SET item_name = ?, quantity = ?, price = ? WHERE id = ?',
            [item_name, quantity, price, req.params.id]);
        res.json({ message: 'Item updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/api/inventory/:id', authorize(['admin']), async (req, res) => {
    try {
        await db.query('DELETE FROM inventory WHERE id = ?', [req.params.id]);
        res.json({ message: 'Item deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ── Tables ───────────────────────────────────────────────────────────────────

// Admin view of all tables
app.get('/api/tables', authorize(['admin']), async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM tables ORDER BY table_number');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Captain (and admin) table dashboard
app.get('/api/table-dashboard', authorize(['admin', 'captain']), async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM tables ORDER BY table_number');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ── Orders ───────────────────────────────────────────────────────────────────

// Place an order (captain)
app.post('/api/order', authorize(['admin', 'captain']), async (req, res) => {
    try {
        const { table_id, item_id, quantity } = req.body;
        if (!table_id || !item_id || !quantity) {
            return res.status(400).json({ message: 'table_id, item_id and quantity are required' });
        }

        // Check stock
        const [invRows] = await db.query('SELECT quantity FROM inventory WHERE id = ?', [item_id]);
        if (!invRows.length) return res.status(404).json({ message: 'Item not found' });
        if (invRows[0].quantity < quantity) {
            return res.status(400).json({ message: 'Insufficient stock' });
        }

        await db.query('INSERT INTO orders (table_id, item_id, quantity) VALUES (?, ?, ?)', [table_id, item_id, quantity]);

        // Mark table as occupied
        await db.query('UPDATE tables SET status = "occupied" WHERE id = ?', [table_id]);

        res.json({ message: 'Order placed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ── Billing ──────────────────────────────────────────────────────────────────

// Generate bill for a table (admin or captain)
app.post('/api/bill', authorize(['admin', 'captain']), async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const { table_number } = req.body;
        if (!table_number) {
            await conn.rollback();
            conn.release();
            return res.status(400).json({ message: 'table_number is required' });
        }

        // Get table
        const [tables] = await conn.query('SELECT * FROM tables WHERE table_number = ?', [table_number]);
        if (!tables.length) {
            await conn.rollback();
            conn.release();
            return res.status(404).json({ message: 'Table not found' });
        }
        const table = tables[0];

        // Get all pending orders for the table with item details
        const [orders] = await conn.query(
            `SELECT o.id, o.item_id, o.quantity, i.item_name, i.price
             FROM orders o
             JOIN inventory i ON o.item_id = i.id
             WHERE o.table_id = ? AND o.status = 'pending'`,
            [table.id]
        );

        if (!orders.length) {
            await conn.rollback();
            conn.release();
            return res.status(400).json({ message: 'No pending orders for this table' });
        }

        // Calculate total
        const total = orders.reduce((sum, o) => sum + (o.quantity * parseFloat(o.price)), 0);

        // Insert bill record
        const [billResult] = await conn.query(
            'INSERT INTO bills (table_id, table_number, total_amount) VALUES (?, ?, ?)',
            [table.id, table_number, total.toFixed(2)]
        );
        const billId = billResult.insertId;

        // Insert bill line items and deduct inventory
        for (const order of orders) {
            await conn.query(
                'INSERT INTO bill_items (bill_id, item_name, quantity, price) VALUES (?, ?, ?, ?)',
                [billId, order.item_name, order.quantity, order.price]
            );
            await conn.query(
                'UPDATE inventory SET quantity = quantity - ? WHERE id = ?',
                [order.quantity, order.item_id]
            );
        }

        // Mark orders as billed
        const orderIds = orders.map(o => o.id);
        await conn.query('UPDATE orders SET status = "billed" WHERE id IN (?)', [orderIds]);

        // Free the table
        await conn.query('UPDATE tables SET status = "available" WHERE id = ?', [table.id]);

        await conn.commit();
        conn.release();

        // Build response matching frontend Bill interface
        const bill = {
            id: billId,
            table_number: parseInt(table_number),
            items: orders.map(o => ({
                name: o.item_name,
                qty: o.quantity,
                price: parseFloat(o.price)
            })),
            total: parseFloat(total.toFixed(2))
        };

        res.json(bill);
    } catch (err) {
        await conn.rollback();
        conn.release();
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ── Statistics (admin only) ──────────────────────────────────────────────────

app.get('/api/statistics', authorize(['admin']), async (req, res) => {
    try {
        // Daily collection: sum of bills created today
        const [[dailyRow]] = await db.query(
            `SELECT COALESCE(SUM(total_amount), 0) AS total
             FROM bills
             WHERE DATE(created_at) = CURDATE()`
        );

        // Monthly collection: sum of bills this calendar month
        const [[monthlyRow]] = await db.query(
            `SELECT COALESCE(SUM(total_amount), 0) AS total
             FROM bills
             WHERE MONTH(created_at) = MONTH(CURDATE())
               AND YEAR(created_at) = YEAR(CURDATE())`
        );

        // Total expenses
        const [[expensesRow]] = await db.query(
            'SELECT COALESCE(SUM(amount), 0) AS total FROM expenses'
        );

        res.json({
            daily: parseFloat(dailyRow.total),
            monthly: parseFloat(monthlyRow.total),
            expenses: parseFloat(expensesRow.total)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ── Start ────────────────────────────────────────────────────────────────────

app.listen(3001, () => console.log('Backend running on port 3001'));
