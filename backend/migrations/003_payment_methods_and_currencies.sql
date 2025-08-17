-- Migración: Añadir métodos de pago, tarjetas y divisas
-- Fecha: 2025-08-17

-- Tabla de divisas
CREATE TABLE currencies (
    id SERIAL PRIMARY KEY,
    code VARCHAR(3) NOT NULL UNIQUE, -- USD, MXN, EUR, etc.
    name VARCHAR(50) NOT NULL,
    symbol VARCHAR(10) NOT NULL, -- $, €, £, etc.
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de métodos de pago
CREATE TABLE payment_methods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- 'tarjeta', 'transferencia', 'efectivo'
    description VARCHAR(100),
    requires_card BOOLEAN DEFAULT FALSE, -- Indica si requiere asociar una tarjeta
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de tarjetas (asociadas a cuentas)
CREATE TABLE cards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
    card_name VARCHAR(100) NOT NULL, -- Nombre personalizado de la tarjeta
    card_type VARCHAR(20) NOT NULL CHECK (card_type IN ('credit', 'debit')),
    last_four_digits VARCHAR(4), -- Últimos 4 dígitos para identificación
    brand VARCHAR(20), -- Visa, MasterCard, American Express, etc.
    credit_limit DECIMAL(12, 2), -- Solo para tarjetas de crédito
    current_balance DECIMAL(12, 2) DEFAULT 0.00, -- Saldo actual (para crédito)
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Modificar tabla de transacciones para incluir nuevos campos
ALTER TABLE transactions 
ADD COLUMN payment_method_id INTEGER REFERENCES payment_methods(id),
ADD COLUMN card_id INTEGER REFERENCES cards(id),
ADD COLUMN currency_id INTEGER REFERENCES currencies(id),
ADD COLUMN exchange_rate DECIMAL(10, 6) DEFAULT 1.00, -- Tipo de cambio si es diferente a la moneda base
ADD COLUMN original_amount DECIMAL(12, 2), -- Monto original en la moneda de la transacción
ADD COLUMN payment_reference VARCHAR(100); -- Referencia del pago (número de cheque, referencia bancaria, etc.)

-- Insertar divisas por defecto
INSERT INTO currencies (code, name, symbol) VALUES
('MXN', 'Peso Mexicano', '$'),
('USD', 'Dólar Estadounidense', '$'),
('EUR', 'Euro', '€');

-- Insertar métodos de pago por defecto
INSERT INTO payment_methods (name, description, requires_card) VALUES
('efectivo', 'Pago en efectivo', FALSE),
('transferencia', 'Transferencia bancaria', FALSE),
('tarjeta', 'Pago con tarjeta', TRUE);

-- Índices para mejorar rendimiento
CREATE INDEX idx_cards_user_id ON cards(user_id);
CREATE INDEX idx_cards_account_id ON cards(account_id);
CREATE INDEX idx_transactions_payment_method_id ON transactions(payment_method_id);
CREATE INDEX idx_transactions_card_id ON transactions(card_id);
CREATE INDEX idx_transactions_currency_id ON transactions(currency_id);

-- Función para actualizar saldo de tarjetas de crédito
CREATE OR REPLACE FUNCTION update_card_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Solo actualizar si es una tarjeta de crédito y se usó esta tarjeta
        IF NEW.card_id IS NOT NULL THEN
            UPDATE cards 
            SET current_balance = current_balance + 
                CASE 
                    WHEN NEW.transaction_type = 'expense' THEN NEW.amount
                    ELSE -NEW.amount -- Los ingresos reducen el saldo de la tarjeta de crédito
                END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.card_id AND card_type = 'credit';
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Revertir saldo de tarjeta al eliminar transacción
        IF OLD.card_id IS NOT NULL THEN
            UPDATE cards 
            SET current_balance = current_balance - 
                CASE 
                    WHEN OLD.transaction_type = 'expense' THEN OLD.amount
                    ELSE -OLD.amount
                END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = OLD.card_id AND card_type = 'credit';
        END IF;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Ajustar saldo de tarjeta al actualizar transacción
        -- Primero revertir el cambio anterior
        IF OLD.card_id IS NOT NULL THEN
            UPDATE cards 
            SET current_balance = current_balance - 
                CASE 
                    WHEN OLD.transaction_type = 'expense' THEN OLD.amount
                    ELSE -OLD.amount
                END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = OLD.card_id AND card_type = 'credit';
        END IF;
        
        -- Luego aplicar el nuevo cambio
        IF NEW.card_id IS NOT NULL THEN
            UPDATE cards 
            SET current_balance = current_balance + 
                CASE 
                    WHEN NEW.transaction_type = 'expense' THEN NEW.amount
                    ELSE -NEW.amount
                END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.card_id AND card_type = 'credit';
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar saldo de tarjetas
CREATE TRIGGER trigger_update_card_balance
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_card_balance();

-- Comentarios para documentación
COMMENT ON TABLE currencies IS 'Divisas disponibles para transacciones';
COMMENT ON TABLE payment_methods IS 'Métodos de pago disponibles';
COMMENT ON TABLE cards IS 'Tarjetas asociadas a cuentas bancarias';
COMMENT ON COLUMN transactions.payment_method_id IS 'Método de pago utilizado';
COMMENT ON COLUMN transactions.card_id IS 'Tarjeta utilizada (si aplica)';
COMMENT ON COLUMN transactions.currency_id IS 'Divisa de la transacción';
COMMENT ON COLUMN transactions.exchange_rate IS 'Tipo de cambio aplicado';
COMMENT ON COLUMN transactions.original_amount IS 'Monto original en la divisa de la transacción';
