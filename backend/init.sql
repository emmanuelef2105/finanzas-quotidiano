-- Base de datos para aplicación de finanzas personales

-- Tabla de usuarios (para futuras implementaciones)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de cuentas bancarias/financieras
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    initial_balance DECIMAL(12, 2) DEFAULT 0.00,
    current_balance DECIMAL(12, 2) DEFAULT 0.00,
    account_type VARCHAR(50) DEFAULT 'checking',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de categorías para transacciones
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    color VARCHAR(7) DEFAULT '#6B7280',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, type) -- Evitar duplicados por nombre y tipo
);

-- Tabla de transacciones (ingresos y gastos)
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id),
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('income', 'expense')),
    transaction_date DATE NOT NULL,
    frequency VARCHAR(20) DEFAULT 'one-time' CHECK (frequency IN ('one-time', 'daily', 'weekly', 'monthly', 'yearly')),
    is_recurring BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de deudores (personas que me deben dinero)
CREATE TABLE debtors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de artículos de deuda (lo que cada deudor debe)
CREATE TABLE debt_items (
    id SERIAL PRIMARY KEY,
    debtor_id INTEGER REFERENCES debtors(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    item_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de pagos de deudas recibidos
CREATE TABLE debt_payments (
    id SERIAL PRIMARY KEY,
    debtor_id INTEGER REFERENCES debtors(id) ON DELETE CASCADE,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de mis deudas (dinero que debo)
CREATE TABLE my_debts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    creditor_name VARCHAR(100) NOT NULL,
    original_amount DECIMAL(12, 2) NOT NULL,
    current_balance DECIMAL(12, 2) NOT NULL,
    monthly_payment DECIMAL(12, 2),
    interest_rate DECIMAL(5, 2) DEFAULT 0.00,
    due_date DATE,
    is_paid BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de inversiones
CREATE TABLE investments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    expected_yield DECIMAL(5, 2) DEFAULT 0.00,
    investment_type VARCHAR(50) DEFAULT 'other',
    start_date DATE NOT NULL,
    maturity_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar categorías por defecto
INSERT INTO categories (name, type, color) VALUES
('Salario', 'income', '#10B981'),
('Freelance', 'income', '#059669'),
('Ventas', 'income', '#047857'),
('Otros Ingresos', 'income', '#065F46'),
('Alimentación', 'expense', '#EF4444'),
('Transporte', 'expense', '#F97316'),
('Vivienda', 'expense', '#8B5CF6'),
('Servicios', 'expense', '#06B6D4'),
('Entretenimiento', 'expense', '#EC4899'),
('Salud', 'expense', '#84CC16'),
('Educación', 'expense', '#6366F1'),
('Otros Gastos', 'expense', '#6B7280');

-- Índices para mejorar rendimiento
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_debtors_user_id ON debtors(user_id);
CREATE INDEX idx_debt_items_debtor_id ON debt_items(debtor_id);
CREATE INDEX idx_debt_payments_debtor_id ON debt_payments(debtor_id);
CREATE INDEX idx_my_debts_user_id ON my_debts(user_id);
CREATE INDEX idx_investments_user_id ON investments(user_id);

-- Triggers para actualizar balance de cuentas automáticamente
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Actualizar balance al insertar transacción
        UPDATE accounts 
        SET current_balance = current_balance + 
            CASE 
                WHEN NEW.transaction_type = 'income' THEN NEW.amount
                ELSE -NEW.amount
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.account_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Revertir balance al eliminar transacción
        UPDATE accounts 
        SET current_balance = current_balance - 
            CASE 
                WHEN OLD.transaction_type = 'income' THEN OLD.amount
                ELSE -OLD.amount
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.account_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Ajustar balance al actualizar transacción
        UPDATE accounts 
        SET current_balance = current_balance 
            - CASE 
                WHEN OLD.transaction_type = 'income' THEN OLD.amount
                ELSE -OLD.amount
              END
            + CASE 
                WHEN NEW.transaction_type = 'income' THEN NEW.amount
                ELSE -NEW.amount
              END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.account_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_account_balance
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_account_balance();

-- Trigger para pagos de deudas
CREATE OR REPLACE FUNCTION update_balance_on_debt_payment()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Agregar ingreso al recibir pago de deuda
        UPDATE accounts 
        SET current_balance = current_balance + NEW.amount,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.account_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Revertir ingreso al eliminar pago
        UPDATE accounts 
        SET current_balance = current_balance - OLD.amount,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.account_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_balance_debt_payment
    AFTER INSERT OR DELETE ON debt_payments
    FOR EACH ROW EXECUTE FUNCTION update_balance_on_debt_payment();
