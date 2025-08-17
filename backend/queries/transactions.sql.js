/**
 * Consultas SQL para la gestión de transacciones
 */

module.exports = {
    // Obtener transacciones con paginación
    GET_TRANSACTIONS_WITH_PAGINATION: `
        SELECT 
            t.*, 
            a.name as account_name, 
            c.name as category_name, 
            c.color as category_color,
            pm.name as payment_method_name,
            pm.requires_card,
            cr.name as card_name,
            cr.card_type,
            cr.last_four_digits,
            cur.code as currency_code,
            cur.symbol as currency_symbol
        FROM transactions t
        LEFT JOIN accounts a ON t.account_id = a.id
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN payment_methods pm ON t.payment_method_id = pm.id
        LEFT JOIN cards cr ON t.card_id = cr.id
        LEFT JOIN currencies cur ON t.currency_id = cur.id
        WHERE ($1::text IS NULL OR t.account_id = $1::int)
        AND ($2::text IS NULL OR c.type = $2)
        AND ($3::date IS NULL OR t.transaction_date >= $3)
        AND ($4::date IS NULL OR t.transaction_date <= $4)
        AND ($5::text IS NULL OR 
             LOWER(t.description) LIKE LOWER($5) OR 
             LOWER(a.name) LIKE LOWER($5) OR 
             LOWER(c.name) LIKE LOWER($5))
    `,

    // Contar transacciones para paginación
    COUNT_TRANSACTIONS: `
        SELECT COUNT(*) as total
        FROM transactions t
        LEFT JOIN accounts a ON t.account_id = a.id
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE ($1::text IS NULL OR t.account_id = $1::int)
        AND ($2::text IS NULL OR c.type = $2)
        AND ($3::date IS NULL OR t.transaction_date >= $3)
        AND ($4::date IS NULL OR t.transaction_date <= $4)
        AND ($5::text IS NULL OR 
             LOWER(t.description) LIKE LOWER($5) OR 
             LOWER(a.name) LIKE LOWER($5) OR 
             LOWER(c.name) LIKE LOWER($5))
    `,

    // Crear transacción
    CREATE_TRANSACTION: `
        INSERT INTO transactions (
            account_id, category_id, amount, transaction_type, description, 
            transaction_date, notes, recurring_series_id, payment_method_id, 
            card_id, currency_id, exchange_rate, original_amount, payment_reference
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
    `,

    // Obtener transacción por ID con detalles
    GET_TRANSACTION_BY_ID: `
        SELECT 
            t.*, 
            a.name as account_name, 
            c.name as category_name, 
            c.color as category_color,
            pm.name as payment_method_name,
            pm.requires_card,
            cr.name as card_name,
            cr.card_type,
            cr.last_four_digits,
            cur.code as currency_code,
            cur.symbol as currency_symbol
        FROM transactions t
        LEFT JOIN accounts a ON t.account_id = a.id
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN payment_methods pm ON t.payment_method_id = pm.id
        LEFT JOIN cards cr ON t.card_id = cr.id
        LEFT JOIN currencies cur ON t.currency_id = cur.id
        WHERE t.id = $1
    `,

    // Actualizar transacción
    UPDATE_TRANSACTION: `
        UPDATE transactions 
        SET account_id = $1, category_id = $2, amount = $3, 
            transaction_type = $4, description = $5, 
            transaction_date = $6, notes = $7,
            payment_method_id = $8, card_id = $9, currency_id = $10,
            exchange_rate = $11, original_amount = $12, payment_reference = $13,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $14
        RETURNING *
    `,

    // Eliminar transacción
    DELETE_TRANSACTION: `
        DELETE FROM transactions 
        WHERE id = $1 
        RETURNING *
    `,

    // Obtener todas las categorías
    GET_ALL_CATEGORIES: `
        SELECT * FROM categories
    `,

    // Obtener categorías por tipo
    GET_CATEGORIES_BY_TYPE: `
        SELECT * FROM categories 
        WHERE type = $1 
        ORDER BY name
    `,

    // Obtener resumen de categorías con totales
    GET_CATEGORY_SUMMARY: `
        SELECT 
            c.id,
            c.name,
            c.type,
            c.color,
            COALESCE(SUM(CASE WHEN t.transaction_type = 'income' THEN t.amount ELSE 0 END), 0) as total_income,
            COALESCE(SUM(CASE WHEN t.transaction_type = 'expense' THEN t.amount ELSE 0 END), 0) as total_expense,
            COUNT(t.id) as transaction_count
        FROM categories c
        LEFT JOIN transactions t ON c.id = t.category_id
        AND ($1::date IS NULL OR t.transaction_date >= $1)
        AND ($2::date IS NULL OR t.transaction_date <= $2)
        GROUP BY c.id, c.name, c.type, c.color
        ORDER BY 
            CASE WHEN c.type = 'expense' THEN total_expense ELSE total_income END DESC,
            c.name
    `,

    // Crear categoría
    CREATE_CATEGORY: `
        INSERT INTO categories (name, type, color) 
        VALUES ($1, $2, $3) 
        RETURNING *
    `,

    // Actualizar categoría
    UPDATE_CATEGORY: `
        UPDATE categories 
        SET name = $1, type = $2, color = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
    `,

    // Verificar si categoría tiene transacciones
    CHECK_CATEGORY_USAGE: `
        SELECT COUNT(*) as count 
        FROM transactions 
        WHERE category_id = $1
    `,

    // Eliminar categoría
    DELETE_CATEGORY: `
        DELETE FROM categories 
        WHERE id = $1 
        RETURNING *
    `
};
