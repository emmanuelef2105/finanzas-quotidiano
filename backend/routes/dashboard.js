const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Obtener resumen general del dashboard
router.get('/summary', async (req, res) => {
    try {
        // Capital actual (suma de balances de cuentas + inversiones activas)
        const capitalQuery = await db.query(`
            SELECT 
                COALESCE(SUM(current_balance), 0) as total_accounts,
                (SELECT COALESCE(SUM(amount), 0) FROM investments WHERE is_active = true) as total_investments
            FROM accounts WHERE is_active = true
        `);
        
        const currentCapital = parseFloat(capitalQuery.rows[0].total_accounts) + parseFloat(capitalQuery.rows[0].total_investments);
        
        // Ingresos y gastos del mes actual
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        
        const monthlyQuery = await db.query(`
            SELECT 
                transaction_type,
                COALESCE(SUM(amount), 0) as total
            FROM transactions 
            WHERE 
                EXTRACT(MONTH FROM transaction_date) = $1 
                AND EXTRACT(YEAR FROM transaction_date) = $2
            GROUP BY transaction_type
        `, [currentMonth, currentYear]);
        
        let monthlyIncome = 0;
        let monthlyExpenses = 0;
        
        monthlyQuery.rows.forEach(row => {
            if (row.transaction_type === 'income') {
                monthlyIncome = parseFloat(row.total);
            } else if (row.transaction_type === 'expense') {
                monthlyExpenses = parseFloat(row.total);
            }
        });
        
        // Total de deudas por cobrar (balance pendiente)
        const debtsToCollectQuery = await db.query(`
            SELECT 
                COALESCE(
                    (SELECT SUM(amount) FROM debt_items) - 
                    (SELECT COALESCE(SUM(amount), 0) FROM debt_payments), 0
                ) as total_debts_to_collect
        `);
        
        const debtsToCollect = parseFloat(debtsToCollectQuery.rows[0].total_debts_to_collect);
        
        // Total de mis deudas pendientes
        const myDebtsQuery = await db.query(`
            SELECT COALESCE(SUM(current_balance), 0) as total_my_debts
            FROM my_debts 
            WHERE is_paid = false
        `);
        
        const myDebts = parseFloat(myDebtsQuery.rows[0].total_my_debts);
        
        res.json({
            currentCapital,
            monthlyIncome,
            monthlyExpenses,
            debtsToCollect,
            myDebts,
            netWorth: currentCapital + debtsToCollect - myDebts,
            monthlyBalance: monthlyIncome - monthlyExpenses
        });
    } catch (error) {
        console.error('Error al obtener resumen del dashboard:', error);
        res.status(500).json({ error: 'Error al obtener resumen del dashboard' });
    }
});

// Obtener transacciones recientes
router.get('/recent-transactions', async (req, res) => {
    const limit = req.query.limit || 10;
    
    try {
        const result = await db.query(`
            SELECT 
                t.id, t.description, t.amount, t.transaction_type, 
                t.transaction_date, a.name as account_name, c.name as category_name
            FROM transactions t
            LEFT JOIN accounts a ON t.account_id = a.id
            LEFT JOIN categories c ON t.category_id = c.id
            ORDER BY t.transaction_date DESC, t.created_at DESC
            LIMIT $1
        `, [limit]);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener transacciones recientes:', error);
        res.status(500).json({ error: 'Error al obtener transacciones recientes' });
    }
});

// Obtener estadísticas por categorías (mes actual)
router.get('/category-stats', async (req, res) => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    try {
        const result = await db.query(`
            SELECT 
                c.name as category_name,
                c.color as category_color,
                t.transaction_type,
                SUM(t.amount) as total,
                COUNT(t.id) as transaction_count
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE 
                EXTRACT(MONTH FROM t.transaction_date) = $1 
                AND EXTRACT(YEAR FROM t.transaction_date) = $2
            GROUP BY c.id, c.name, c.color, t.transaction_type
            ORDER BY total DESC
        `, [currentMonth, currentYear]);
        
        const expenses = result.rows.filter(row => row.transaction_type === 'expense');
        const income = result.rows.filter(row => row.transaction_type === 'income');
        
        res.json({
            expenses,
            income
        });
    } catch (error) {
        console.error('Error al obtener estadísticas por categoría:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas por categoría' });
    }
});

