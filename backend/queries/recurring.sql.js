/**
 * Consultas SQL para la gestión de transacciones recurrentes
 */

module.exports = {
    // Obtener todas las transacciones recurrentes
    GET_ALL_RECURRING: `
        SELECT rs.*, a.name as account_name, c.name as category_name, c.color as category_color,
        CASE 
            WHEN rs.frequency_type = 'daily' THEN 'Diario'
            WHEN rs.frequency_type = 'weekly' THEN 'Semanal'
            WHEN rs.frequency_type = 'monthly' THEN 'Mensual'
            WHEN rs.frequency_type = 'yearly' THEN 'Anual'
            ELSE rs.frequency_type
        END as frequency_display
        FROM recurring_series rs
        LEFT JOIN accounts a ON rs.account_id = a.id
        LEFT JOIN categories c ON rs.category_id = c.id
        ORDER BY rs.created_at DESC
    `,

    // Crear serie recurrente
    CREATE_RECURRING_SERIES: `
        INSERT INTO recurring_series (
            account_id, category_id, amount, transaction_type, description,
            start_date, end_date, frequency_type, frequency_interval,
            day_of_month, day_of_week, notes, next_generation_date, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
        RETURNING *
    `,

    // Actualizar serie recurrente completa
    UPDATE_RECURRING_SERIES: `
        UPDATE recurring_series 
        SET account_id = $1, category_id = $2, amount = $3, transaction_type = $4,
            description = $5, start_date = $6, end_date = $7, frequency_type = $8,
            frequency_interval = $9, day_of_month = $10, day_of_week = $11,
            notes = $12, updated_at = CURRENT_TIMESTAMP
        WHERE id = $13
        RETURNING *
    `,

    // Actualizar solo campos básicos de serie recurrente
    UPDATE_RECURRING_BASIC: `
        UPDATE recurring_series 
        SET amount = $1, description = $2, notes = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
    `,

    // Actualizar transacciones futuras generadas
    UPDATE_FUTURE_TRANSACTIONS: `
        UPDATE transactions 
        SET amount = $1, description = $2, notes = $3, updated_at = CURRENT_TIMESTAMP
        WHERE recurring_series_id = $4 AND transaction_date >= CURRENT_DATE
        RETURNING *
    `,

    // Actualizar todas las transacciones generadas
    UPDATE_ALL_TRANSACTIONS: `
        UPDATE transactions 
        SET amount = $1, description = $2, notes = $3, updated_at = CURRENT_TIMESTAMP
        WHERE recurring_series_id = $4
        RETURNING *
    `,

    // Alternar estado activo/inactivo
    TOGGLE_ACTIVE_STATUS: `
        UPDATE recurring_series 
        SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
    `,

    // Eliminar serie recurrente
    DELETE_RECURRING_SERIES: `
        DELETE FROM recurring_series 
        WHERE id = $1 
        RETURNING *
    `,

    // Generar transacciones automáticamente
    GENERATE_TRANSACTIONS: `
        SELECT generate_recurring_transactions()
    `,

    // Obtener transacciones generadas por serie recurrente
    GET_GENERATED_TRANSACTIONS: `
        SELECT t.*, a.name as account_name, c.name as category_name
        FROM transactions t
        LEFT JOIN accounts a ON t.account_id = a.id
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.recurring_series_id = $1
        ORDER BY t.transaction_date DESC
    `,

    // Obtener series recurrentes activas para procesamiento
    GET_ACTIVE_SERIES_FOR_PROCESSING: `
        SELECT * FROM recurring_series 
        WHERE is_active = true 
        AND (end_date IS NULL OR end_date >= CURRENT_DATE)
        AND next_generation_date <= CURRENT_DATE
        ORDER BY next_generation_date
    `,

    // Calcular próxima fecha de generación para días hábiles
    CALCULATE_NEXT_BUSINESS_DATE: `
        SELECT calculate_next_business_date($1, $2, $3) as final_date
    `,

    // Insertar transacción generada automáticamente
    INSERT_GENERATED_TRANSACTION: `
        INSERT INTO transactions (
            account_id, category_id, amount, transaction_type, description,
            transaction_date, notes, recurring_series_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
    `,

    // Actualizar fecha de próxima generación
    UPDATE_NEXT_GENERATION_DATE: `
        UPDATE recurring_series 
        SET next_generation_date = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
    `,

    // Eliminar transacciones futuras al eliminar serie recurrente
    DELETE_FUTURE_TRANSACTIONS: `
        DELETE FROM transactions 
        WHERE recurring_series_id = $1 AND transaction_date >= CURRENT_DATE
        RETURNING *
    `
};
