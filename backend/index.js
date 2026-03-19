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

// Login route
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) return res.status(401).json({ message: 'Invalid credentials' });
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, role: user.role });
});

// Middleware for role-based access
function authorize(roles = []) {
    return (req, res, next) => {
        const auth = req.headers['authorization'];
        if (!auth) return res.status(401).json({ message: 'No token' });
        try {
            const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
            if (!roles.length || roles.includes(decoded.role)) {
                req.user = decoded;
                return next();
            }
            return res.status(403).json({ message: 'Forbidden' });
        } catch {
            return res.status(401).json({ message: 'Invalid token' });
        }
    };
}

// Example protected route (admin only)
app.get('/api/inventory', authorize(['admin']), async (req, res) => {
    const [rows] = await db.query('SELECT * FROM inventory');
    res.json(rows);
});

// Example protected route (admin only)
app.get('/api/statistics', authorize(['admin']), (req, res) => {
    res.json({ message: 'Statistics endpoint (admin only)' });
});

// Example protected route (admin only)
app.get('/api/tables', authorize(['admin']), async (req, res) => {
    const [rows] = await db.query('SELECT * FROM tables');
    res.json(rows);
});

// Captain: Table Dashboard and Order Updates
app.get('/api/table-dashboard', authorize(['captain']), async (req, res) => {
    const [rows] = await db.query('SELECT * FROM tables');
    res.json(rows);
});

app.post('/api/order', authorize(['captain']), async (req, res) => {
    const { table_id, item_id, quantity } = req.body;
    await db.query('INSERT INTO orders (table_id, item_id, quantity) VALUES (?, ?, ?)', [table_id, item_id, quantity]);
    res.json({ message: 'Order placed' });
});

app.listen(3001, () => console.log('Backend running on port 3001'));
