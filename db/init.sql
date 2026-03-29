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

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    price DECIMAL(10,2) NOT NULL
);

INSERT IGNORE INTO inventory (item_name, quantity, price) VALUES
('Beer', 100, 3.50),
('Wine', 50, 5.00),
('Burger', 40, 7.00),
('Whiskey', 30, 8.00),
('Soft Drink', 80, 2.00);

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
    item_id INT,
    quantity INT NOT NULL DEFAULT 1,
    status ENUM('pending', 'billed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (table_id) REFERENCES tables(id),
    FOREIGN KEY (item_id) REFERENCES inventory(id)
);

-- Bills table (one bill per table checkout)
CREATE TABLE IF NOT EXISTS bills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_id INT NOT NULL,
    table_number INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (table_id) REFERENCES tables(id)
);

-- Bill items (line items for each bill)
CREATE TABLE IF NOT EXISTS bill_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (bill_id) REFERENCES bills(id)
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample expenses
INSERT IGNORE INTO expenses (description, amount) VALUES
('Electricity Bill', 250.00),
('Staff Salary', 1500.00),
('Supplies Purchase', 300.00),
('Maintenance', 120.00);
