-- Script de diagnóstico para verificar la estructura de la base de datos

-- Verificar si las tablas principales existen
SELECT 
    tablename,
    schemaname 
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'debtors', 'my_debts', 'accounts')
ORDER BY tablename;

-- Verificar la estructura de la tabla debtors
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'debtors' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar la estructura de la tabla my_debts
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'my_debts' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar si existe el usuario por defecto
SELECT id, email, name FROM users WHERE id = 1;

-- Verificar si existen las cuentas por defecto
SELECT id, user_id, name, current_balance FROM accounts WHERE user_id = 1;
