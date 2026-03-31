USE bar_restaurant;

-- WARNING: Run this migration only on the old schema BEFORE switching the app.
-- It migrates old inventory/orders data into the new items/inventory_transactions/order_lines schema.

SET FOREIGN_KEY_CHECKS = 0;

-- Rename legacy tables so we can create new schema.
DROP TABLE IF EXISTS inventory_backup;
RENAME TABLE inventory TO inventory_backup;

DROP TABLE IF EXISTS orders_backup;
RENAME TABLE orders TO orders_backup;

DROP TABLE IF EXISTS bills_backup;
RENAME TABLE bills TO bills_backup;

DROP TABLE IF EXISTS bill_items_backup;
RENAME TABLE bill_items TO bill_items_backup;

SET FOREIGN_KEY_CHECKS = 1;

-- Create new schema tables if they do not exist.
CREATE TABLE IF NOT EXISTS suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

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

CREATE TABLE IF NOT EXISTS order_lines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_on DATETIME DEFAULT CURRENT_TIMESTAMP,
    modified_on DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by_id INT,
    modified_by_id INT,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (item_id) REFERENCES items(id),
    FOREIGN KEY (created_by_id) REFERENCES users(id),
    FOREIGN KEY (modified_by_id) REFERENCES users(id)
);

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

-- Migrate inventory rows into items and inventory_transactions.
INSERT INTO items (name, created_by_id, modified_by_id)
SELECT DISTINCT item_name, NULL, NULL
FROM inventory_backup;

INSERT INTO inventory_transactions (item_id, transaction_type, quantity, buying_price, selling_price, supplier_id, created_by_id, modified_by_id)
SELECT i.id, 'purchase', inv.quantity, inv.price, inv.price, NULL, NULL, NULL
FROM inventory_backup inv
JOIN items i ON i.name = inv.item_name;

-- Migrate old orders into new orders/order_lines.
INSERT INTO orders (id, table_id, user_id, order_time, status, created_on, modified_on, created_by_id, modified_by_id)
SELECT id, table_id, NULL, NOW(), status, NOW(), NOW(), NULL, NULL
FROM orders_backup;

INSERT INTO order_lines (order_id, item_id, quantity, price, created_by_id, modified_by_id)
SELECT o.id, o.item_id, o.quantity,
       COALESCE((SELECT selling_price FROM inventory_transactions it WHERE it.item_id = o.item_id ORDER BY modified_on DESC LIMIT 1), 0),
       NULL, NULL
FROM orders_backup o;

-- Keep old bills and bill items as backups if needed; no automatic billing migration is performed.

SELECT 'Migration complete. Legacy tables renamed to *_backup.' AS message;
