-- MySQL script to create tables and pre-populate demo data for Bar & Restaurant Billing App

CREATE DATABASE IF NOT EXISTS bar_restaurant;
USE bar_restaurant;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'captain') NOT NULL
);

-- Pre-populate users (passwords should be hashed in production)
INSERT INTO users (username, password, role) VALUES
('admin', '$2b$10$demoAdminHash', 'admin'),
('captain', '$2b$10$demoCaptainHash', 'captain');

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL
);

INSERT INTO inventory (item_name, quantity, price) VALUES
('Beer', 100, 3.50),
('Wine', 50, 5.00),
('Burger', 40, 7.00);

-- Tables table
CREATE TABLE IF NOT EXISTS tables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_number INT NOT NULL UNIQUE,
    status ENUM('available', 'occupied') NOT NULL DEFAULT 'available'
);

INSERT INTO tables (table_number, status) VALUES
(1, 'available'),
(2, 'occupied'),
(3, 'available');

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_id INT,
    item_id INT,
    quantity INT,
    status ENUM('pending', 'served') DEFAULT 'pending',
    FOREIGN KEY (table_id) REFERENCES tables(id),
    FOREIGN KEY (item_id) REFERENCES inventory(id)
);
