/**
 * Consultas SQL para la gestión de inversiones
 */

module.exports = {
    // Obtener todas las inversiones activas
    GET_ALL_INVESTMENTS: `
        SELECT i.*, a.name as account_name
        FROM investments i
        LEFT JOIN accounts a ON i.account_id = a.id
        WHERE i.is_active = true
        ORDER BY i.created_at DESC
    `,

    // Crear nueva inversión
    CREATE_INVESTMENT: `
        INSERT INTO investments (
            symbol, name, investment_type, shares, purchase_price, 
            purchase_amount, purchase_date, account_id, current_price, 
            current_value, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
    `,

    // Crear transacción asociada a inversión
    CREATE_INVESTMENT_TRANSACTION: `
        INSERT INTO transactions (
            account_id, amount, transaction_type, description, 
            transaction_date, notes
        ) VALUES ($1, $2, 'expense', $3, $4, $5)
        RETURNING *
    `,

    // Obtener inversión por ID con detalles
    GET_INVESTMENT_BY_ID: `
        SELECT i.*, a.name as account_name
        FROM investments i
        LEFT JOIN accounts a ON i.account_id = a.id
        WHERE i.id = $1 AND i.is_active = true
    `,

    // Actualizar inversión
    UPDATE_INVESTMENT: `
        UPDATE investments 
        SET symbol = $1, name = $2, investment_type = $3, 
            shares = $4, purchase_price = $5, purchase_amount = $6,
            purchase_date = $7, account_id = $8, notes = $9,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $10 AND is_active = true
        RETURNING *
    `,

    // Verificar inversión existe y está activa
    CHECK_INVESTMENT_EXISTS: `
        SELECT * FROM investments 
        WHERE id = $1 AND is_active = true
    `,

    // Vender inversión (actualizar valores y estado)
    SELL_INVESTMENT: `
        UPDATE investments 
        SET current_price = $1, 
            current_value = $2,
            updated_at = CURRENT_TIMESTAMP,
            is_active = false,
            sale_date = $3,
            sale_price = $1,
            sale_amount = $2
        WHERE id = $4 AND is_active = true
        RETURNING *
    `,

    // Crear transacción de venta
    CREATE_SALE_TRANSACTION: `
        INSERT INTO transactions (
            account_id, amount, transaction_type, description, 
            transaction_date, notes
        ) VALUES ($1, $2, 'income', $3, $4, $5)
        RETURNING *
    `,

    // Eliminar inversión (soft delete)
    SOFT_DELETE_INVESTMENT: `
        UPDATE investments 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND is_active = true
        RETURNING *
    `,

    // Actualizar precio actual de inversión
    UPDATE_CURRENT_PRICE: `
        UPDATE investments 
        SET current_price = $1, 
            current_value = shares * $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND is_active = true
        RETURNING *
    `,

    // Obtener resumen de inversiones por tipo
    GET_INVESTMENT_SUMMARY_BY_TYPE: `
        SELECT 
            investment_type,
            COUNT(*) as count,
            SUM(purchase_amount) as total_invested,
            SUM(current_value) as current_value,
            SUM(current_value - purchase_amount) as unrealized_gain_loss
        FROM investments
        WHERE is_active = true
        GROUP BY investment_type
        ORDER BY total_invested DESC
    `,

    // Obtener mejores y peores rendimientos
    GET_PERFORMANCE_RANKING: `
        SELECT 
            symbol,
            name,
            purchase_amount,
            current_value,
            (current_value - purchase_amount) as gain_loss,
            CASE 
                WHEN purchase_amount > 0 THEN 
                    ((current_value - purchase_amount) / purchase_amount) * 100 
                ELSE 0 
            END as return_percentage
        FROM investments
        WHERE is_active = true AND purchase_amount > 0
        ORDER BY return_percentage DESC
    `
};