// Obtener evolución mensual (últimos 6 meses)
router.get('/monthly-evolution', async (req, res) => {
    try {
        const result = await db.query(`
            WITH months AS (
                SELECT 
                    EXTRACT(YEAR FROM transaction_date) as year,
                    EXTRACT(MONTH FROM transaction_date) as month,
                    transaction_type,
                    SUM(amount) as total
                FROM transactions 
                WHERE transaction_date >= CURRENT_DATE - INTERVAL '6 months'
                GROUP BY 
                    EXTRACT(YEAR FROM transaction_date),
                    EXTRACT(MONTH FROM transaction_date),
                    transaction_type
            )
            SELECT 
                year,
                month,
                COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN total ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN transaction_type = 'expense' THEN total ELSE 0 END), 0) as expenses
            FROM months
            GROUP BY year, month
            ORDER BY year, month
        `);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener evolución mensual:', error);
        res.status(500).json({ error: 'Error al obtener evolución mensual' });
    }
});

// Obtener próximos vencimientos de deudas
router.get('/upcoming-debts', async (req, res) => {
    const daysAhead = req.query.days || 30;
    
    try {
        const result = await db.query(`
            SELECT 
                id, creditor_name, current_balance, monthly_payment, due_date
            FROM my_debts 
            WHERE 
                is_paid = false 
                AND due_date IS NOT NULL 
                AND due_date <= CURRENT_DATE + INTERVAL '${daysAhead} days'
            ORDER BY due_date ASC
        `);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener próximos vencimientos:', error);
        res.status(500).json({ error: 'Error al obtener próximos vencimientos' });
    }
});

// Obtener alertas y notificaciones
router.get('/alerts', async (req, res) => {
    try {
        const alerts = [];
        
        // Cuentas con saldo bajo
        const lowBalanceAccounts = await db.query(`
            SELECT name, current_balance 
            FROM accounts 
            WHERE is_active = true AND current_balance < 100000
        `);
        
        lowBalanceAccounts.rows.forEach(account => {
            alerts.push({
                type: 'low_balance',
                message: `Cuenta "${account.name}" tiene saldo bajo: $${parseFloat(account.current_balance).toLocaleString()}`,
                severity: 'warning'
            });
        });
        
        // Deudas próximas a vencer
        const upcomingDebts = await db.query(`
            SELECT creditor_name, due_date, current_balance
            FROM my_debts 
            WHERE is_paid = false AND due_date <= CURRENT_DATE + INTERVAL '7 days'
        `);
        
        upcomingDebts.rows.forEach(debt => {
            alerts.push({
                type: 'debt_due',
                message: `Deuda con "${debt.creditor_name}" vence el ${new Date(debt.due_date).toLocaleDateString()}`,
                severity: 'urgent'
            });
        });
        
        // Deudores sin pagos recientes
        const staleDebtors = await db.query(`
            SELECT d.name, 
                   (SELECT MAX(payment_date) FROM debt_payments WHERE debtor_id = d.id) as last_payment
            FROM debtors d
            WHERE (
                SELECT COALESCE(SUM(di.amount), 0) - COALESCE(SUM(dp.amount), 0)
                FROM debt_items di 
                LEFT JOIN debt_payments dp ON dp.debtor_id = d.id
                WHERE di.debtor_id = d.id
            ) > 0
            AND (
                SELECT MAX(payment_date) FROM debt_payments WHERE debtor_id = d.id
            ) < CURRENT_DATE - INTERVAL '30 days'
        `);
        
        staleDebtors.rows.forEach(debtor => {
            alerts.push({
                type: 'stale_debt',
                message: `"${debtor.name}" no ha hecho pagos en más de 30 días`,
                severity: 'info'
            });
        });
        
        res.json(alerts);
    } catch (error) {
        console.error('Error al obtener alertas:', error);
        res.status(500).json({ error: 'Error al obtener alertas' });
    }
});

module.exports = router;
