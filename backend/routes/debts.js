const express = require('express');
const router = express.Router();
const db = require('../config/database');

// ========== DEUDAS POR COBRAR (Me deben) ==========

// Obtener todos los deudores con sus deudas
router.get('/debtors', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                d.*,
                COALESCE(items.total_items, 0) as total_debt,
                COALESCE(payments.total_payments, 0) as total_paid,
                COALESCE(items.total_items, 0) - COALESCE(payments.total_payments, 0) as balance
            FROM debtors d
            LEFT JOIN (
                SELECT debtor_id, SUM(amount) as total_items
                FROM debt_items 
                GROUP BY debtor_id
            ) items ON d.id = items.debtor_id
            LEFT JOIN (
                SELECT debtor_id, SUM(amount) as total_payments
                FROM debt_payments 
                GROUP BY debtor_id
            ) payments ON d.id = payments.debtor_id
            ORDER BY d.created_at DESC
        `);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener deudores:', error);
        res.status(500).json({ error: 'Error al obtener deudores' });
    }
});

// Crear nuevo deudor
router.post('/debtors', async (req, res) => {
    const { name, phone, email, notes } = req.body;
    
    try {
        const result = await db.query(`
            INSERT INTO debtors (name, phone, email, notes) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *
        `, [name, phone, email, notes]);
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al crear deudor:', error);
        res.status(500).json({ error: 'Error al crear deudor' });
    }
});

// Obtener detalles de un deudor específico
router.get('/debtors/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        // Obtener información del deudor
        const debtorResult = await db.query('SELECT * FROM debtors WHERE id = $1', [id]);
        
        if (debtorResult.rows.length === 0) {
            return res.status(404).json({ error: 'Deudor no encontrado' });
        }
        
        // Obtener artículos de deuda
        const itemsResult = await db.query(`
            SELECT * FROM debt_items 
            WHERE debtor_id = $1 
            ORDER BY item_date DESC
        `, [id]);
        
        // Obtener pagos realizados
        const paymentsResult = await db.query(`
            SELECT dp.*, a.name as account_name 
            FROM debt_payments dp
            LEFT JOIN accounts a ON dp.account_id = a.id
            WHERE dp.debtor_id = $1 
            ORDER BY dp.payment_date DESC
        `, [id]);
        
        const debtor = debtorResult.rows[0];
        debtor.items = itemsResult.rows;
        debtor.payments = paymentsResult.rows;
        
        // Calcular totales
        const totalDebt = itemsResult.rows.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const totalPaid = paymentsResult.rows.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
        debtor.total_debt = totalDebt;
        debtor.total_paid = totalPaid;
        debtor.balance = totalDebt - totalPaid;
        
        res.json(debtor);
    } catch (error) {
        console.error('Error al obtener detalles del deudor:', error);
        res.status(500).json({ error: 'Error al obtener detalles del deudor' });
    }
});

// Agregar artículo de deuda
router.post('/debtors/:id/items', async (req, res) => {
    const { id } = req.params;
    const { description, amount, itemDate, notes } = req.body;
    
    try {
        const result = await db.query(`
            INSERT INTO debt_items (debtor_id, description, amount, item_date, notes) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING *
        `, [id, description, amount, itemDate, notes]);
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al agregar artículo de deuda:', error);
        res.status(500).json({ error: 'Error al agregar artículo de deuda' });
    }
});

// Registrar pago de deuda
router.post('/debtors/:id/payments', async (req, res) => {
    const { id } = req.params;
    const { accountId, amount, paymentDate, paymentMethod, notes } = req.body;
    
    try {
        const result = await db.query(`
            INSERT INTO debt_payments (debtor_id, account_id, amount, payment_date, payment_method, notes) 
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING *
        `, [id, accountId, amount, paymentDate, paymentMethod, notes]);
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al registrar pago de deuda:', error);
        res.status(500).json({ error: 'Error al registrar pago de deuda' });
    }
});

// Eliminar deudor
router.delete('/debtors/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        // Verificar que no tenga balance pendiente
        const balanceCheck = await db.query(`
            SELECT 
                COALESCE(items.total_items, 0) - COALESCE(payments.total_payments, 0) as balance
            FROM debtors d
            LEFT JOIN (SELECT debtor_id, SUM(amount) as total_items FROM debt_items GROUP BY debtor_id) items ON d.id = items.debtor_id
            LEFT JOIN (SELECT debtor_id, SUM(amount) as total_payments FROM debt_payments GROUP BY debtor_id) payments ON d.id = payments.debtor_id
            WHERE d.id = $1
        `, [id]);
        
        if (balanceCheck.rows.length > 0 && parseFloat(balanceCheck.rows[0].balance) > 0) {
            return res.status(400).json({ 
                error: 'No se puede eliminar un deudor con balance pendiente' 
            });
        }
        
        const result = await db.query('DELETE FROM debtors WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Deudor no encontrado' });
        }
        
        res.json({ message: 'Deudor eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar deudor:', error);
        res.status(500).json({ error: 'Error al eliminar deudor' });
    }
});

// ========== MIS DEUDAS (Debo) ==========

// Obtener todas mis deudas
router.get('/my-debts', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT * FROM my_debts 
            WHERE is_paid = false 
            ORDER BY due_date ASC, created_at DESC
        `);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener mis deudas:', error);
        res.status(500).json({ error: 'Error al obtener mis deudas' });
    }
});

