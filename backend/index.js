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
        const [rows] = await db.query(
            `SELECT
                i.id,
                i.name,
                COALESCE(SUM(
                    CASE
                        WHEN it.transaction_type IN ('purchase', 'return') THEN it.quantity
                        WHEN it.transaction_type = 'sale' THEN -it.quantity
                        ELSE it.quantity
                    END
                ), 0) AS quantity,
                COALESCE(
                    (SELECT it2.buying_price FROM inventory_transactions it2 WHERE it2.item_id = i.id ORDER BY it2.modified_on DESC LIMIT 1),
                    0
                ) AS price
            FROM items i
            LEFT JOIN inventory_transactions it ON it.item_id = i.id
            GROUP BY i.id, i.name
            ORDER BY i.name`
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/inventory', authorize(['admin']), async (req, res) => {
    try {
        const { name, quantity, price } = req.body;
        if (!name || quantity == null || price == null) {
            return res.status(400).json({ message: 'name, quantity and price are required' });
        }

        const [existingItems] = await db.query('SELECT id FROM items WHERE name = ?', [name]);
        let itemId;

        if (existingItems.length) {
            itemId = existingItems[0].id;
        } else {
            const [result] = await db.query(
                'INSERT INTO items (name, created_by_id, modified_by_id) VALUES (?, ?, ?)',
                [name, req.user.id, req.user.id]
            );
            itemId = result.insertId;
        }

        if (quantity !== 0) {
            const transactionType = quantity > 0 ? 'purchase' : 'sale';
            await db.query(
                `INSERT INTO inventory_transactions
                    (item_id, transaction_type, quantity, buying_price, selling_price, supplier_id, created_by_id, modified_by_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [itemId, transactionType, Math.abs(quantity), price, price, null, req.user.id, req.user.id]
            );
        }

        res.json({ id: itemId, name, quantity, price });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/api/add-stock/:id', authorize(['admin']), async (req, res) => {
    try {
        const { name, quantity, price } = req.body;
        if (!name || quantity == null || price == null) {
            return res.status(400).json({ message: 'name, quantity and price are required' });
        }

        const [items] = await db.query('SELECT * FROM items WHERE id = ?', [req.params.id]);
        if (!items.length) {
            return res.status(404).json({ message: 'Item not found' });
        }

        if (items[0].name !== name) {
            await db.query('UPDATE items SET name = ?, modified_by_id = ? WHERE id = ?', [name, req.user.id, req.params.id]);
        }

        // const [[stockRow]] = await db.query(
        //     `SELECT COALESCE(SUM(
        //         CASE
        //             WHEN transaction_type IN ('purchase', 'return') THEN quantity
        //             WHEN transaction_type = 'sale' THEN -quantity
        //             ELSE quantity
        //         END
        //     ), 0) AS quantity
        //      FROM inventory_transactions
        //      WHERE item_id = ?`,
        //     [req.params.id]
        // );

        // const currentQuantity = stockRow.quantity || 0;
        // const quantityDelta = quantity - currentQuantity;

        const [[priceRow]] = await db.query(
            'SELECT selling_price FROM inventory_transactions WHERE item_id = ? ORDER BY modified_on DESC LIMIT 1',
            [req.params.id]
        );
        const currentPrice = priceRow?.selling_price ?? null;

        await db.query(
            `INSERT INTO inventory_transactions
                    (item_id, transaction_type, quantity, buying_price, selling_price, supplier_id, created_by_id, modified_by_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.params.id, 'purchase', Math.abs(quantity), price, null, null, req.user.id, req.user.id]
        );

        // if (quantityDelta !== 0) {
        //     const transactionType = quantityDelta > 0 ? 'purchase' : 'sale';
        //     await db.query(
        //         `INSERT INTO inventory_transactions
        //             (item_id, transaction_type, quantity, buying_price, selling_price, supplier_id, created_by_id, modified_by_id)
        //          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        //         [req.params.id, transactionType, Math.abs(quantityDelta), price, price, null, req.user.id, req.user.id]
        //     );
        // } else if (currentPrice !== price) {
        //     await db.query(
        //         `INSERT INTO inventory_transactions
        //             (item_id, transaction_type, quantity, buying_price, selling_price, supplier_id, created_by_id, modified_by_id)
        //          VALUES (?, 'adjustment', 0, ?, ?, ?, ?, ?)`,
        //         [req.params.id, price, price, null, req.user.id, req.user.id]
        //     );
        // }

        res.json({ message: 'Item updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/api/inventory/:id', authorize(['admin']), async (req, res) => {
    try {
        const itemId = req.params.id;
        const [orderLines] = await db.query('SELECT 1 FROM order_lines WHERE item_id = ? LIMIT 1', [itemId]);
        if (orderLines.length) {
            return res.status(400).json({ message: 'Cannot delete item with existing orders' });
        }

        await db.query('DELETE FROM inventory_transactions WHERE item_id = ?', [itemId]);
        const [result] = await db.query('DELETE FROM items WHERE id = ?', [itemId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }

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

        const [itemRows] = await db.query('SELECT * FROM items WHERE id = ?', [item_id]);
        if (!itemRows.length) return res.status(404).json({ message: 'Item not found' });

        const [[stockRow]] = await db.query(
            `SELECT COALESCE(SUM(
                CASE
                    WHEN transaction_type IN ('purchase', 'return') THEN quantity
                    WHEN transaction_type = 'sale' THEN -quantity
                    ELSE quantity
                END
            ), 0) AS quantity
             FROM inventory_transactions
             WHERE item_id = ?`,
            [item_id]
        );

        const currentStock = stockRow.quantity || 0;
        if (currentStock < quantity) {
            return res.status(400).json({ message: 'Insufficient stock' });
        }

        const [[priceRow]] = await db.query(
            'SELECT selling_price FROM inventory_transactions WHERE item_id = ? ORDER BY modified_on DESC LIMIT 1',
            [item_id]
        );
        const price = priceRow?.selling_price ?? 0;

        const [orderResult] = await db.query(
            `INSERT INTO orders (table_id, user_id, order_time, status, created_by_id, modified_by_id)
             VALUES (?, ?, NOW(), 'pending', ?, ?)`,
            [table_id, req.user.id, req.user.id, req.user.id]
        );
        const orderId = orderResult.insertId;

        await db.query(
            `INSERT INTO order_lines
                (order_id, item_id, quantity, price, created_by_id, modified_by_id)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [orderId, item_id, quantity, price, req.user.id, req.user.id]
        );

        await db.query(
            `INSERT INTO inventory_transactions
                (item_id, transaction_type, quantity, buying_price, selling_price, supplier_id, created_by_id, modified_by_id)
             VALUES (?, 'sale', ?, ?, ?, ?, ?, ?)`,
            [item_id, quantity, 0, price, null, req.user.id, req.user.id]
        );

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

        const [tables] = await conn.query('SELECT * FROM tables WHERE table_number = ?', [table_number]);
        if (!tables.length) {
            await conn.rollback();
            conn.release();
            return res.status(404).json({ message: 'Table not found' });
        }
        const table = tables[0];

        const [orderLines] = await conn.query(
            `SELECT o.id AS order_id, ol.item_id, ol.quantity, ol.price, i.name AS item_name
             FROM orders o
             JOIN order_lines ol ON ol.order_id = o.id
             JOIN items i ON i.id = ol.item_id
             WHERE o.table_id = ? AND o.status = 'pending'`,
            [table.id]
        );

        if (!orderLines.length) {
            await conn.rollback();
            conn.release();
            return res.status(400).json({ message: 'No pending orders for this table' });
        }

        const billItems = orderLines.map(line => ({
            name: line.item_name,
            qty: line.quantity,
            price: parseFloat(line.price)
        }));
        const total = billItems.reduce((sum, item) => sum + item.qty * item.price, 0);

        const orderIds = [...new Set(orderLines.map(line => line.order_id))];
        const billIds = [];

        for (const orderId of orderIds) {
            const orderTotal = orderLines
                .filter(line => line.order_id === orderId)
                .reduce((sum, line) => sum + line.quantity * parseFloat(line.price), 0);

            const [billResult] = await conn.query(
                `INSERT INTO bills
                    (order_id, total_amount, discount, tax, final_amount, payment_status, payment_method, created_by_id, modified_by_id)
                 VALUES (?, ?, 0, 0, ?, 'unpaid', 'cash', ?, ?)`,
                [orderId, orderTotal.toFixed(2), orderTotal.toFixed(2), req.user.id, req.user.id]
            );
            billIds.push(billResult.insertId);
        }

        await conn.query(
            `UPDATE orders SET status = 'served', modified_by_id = ? WHERE id IN (?)`,
            [req.user.id, orderIds]
        );
        await conn.query('UPDATE tables SET status = "available" WHERE id = ?', [table.id]);

        await conn.commit();
        conn.release();

        res.json({
            id: billIds[0],
            table_number: parseInt(table_number, 10),
            items: billItems,
            total: parseFloat(total.toFixed(2)),
            final_amount: parseFloat(total.toFixed(2)),
            discount: 0,
            tax: 0,
            payment_status: 'unpaid',
            payment_method: 'cash',
            bill_ids: billIds
        });
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
        const [[dailyRow]] = await db.query(
            `SELECT COALESCE(SUM(final_amount), 0) AS total
             FROM bills
             WHERE DATE(created_on) = CURDATE()`
        );

        const [[monthlyRow]] = await db.query(
            `SELECT COALESCE(SUM(final_amount), 0) AS total
             FROM bills
             WHERE MONTH(created_on) = MONTH(CURDATE())
               AND YEAR(created_on) = YEAR(CURDATE())`
        );

        res.json({
            daily: parseFloat(dailyRow.total),
            monthly: parseFloat(monthlyRow.total),
            expenses: 0
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ── Start ────────────────────────────────────────────────────────────────────

app.listen(3001, () => console.log('Backend running on port 3001'));
