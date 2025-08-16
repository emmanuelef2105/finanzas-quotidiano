const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Obtener todas las inversiones
router.get('/', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT i.*, a.name as account_name
            FROM investments i
            LEFT JOIN accounts a ON i.account_id = a.id
            WHERE i.is_active = true
            ORDER BY i.created_at DESC
        `);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener inversiones:', error);
        res.status(500).json({ error: 'Error al obtener inversiones' });
    }
});

// Crear nueva inversión
router.post('/', async (req, res) => {
    const { 
        accountId, 
        name, 
        amount, 
        expectedYield, 
        investmentType, 
        startDate, 
        maturityDate, 
        notes 
    } = req.body;
    
    try {
        const result = await db.query(`
            INSERT INTO investments (
                account_id, name, amount, expected_yield, 
                investment_type, start_date, maturity_date, notes
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING *
        `, [accountId, name, amount, expectedYield, investmentType, startDate, maturityDate, notes]);
        
        // Registrar transacción de inversión (salida de dinero)
        await db.query(`
            INSERT INTO transactions (
                account_id, description, amount, transaction_type, 
                transaction_date, notes
            ) 
            VALUES ($1, $2, $3, 'expense', $4, $5)
        `, [
            accountId, 
            `Inversión: ${name}`, 
            amount,
            startDate,
            `Inversión en ${name}`
        ]);
        
        // Obtener la inversión con información de la cuenta
        const fullInvestment = await db.query(`
            SELECT i.*, a.name as account_name
            FROM investments i
            LEFT JOIN accounts a ON i.account_id = a.id
            WHERE i.id = $1
        `, [result.rows[0].id]);
        
        res.status(201).json(fullInvestment.rows[0]);
    } catch (error) {
        console.error('Error al crear inversión:', error);
        res.status(500).json({ error: 'Error al crear inversión' });
    }
});

// Actualizar inversión
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { 
        name, 
        amount, 
        expectedYield, 
        investmentType, 
        startDate, 
        maturityDate, 
        notes 
    } = req.body;
    
    try {
        const result = await db.query(`
            UPDATE investments 
            SET 
                name = $1, 
                amount = $2, 
                expected_yield = $3, 
                investment_type = $4,
                start_date = $5, 
                maturity_date = $6, 
                notes = $7,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $8 AND is_active = true
            RETURNING *
        `, [name, amount, expectedYield, investmentType, startDate, maturityDate, notes, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Inversión no encontrada' });
        }
        
        // Obtener la inversión actualizada con información de la cuenta
        const fullInvestment = await db.query(`
            SELECT i.*, a.name as account_name
            FROM investments i
            LEFT JOIN accounts a ON i.account_id = a.id
            WHERE i.id = $1
        `, [id]);
        
        res.json(fullInvestment.rows[0]);
    } catch (error) {
        console.error('Error al actualizar inversión:', error);
        res.status(500).json({ error: 'Error al actualizar inversión' });
    }
});

// Liquidar inversión (marcar como inactiva y registrar retorno)
router.put('/:id/liquidate', async (req, res) => {
    const { id } = req.params;
    const { returnAmount, liquidationDate, accountId } = req.body;
    
    try {
        // Obtener información de la inversión
        const investmentResult = await db.query(
            'SELECT * FROM investments WHERE id = $1 AND is_active = true', 
            [id]
        );
        
        if (investmentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Inversión no encontrada' });
        }
        
        const investment = investmentResult.rows[0];
        const targetAccountId = accountId || investment.account_id;
        
        // Marcar inversión como liquidada
        const updateResult = await db.query(`
            UPDATE investments 
            SET 
                is_active = false, 
                updated_at = CURRENT_TIMESTAMP,
                notes = COALESCE(notes, '') || ' - Liquidada el ' || $1
            WHERE id = $2 
            RETURNING *
        `, [liquidationDate, id]);
        
        // Registrar transacción de retorno de inversión
        await db.query(`
            INSERT INTO transactions (
                account_id, description, amount, transaction_type, 
                transaction_date, notes
            ) 
            VALUES ($1, $2, $3, 'income', $4, $5)
        `, [
            targetAccountId, 
            `Liquidación inversión: ${investment.name}`, 
            returnAmount,
            liquidationDate,
            `Liquidación de inversión ${investment.name}. Ganancia/Pérdida: $${returnAmount - investment.amount}`
        ]);
        
        res.json({
            ...updateResult.rows[0],
            return_amount: returnAmount,
            profit_loss: returnAmount - investment.amount
        });
    } catch (error) {
        console.error('Error al liquidar inversión:', error);
        res.status(500).json({ error: 'Error al liquidar inversión' });
    }
});

// Eliminar inversión (soft delete)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const result = await db.query(`
            UPDATE investments 
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 
            RETURNING *
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Inversión no encontrada' });
        }
        
        res.json({ message: 'Inversión eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar inversión:', error);
        res.status(500).json({ error: 'Error al eliminar inversión' });
    }
});

// Obtener resumen de inversiones
router.get('/summary', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                COUNT(*) as total_investments,
                SUM(CASE WHEN is_active = true THEN amount ELSE 0 END) as active_amount,
                SUM(CASE WHEN is_active = false THEN amount ELSE 0 END) as liquidated_amount,
                AVG(CASE WHEN is_active = true THEN expected_yield ELSE NULL END) as avg_yield
            FROM investments
        `);
        
        const typeDistribution = await db.query(`
            SELECT 
                investment_type,
                COUNT(*) as count,
                SUM(amount) as total_amount
            FROM investments 
            WHERE is_active = true
            GROUP BY investment_type
            ORDER BY total_amount DESC
        `);
        
        res.json({
            summary: result.rows[0],
            type_distribution: typeDistribution.rows
        });
    } catch (error) {
        console.error('Error al obtener resumen de inversiones:', error);
        res.status(500).json({ error: 'Error al obtener resumen de inversiones' });
    }
});

module.exports = router;
