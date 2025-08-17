/**
 * Consultas SQL para el dashboard y métricas
 */

module.exports = {
    // Obtener balance total de todas las cuentas
    GET_TOTAL_BALANCE: `
        SELECT COALESCE(SUM(current_balance), 0) as total_balance
        FROM accounts 
        WHERE is_active = true
    `,

    // Obtener ingresos y gastos del mes actual
    GET_MONTHLY_TOTALS: `
        SELECT 
            COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END), 0) as total_income,
            COALESCE(SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END), 0) as total_expense
        FROM transactions 
        WHERE DATE_TRUNC('month', transaction_date) = DATE_TRUNC('month', CURRENT_DATE)
    `,

    // Obtener transacciones por categoría (mes actual)
    GET_EXPENSES_BY_CATEGORY: `
        SELECT 
            c.name,
            c.color,
            COALESCE(SUM(t.amount), 0) as total
        FROM categories c
        LEFT JOIN transactions t ON c.id = t.category_id 
            AND t.transaction_type = 'expense'
            AND DATE_TRUNC('month', t.transaction_date) = DATE_TRUNC('month', CURRENT_DATE)
        WHERE c.type = 'expense'
        GROUP BY c.id, c.name, c.color
        HAVING COALESCE(SUM(t.amount), 0) > 0
        ORDER BY total DESC
        LIMIT 10
    `,

    // Obtener transacciones recientes
    GET_RECENT_TRANSACTIONS: `
        SELECT 
            t.id,
            t.amount,
            t.description,
            t.transaction_type,
            t.transaction_date,
            a.name as account_name,
            c.name as category_name,
            c.color as category_color
        FROM transactions t
        LEFT JOIN accounts a ON t.account_id = a.id
        LEFT JOIN categories c ON t.category_id = c.id
        ORDER BY t.transaction_date DESC, t.created_at DESC
        LIMIT $1
    `,

    // Obtener tendencia mensual (últimos 6 meses)
    GET_MONTHLY_TRENDS: `
        SELECT 
            TO_CHAR(transaction_date, 'YYYY-MM') as month,
            COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END), 0) as income,
            COALESCE(SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END), 0) as expenses
        FROM transactions
        WHERE transaction_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '5 months')
        GROUP BY TO_CHAR(transaction_date, 'YYYY-MM')
        ORDER BY month
    `,

    // Obtener balance por cuenta
    GET_ACCOUNTS_BALANCE: `
        SELECT 
            id,
            name,
            account_type,
            current_balance,
            initial_balance
        FROM accounts 
        WHERE is_active = true
        ORDER BY current_balance DESC
    `,

    // Obtener estadísticas de deudas
    GET_DEBT_STATS: `
        SELECT 
            COALESCE(SUM(CASE WHEN debt_type = 'owed_to_me' THEN remaining_amount ELSE 0 END), 0) as total_owed_to_me,
            COALESCE(SUM(CASE WHEN debt_type = 'i_owe' THEN remaining_amount ELSE 0 END), 0) as total_i_owe,
            COUNT(CASE WHEN debt_type = 'owed_to_me' AND is_active = true THEN 1 END) as active_receivables,
            COUNT(CASE WHEN debt_type = 'i_owe' AND is_active = true THEN 1 END) as active_payables
        FROM debts
        WHERE is_active = true
    `,

    // Obtener estadísticas de inversiones
    GET_INVESTMENT_STATS: `
        SELECT 
            COUNT(*) as total_investments,
            COALESCE(SUM(purchase_amount), 0) as total_invested,
            COALESCE(SUM(current_value), 0) as current_value,
            COALESCE(SUM(current_value - purchase_amount), 0) as unrealized_gain_loss
        FROM investments
        WHERE is_active = true
    `
};
