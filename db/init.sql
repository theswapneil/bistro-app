-- MySQL script to create tables and pre-populate demo data for Bar & Restaurant Billing App
-- Run this file first, then run: node backend/seed.js  (to create admin/captain users with real bcrypt hashes)

CREATE DATABASE IF NOT EXISTS bar_restaurant;
USE bar_restaurant;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'captain') NOT NULL
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- Items table
CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_on DATETIME DEFAULT CURRENT_TIMESTAMP,
    modified_on DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by_id INT,
    modified_by_id INT,
    FOREIGN KEY (created_by_id) REFERENCES users(id),
    FOREIGN KEY (modified_by_id) REFERENCES users(id)
);

-- Inventory transactions table
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    transaction_type ENUM('purchase','sale','adjustment','return') NOT NULL,
    quantity INT NOT NULL,
    buying_price DECIMAL(10,2) DEFAULT NULL,
    selling_price DECIMAL(10,2) DEFAULT NULL,
    supplier_id INT DEFAULT NULL,
    created_on DATETIME DEFAULT CURRENT_TIMESTAMP,
    modified_on DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by_id INT,
    modified_by_id INT,
    FOREIGN KEY (item_id) REFERENCES items(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (created_by_id) REFERENCES users(id),
    FOREIGN KEY (modified_by_id) REFERENCES users(id)
);

-- Sample inventory items
INSERT IGNORE INTO items (name, created_by_id, modified_by_id) VALUES
('Beer', NULL, NULL),
('Wine', NULL, NULL),
('Burger', NULL, NULL),
('Whiskey', NULL, NULL),
('Soft Drink', NULL, NULL);

INSERT IGNORE INTO inventory_transactions (item_id, transaction_type, quantity, buying_price, selling_price, supplier_id, created_by_id, modified_by_id) VALUES
((SELECT id FROM items WHERE name = 'Beer'), 'purchase', 100, 3.50, 3.50, NULL, NULL, NULL),
((SELECT id FROM items WHERE name = 'Wine'), 'purchase', 50, 5.00, 5.00, NULL, NULL, NULL),
((SELECT id FROM items WHERE name = 'Burger'), 'purchase', 40, 7.00, 7.00, NULL, NULL, NULL),
((SELECT id FROM items WHERE name = 'Whiskey'), 'purchase', 30, 8.00, 8.00, NULL, NULL, NULL),
((SELECT id FROM items WHERE name = 'Soft Drink'), 'purchase', 80, 2.00, 2.00, NULL, NULL, NULL);

-- Tables table
CREATE TABLE IF NOT EXISTS tables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_number INT NOT NULL UNIQUE,
    status ENUM('available', 'occupied') NOT NULL DEFAULT 'available'
);

INSERT IGNORE INTO tables (table_number, status) VALUES
(1, 'available'),
(2, 'available'),
(3, 'available'),
(4, 'available'),
(5, 'available');

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_id INT,
    user_id INT,
    order_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending','served','cancelled') DEFAULT 'pending',
    created_on DATETIME DEFAULT CURRENT_TIMESTAMP,
    modified_on DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by_id INT,
    modified_by_id INT,
    FOREIGN KEY (table_id) REFERENCES tables(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (created_by_id) REFERENCES users(id),
    FOREIGN KEY (modified_by_id) REFERENCES users(id)
);

-- Order lines table
CREATE TABLE IF NOT EXISTS order_lines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending','preparing','served','billed') DEFAULT 'pending',
    created_on DATETIME DEFAULT CURRENT_TIMESTAMP,
    modified_on DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by_id INT,
    modified_by_id INT,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (item_id) REFERENCES items(id),
    FOREIGN KEY (created_by_id) REFERENCES users(id),
    FOREIGN KEY (modified_by_id) REFERENCES users(id)
);

-- Bills table
CREATE TABLE IF NOT EXISTS bills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    final_amount DECIMAL(10,2) NOT NULL,
    payment_status ENUM('unpaid','paid','partial') NOT NULL DEFAULT 'unpaid',
    payment_method ENUM('cash','card','upi','wallet') NOT NULL DEFAULT 'cash',
    created_on DATETIME DEFAULT CURRENT_TIMESTAMP,
    modified_on DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by_id INT,
    modified_by_id INT,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (created_by_id) REFERENCES users(id),
    FOREIGN KEY (modified_by_id) REFERENCES users(id)
);
