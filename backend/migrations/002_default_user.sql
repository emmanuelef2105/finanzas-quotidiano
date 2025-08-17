-- Migración para crear usuario por defecto
-- Esto permite que la aplicación funcione sin sistema de autenticación completo

-- Insertar usuario por defecto si no existe
INSERT INTO users (id, email, password_hash, name) 
SELECT 1, 'usuario@ejemplo.com', 'default', 'Usuario Ejemplo'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 1);

-- Asegurar que el ID se reinicie correctamente
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- Insertar algunas cuentas de ejemplo si no existen
INSERT INTO accounts (id, user_id, name, initial_balance, current_balance, account_type) 
SELECT 1, 1, 'Cuenta Principal', 0.00, 0.00, 'checking'
WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE id = 1);

INSERT INTO accounts (id, user_id, name, initial_balance, current_balance, account_type) 
SELECT 2, 1, 'Ahorros', 0.00, 0.00, 'savings'
WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE id = 2);

-- Asegurar que el ID se reinicie correctamente
SELECT setval('accounts_id_seq', (SELECT MAX(id) FROM accounts));
