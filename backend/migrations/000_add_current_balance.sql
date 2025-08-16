-- Migración para agregar columna current_balance a accounts
-- Este script es seguro de ejecutar múltiples veces

-- Agregar columna current_balance si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accounts' AND column_name = 'current_balance'
    ) THEN
        ALTER TABLE accounts ADD COLUMN current_balance DECIMAL(12, 2) DEFAULT 0.00;
        RAISE NOTICE 'Columna current_balance agregada a la tabla accounts';
    ELSE
        RAISE NOTICE 'La columna current_balance ya existe en la tabla accounts';
    END IF;
END $$;

-- Inicializar current_balance con el valor de initial_balance para cuentas existentes
UPDATE accounts 
SET current_balance = initial_balance 
WHERE current_balance = 0 OR current_balance IS NULL;

-- Crear función para actualizar balance de cuenta automáticamente
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Si es INSERT (nueva transacción)
    IF TG_OP = 'INSERT' THEN
        IF NEW.transaction_type = 'income' THEN
            UPDATE accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.account_id;
        ELSE
            UPDATE accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
        END IF;
        RETURN NEW;
    END IF;
    
    -- Si es UPDATE (modificar transacción)
    IF TG_OP = 'UPDATE' THEN
        -- Revertir la transacción anterior
        IF OLD.transaction_type = 'income' THEN
            UPDATE accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.account_id;
        ELSE
            UPDATE accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
        END IF;
        
        -- Aplicar la nueva transacción
        IF NEW.transaction_type = 'income' THEN
            UPDATE accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.account_id;
        ELSE
            UPDATE accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
        END IF;
        RETURN NEW;
    END IF;
    
    -- Si es DELETE (eliminar transacción)
    IF TG_OP = 'DELETE' THEN
        -- Revertir la transacción
        IF OLD.transaction_type = 'income' THEN
            UPDATE accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.account_id;
        ELSE
            UPDATE accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger si no existe
DROP TRIGGER IF EXISTS trigger_update_account_balance ON transactions;
CREATE TRIGGER trigger_update_account_balance
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_account_balance();

RAISE NOTICE 'Migración de current_balance completada exitosamente';
