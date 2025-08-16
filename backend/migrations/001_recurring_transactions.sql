-- Migración para sistema de transacciones recurrentes mejorado

-- Tabla para series de transacciones recurrentes
CREATE TABLE recurring_series (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id),
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('income', 'expense')),
    
    -- Configuración de recurrencia
    recurrence_type VARCHAR(20) NOT NULL CHECK (recurrence_type IN ('simple', 'custom')),
    frequency_type VARCHAR(20) CHECK (frequency_type IN ('daily', 'weekly', 'monthly', 'yearly')),
    frequency_interval INTEGER DEFAULT 1, -- cada X días/semanas/meses/años
    
    -- Fechas de control
    start_date DATE NOT NULL,
    end_date DATE, -- NULL = infinito
    next_generation_date DATE NOT NULL,
    
    -- Lógica personalizada (opcional)
    custom_logic TEXT, -- código JavaScript para validaciones especiales
    use_custom_logic BOOLEAN DEFAULT FALSE,
    
    -- Control de días laborables
    skip_weekends BOOLEAN DEFAULT FALSE,
    skip_holidays BOOLEAN DEFAULT FALSE,
    
    -- Metadatos
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Modificar tabla transactions para vincular con series
ALTER TABLE transactions 
ADD COLUMN recurring_series_id INTEGER REFERENCES recurring_series(id) ON DELETE SET NULL,
ADD COLUMN is_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN generation_date TIMESTAMP;

-- Tabla para días festivos (opcional)
CREATE TABLE holidays (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    name VARCHAR(100) NOT NULL,
    country_code VARCHAR(2) DEFAULT 'CO',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_recurring_series_user_id ON recurring_series(user_id);
CREATE INDEX idx_recurring_series_next_date ON recurring_series(next_generation_date);
CREATE INDEX idx_transactions_recurring_series ON transactions(recurring_series_id);
CREATE INDEX idx_holidays_date ON holidays(date);

-- Función para calcular próxima fecha considerando días laborables
CREATE OR REPLACE FUNCTION calculate_next_business_date(
    input_date DATE,
    skip_weekends BOOLEAN DEFAULT FALSE,
    skip_holidays BOOLEAN DEFAULT FALSE
) RETURNS DATE AS $$
DECLARE
    result_date DATE := input_date;
BEGIN
    -- Si no necesita validaciones, devolver la fecha original
    IF NOT skip_weekends AND NOT skip_holidays THEN
        RETURN result_date;
    END IF;
    
    -- Ajustar por fines de semana
    IF skip_weekends THEN
        -- Si es sábado (6), mover a viernes
        IF EXTRACT(DOW FROM result_date) = 6 THEN
            result_date := result_date - INTERVAL '1 day';
        -- Si es domingo (0), mover a viernes
        ELSIF EXTRACT(DOW FROM result_date) = 0 THEN
            result_date := result_date - INTERVAL '2 days';
        END IF;
    END IF;
    
    -- Ajustar por festivos
    IF skip_holidays AND EXISTS(SELECT 1 FROM holidays WHERE date = result_date) THEN
        -- Mover al día anterior hasta encontrar un día no festivo
        WHILE EXISTS(SELECT 1 FROM holidays WHERE date = result_date) 
              OR (skip_weekends AND EXTRACT(DOW FROM result_date) IN (0, 6)) LOOP
            result_date := result_date - INTERVAL '1 day';
        END LOOP;
    END IF;
    
    RETURN result_date;
END;
$$ LANGUAGE plpgsql;

-- Función para generar próximas transacciones
CREATE OR REPLACE FUNCTION generate_recurring_transactions()
RETURNS INTEGER AS $$
DECLARE
    series_record RECORD;
    new_transaction_date DATE;
    next_date DATE;
    generated_count INTEGER := 0;
BEGIN
    FOR series_record IN 
        SELECT * FROM recurring_series 
        WHERE is_active = TRUE 
        AND next_generation_date <= CURRENT_DATE
        AND (end_date IS NULL OR next_generation_date <= end_date)
    LOOP
        -- Calcular fecha de transacción con validaciones
        new_transaction_date := calculate_next_business_date(
            series_record.next_generation_date,
            series_record.skip_weekends,
            series_record.skip_holidays
        );
        
        -- Crear la transacción
        INSERT INTO transactions (
            user_id,
            account_id,
            category_id,
            description,
            amount,
            transaction_type,
            transaction_date,
            frequency,
            is_recurring,
            recurring_series_id,
            is_generated,
            generation_date,
            notes
        ) VALUES (
            series_record.user_id,
            series_record.account_id,
            series_record.category_id,
            series_record.description,
            series_record.amount,
            series_record.transaction_type,
            new_transaction_date,
            CASE 
                WHEN series_record.recurrence_type = 'custom' THEN 
                    'custom-' || series_record.frequency_interval || '-' || series_record.frequency_type
                ELSE series_record.frequency_type
            END,
            TRUE,
            series_record.id,
            TRUE,
            CURRENT_TIMESTAMP,
            series_record.notes
        );
        
        -- Calcular próxima fecha de generación
        CASE series_record.frequency_type
            WHEN 'daily' THEN
                next_date := series_record.next_generation_date + (series_record.frequency_interval || ' days')::INTERVAL;
            WHEN 'weekly' THEN
                next_date := series_record.next_generation_date + (series_record.frequency_interval || ' weeks')::INTERVAL;
            WHEN 'monthly' THEN
                next_date := series_record.next_generation_date + (series_record.frequency_interval || ' months')::INTERVAL;
            WHEN 'yearly' THEN
                next_date := series_record.next_generation_date + (series_record.frequency_interval || ' years')::INTERVAL;
        END CASE;
        
        -- Actualizar la serie con la próxima fecha
        UPDATE recurring_series 
        SET next_generation_date = next_date,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = series_record.id;
        
        generated_count := generated_count + 1;
    END LOOP;
    
    RETURN generated_count;
END;
$$ LANGUAGE plpgsql;

-- Insertar algunos festivos colombianos como ejemplo
INSERT INTO holidays (date, name, country_code) VALUES
('2025-01-01', 'Año Nuevo', 'CO'),
('2025-01-06', 'Día de los Reyes Magos', 'CO'),
('2025-03-24', 'Día de San José', 'CO'),
('2025-04-17', 'Jueves Santo', 'CO'),
('2025-04-18', 'Viernes Santo', 'CO'),
('2025-05-01', 'Día del Trabajo', 'CO'),
('2025-06-02', 'Ascensión del Señor', 'CO'),
('2025-06-23', 'Corpus Christi', 'CO'),
('2025-07-07', 'Día de San Pedro y San Pablo', 'CO'),
('2025-07-20', 'Día de la Independencia', 'CO'),
('2025-08-07', 'Batalla de Boyacá', 'CO'),
('2025-08-18', 'Asunción de la Virgen', 'CO'),
('2025-10-13', 'Día de la Raza', 'CO'),
('2025-11-03', 'Día de Todos los Santos', 'CO'),
('2025-11-17', 'Independencia de Cartagena', 'CO'),
('2025-12-08', 'Día de la Inmaculada Concepción', 'CO'),
('2025-12-25', 'Navidad', 'CO');