// Crear nueva deuda propia
router.post('/my-debts', async (req, res) => {
    const { 
        creditorName, 
        originalAmount, 
        monthlyPayment, 
        interestRate, 
        dueDate, 
        notes 
    } = req.body;
    
    try {
        const result = await db.query(`
            INSERT INTO my_debts (
                creditor_name, original_amount, current_balance, 
                monthly_payment, interest_rate, due_date, notes
            ) 
            VALUES ($1, $2, $2, $3, $4, $5, $6) 
            RETURNING *
        `, [creditorName, originalAmount, monthlyPayment, interestRate, dueDate, notes]);
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al crear deuda:', error);
        res.status(500).json({ error: 'Error al crear deuda' });
    }
});

// Actualizar deuda (hacer pago)
router.put('/my-debts/:id/payment', async (req, res) => {
    const { id } = req.params;
    const { paymentAmount, accountId } = req.body;
    
    try {
        // Obtener deuda actual
        const debtResult = await db.query('SELECT * FROM my_debts WHERE id = $1', [id]);
        
        if (debtResult.rows.length === 0) {
            return res.status(404).json({ error: 'Deuda no encontrada' });
        }
        
        const debt = debtResult.rows[0];
        const newBalance = parseFloat(debt.current_balance) - parseFloat(paymentAmount);
        const isPaid = newBalance <= 0;
        
        // Actualizar deuda
        const updateResult = await db.query(`
            UPDATE my_debts 
            SET 
                current_balance = $1, 
                is_paid = $2, 
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3 
            RETURNING *
        `, [Math.max(0, newBalance), isPaid, id]);
        
        // Registrar transacción de pago
        if (accountId) {
            await db.query(`
                INSERT INTO transactions (
                    account_id, description, amount, transaction_type, 
                    transaction_date, notes
                ) 
                VALUES ($1, $2, $3, 'expense', CURRENT_DATE, $4)
            `, [
                accountId, 
                `Pago deuda: ${debt.creditor_name}`, 
                paymentAmount,
                `Pago de deuda a ${debt.creditor_name}`
            ]);
        }
        
        res.json(updateResult.rows[0]);
    } catch (error) {
        console.error('Error al procesar pago de deuda:', error);
        res.status(500).json({ error: 'Error al procesar pago de deuda' });
    }
});

// Eliminar mi deuda
router.delete('/my-debts/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const result = await db.query('DELETE FROM my_debts WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Deuda no encontrada' });
        }
        
        res.json({ message: 'Deuda eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar deuda:', error);
        res.status(500).json({ error: 'Error al eliminar deuda' });
    }
});

module.exports = router;
