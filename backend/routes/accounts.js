const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Obtener todas las cuentas
router.get('/', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT id, name, initial_balance, current_balance, account_type, is_active, created_at
            FROM accounts 
            WHERE is_active = true 
            ORDER BY created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener cuentas:', error);
        res.status(500).json({ error: 'Error al obtener cuentas' });
    }
});

// Crear nueva cuenta
router.post('/', async (req, res) => {
    const { name, initialBalance, accountType = 'checking' } = req.body;
    
    try {
        const result = await db.query(`
            INSERT INTO accounts (name, initial_balance, current_balance, account_type) 
            VALUES ($1, $2, $2, $3) 
            RETURNING *
        `, [name, initialBalance || 0, accountType]);
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al crear cuenta:', error);
        res.status(500).json({ error: 'Error al crear cuenta' });
    }
});

// Actualizar cuenta
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, accountType } = req.body;
    
    try {
        const result = await db.query(`
            UPDATE accounts 
            SET name = $1, account_type = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3 AND is_active = true
            RETURNING *
        `, [name, accountType, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cuenta no encontrada' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al actualizar cuenta:', error);
        res.status(500).json({ error: 'Error al actualizar cuenta' });
    }
});

// Eliminar cuenta (soft delete)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        // Verificar si hay transacciones asociadas
        const transactionCheck = await db.query(
            'SELECT COUNT(*) as count FROM transactions WHERE account_id = $1',
            [id]
        );
        
        if (parseInt(transactionCheck.rows[0].count) > 0) {
            return res.status(400).json({ 
                error: 'No se puede eliminar la cuenta porque tiene transacciones asociadas' 
            });
        }
        
        const result = await db.query(`
            UPDATE accounts 
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 
            RETURNING *
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cuenta no encontrada' });
        }
        
        res.json({ message: 'Cuenta eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar cuenta:', error);
        res.status(500).json({ error: 'Error al eliminar cuenta' });
    }
});

// Obtener balance de una cuenta específica
router.get('/:id/balance', async (req, res) => {
    const { id } = req.params;
    
    try {
        const result = await db.query(`
            SELECT current_balance, initial_balance, name
            FROM accounts 
            WHERE id = $1 AND is_active = true
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cuenta no encontrada' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener balance:', error);
        res.status(500).json({ error: 'Error al obtener balance' });
    }
});

module.exports = router;
