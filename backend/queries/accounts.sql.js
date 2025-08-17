/**
 * Consultas SQL para la gestión de cuentas
 */

module.exports = {
    // Obtener todas las cuentas activas
    GET_ALL_ACTIVE: `
        SELECT id, name, initial_balance, current_balance, account_type, is_active, created_at
        FROM accounts 
        WHERE is_active = true 
        ORDER BY created_at DESC
    `,

    // Crear nueva cuenta
    CREATE_ACCOUNT: `
        INSERT INTO accounts (name, initial_balance, current_balance, account_type) 
        VALUES ($1, $2, $2, $3) 
        RETURNING *
    `,

    // Actualizar cuenta
    UPDATE_ACCOUNT: `
        UPDATE accounts 
        SET name = $1, account_type = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3 AND is_active = true
        RETURNING *
    `,

    // Eliminar cuenta (soft delete)
    SOFT_DELETE_ACCOUNT: `
        UPDATE accounts 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND is_active = true
        RETURNING *
    `,

    // Obtener cuenta por ID
    GET_BY_ID: `
        SELECT id, name, initial_balance, current_balance, account_type, is_active, created_at
        FROM accounts 
        WHERE id = $1 AND is_active = true
    `,

    // Actualizar balance de cuenta
    UPDATE_BALANCE: `
        UPDATE accounts 
        SET current_balance = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND is_active = true
        RETURNING *
    `,

    // Verificar si existen transacciones asociadas
    CHECK_TRANSACTIONS_EXISTS: `
        SELECT COUNT(*) as count 
        FROM transactions 
        WHERE account_id = $1
    `
};
