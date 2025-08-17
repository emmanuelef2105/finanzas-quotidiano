/**
 * Consultas SQL para la gestión de deudas
 */

module.exports = {
    // Obtener todas las deudas activas
    GET_ALL_DEBTS: `
        SELECT d.*, a.name as account_name
        FROM debts d
        LEFT JOIN accounts a ON d.account_id = a.id
        WHERE d.is_active = true
        ORDER BY d.due_date ASC, d.created_at DESC
    `,

    // Crear nueva deuda
    CREATE_DEBT: `
        INSERT INTO debts (
            debtor_name, creditor_name, original_amount, remaining_amount,
            debt_type, description, due_date, interest_rate, account_id, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
    `,

    // Obtener deuda por ID
    GET_DEBT_BY_ID: `
        SELECT d.*, a.name as account_name
        FROM debts d
        LEFT JOIN accounts a ON d.account_id = a.id
        WHERE d.id = $1 AND d.is_active = true
    `,

    // Actualizar deuda
    UPDATE_DEBT: `
        UPDATE debts 
        SET debtor_name = $1, creditor_name = $2, original_amount = $3,
            remaining_amount = $4, debt_type = $5, description = $6,
            due_date = $7, interest_rate = $8, account_id = $9, notes = $10,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $11 AND is_active = true
        RETURNING *
    `,

    // Eliminar deuda (soft delete)
    SOFT_DELETE_DEBT: `
        UPDATE debts 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND is_active = true
        RETURNING *
    `,

    // Registrar pago de deuda
    RECORD_DEBT_PAYMENT: `
        UPDATE debts 
        SET remaining_amount = remaining_amount - $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND is_active = true
        RETURNING *
    `,

    // Crear transacción de pago de deuda
    CREATE_DEBT_PAYMENT_TRANSACTION: `
        INSERT INTO transactions (
            account_id, amount, transaction_type, description, 
            transaction_date, notes
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
    `,

    // Marcar deuda como pagada
    MARK_DEBT_AS_PAID: `
        UPDATE debts 
        SET remaining_amount = 0, 
            is_paid = true,
            paid_date = CURRENT_DATE,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND is_active = true
        RETURNING *
    `,

    // Obtener deudas por vencer (próximos 30 días)
    GET_DEBTS_DUE_SOON: `
        SELECT d.*, a.name as account_name
        FROM debts d
        LEFT JOIN accounts a ON d.account_id = a.id
        WHERE d.is_active = true 
        AND d.is_paid = false
        AND d.due_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')
        ORDER BY d.due_date ASC
    `,

    // Obtener deudas vencidas
    GET_OVERDUE_DEBTS: `
        SELECT d.*, a.name as account_name
        FROM debts d
        LEFT JOIN accounts a ON d.account_id = a.id
        WHERE d.is_active = true 
        AND d.is_paid = false
        AND d.due_date < CURRENT_DATE
        ORDER BY d.due_date ASC
    `,

    // Obtener resumen de deudas por tipo
    GET_DEBT_SUMMARY_BY_TYPE: `
        SELECT 
            debt_type,
            COUNT(*) as count,
            SUM(original_amount) as total_original,
            SUM(remaining_amount) as total_remaining,
            SUM(original_amount - remaining_amount) as total_paid
        FROM debts
        WHERE is_active = true
        GROUP BY debt_type
        ORDER BY total_remaining DESC
    `,

    // Obtener historial de pagos de una deuda específica
    GET_DEBT_PAYMENT_HISTORY: `
        SELECT t.*
        FROM transactions t
        WHERE t.description LIKE '%deuda%' 
        AND t.description LIKE $1
        ORDER BY t.transaction_date DESC
    `
};
