const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Obtener todas las transacciones
router.get('/', async (req, res) => {
    const { page = 1, limit = 50, accountId, type, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;
    
    try {
        let query = `
            SELECT t.*, a.name as account_name, c.name as category_name, c.color as category_color
            FROM transactions t
            LEFT JOIN accounts a ON t.account_id = a.id
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE 1=1
        `;
        const queryParams = [];
        
        if (accountId) {
            query += ` AND t.account_id = $${queryParams.length + 1}`;
            queryParams.push(accountId);
        }
        
        if (type) {
            query += ` AND t.transaction_type = $${queryParams.length + 1}`;
            queryParams.push(type);
        }
        
        if (startDate) {
            query += ` AND t.transaction_date >= $${queryParams.length + 1}`;
            queryParams.push(startDate);
        }
        
        if (endDate) {
            query += ` AND t.transaction_date <= $${queryParams.length + 1}`;
            queryParams.push(endDate);
        }
        
        query += ` ORDER BY t.transaction_date DESC, t.created_at DESC`;
        query += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(limit, offset);
        
        const result = await db.query(query, queryParams);
        
        // Obtener total de registros para paginación
        const countQuery = `
            SELECT COUNT(*) as total
            FROM transactions t
            WHERE 1=1
            ${accountId ? ` AND t.account_id = ${accountId}` : ''}
            ${type ? ` AND t.transaction_type = '${type}'` : ''}
            ${startDate ? ` AND t.transaction_date >= '${startDate}'` : ''}
            ${endDate ? ` AND t.transaction_date <= '${endDate}'` : ''}
        `;
        const countResult = await db.query(countQuery);
        
        res.json({
            transactions: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(countResult.rows[0].total),
                pages: Math.ceil(countResult.rows[0].total / limit)
            }
        });
    } catch (error) {
        console.error('Error al obtener transacciones:', error);
        res.status(500).json({ error: 'Error al obtener transacciones' });
    }
});

// Crear nueva transacción
router.post('/', async (req, res) => {
    const { 
        accountId, 
        categoryId, 
        description, 
        amount, 
        transactionType, 
        transactionDate, 
        frequency = 'one-time',
        notes 
    } = req.body;
    
    try {
        const result = await db.query(`
            INSERT INTO transactions (
                account_id, category_id, description, amount, 
                transaction_type, transaction_date, frequency, notes
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING *
        `, [accountId, categoryId, description, amount, transactionType, transactionDate, frequency, notes]);
        
        // Obtener la transacción con información adicional
        const fullTransaction = await db.query(`
            SELECT t.*, a.name as account_name, c.name as category_name, c.color as category_color
            FROM transactions t
            LEFT JOIN accounts a ON t.account_id = a.id
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.id = $1
        `, [result.rows[0].id]);
        
        res.status(201).json(fullTransaction.rows[0]);
    } catch (error) {
        console.error('Error al crear transacción:', error);
        res.status(500).json({ error: 'Error al crear transacción' });
    }
});

// Actualizar transacción
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { 
        accountId, 
        categoryId, 
        description, 
        amount, 
        transactionType, 
        transactionDate, 
        frequency,
        notes 
    } = req.body;
    
    try {
        const result = await db.query(`
            UPDATE transactions 
            SET 
                account_id = $1, 
                category_id = $2, 
                description = $3, 
                amount = $4,
                transaction_type = $5, 
                transaction_date = $6, 
                frequency = $7,
                notes = $8,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $9
            RETURNING *
        `, [accountId, categoryId, description, amount, transactionType, transactionDate, frequency, notes, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Transacción no encontrada' });
        }
        
        // Obtener la transacción actualizada con información adicional
        const fullTransaction = await db.query(`
            SELECT t.*, a.name as account_name, c.name as category_name, c.color as category_color
            FROM transactions t
            LEFT JOIN accounts a ON t.account_id = a.id
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.id = $1
        `, [id]);
        
        res.json(fullTransaction.rows[0]);
    } catch (error) {
        console.error('Error al actualizar transacción:', error);
        res.status(500).json({ error: 'Error al actualizar transacción' });
    }
});

// Eliminar transacción
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const result = await db.query('DELETE FROM transactions WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Transacción no encontrada' });
        }
        
        res.json({ message: 'Transacción eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar transacción:', error);
        res.status(500).json({ error: 'Error al eliminar transacción' });
    }
});

// Obtener categorías
router.get('/categories', async (req, res) => {
    const { type } = req.query;
    
    try {
        let query = 'SELECT * FROM categories';
        const queryParams = [];
        
        if (type) {
            query += ' WHERE type = $1';
            queryParams.push(type);
        }
        
        query += ' ORDER BY name';
        
        const result = await db.query(query, queryParams);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({ error: 'Error al obtener categorías' });
    }
});

// Obtener resumen mensual
router.get('/monthly-summary', async (req, res) => {
    const { year, month } = req.query;
    const currentYear = year || new Date().getFullYear();
    const currentMonth = month || new Date().getMonth() + 1;
    
    try {
        const result = await db.query(`
            SELECT 
                transaction_type,
                SUM(amount) as total,
                COUNT(*) as count
            FROM transactions 
            WHERE 
                EXTRACT(YEAR FROM transaction_date) = $1 
                AND EXTRACT(MONTH FROM transaction_date) = $2
            GROUP BY transaction_type
        `, [currentYear, currentMonth]);
        
        const summary = {
            income: { total: 0, count: 0 },
            expense: { total: 0, count: 0 }
        };
        
        result.rows.forEach(row => {
            summary[row.transaction_type] = {
                total: parseFloat(row.total),
                count: parseInt(row.count)
            };
        });
        
        res.json(summary);
    } catch (error) {
        console.error('Error al obtener resumen mensual:', error);
        res.status(500).json({ error: 'Error al obtener resumen mensual' });
    }
});

// ========== RUTAS DE GESTIÓN DE CATEGORÍAS ==========

// Crear nueva categoría
router.post('/categories', async (req, res) => {
    const { name, type, color } = req.body;
    
    try {
        if (!name || !type) {
            return res.status(400).json({ error: 'Nombre y tipo son requeridos' });
        }

        if (!['income', 'expense'].includes(type)) {
            return res.status(400).json({ error: 'Tipo debe ser income o expense' });
        }

        const result = await db.query(`
            INSERT INTO categories (name, type, color) 
            VALUES ($1, $2, $3) 
            RETURNING *
        `, [name, type, color || '#6B7280']);
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al crear categoría:', error);
        if (error.code === '23505') { // Unique violation
            res.status(409).json({ error: 'Ya existe una categoría con ese nombre' });
        } else {
            res.status(500).json({ error: 'Error al crear categoría' });
        }
    }
});

// Actualizar categoría
router.put('/categories/:id', async (req, res) => {
    const { id } = req.params;
    const { name, type, color } = req.body;
    
    try {
        if (!name || !type) {
            return res.status(400).json({ error: 'Nombre y tipo son requeridos' });
        }

        if (!['income', 'expense'].includes(type)) {
            return res.status(400).json({ error: 'Tipo debe ser income o expense' });
        }

        const result = await db.query(`
            UPDATE categories 
            SET name = $1, type = $2, color = $3
            WHERE id = $4 
            RETURNING *
        `, [name, type, color || '#6B7280', id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al actualizar categoría:', error);
        if (error.code === '23505') { // Unique violation
            res.status(409).json({ error: 'Ya existe una categoría con ese nombre' });
        } else {
            res.status(500).json({ error: 'Error al actualizar categoría' });
        }
    }
});

// Eliminar categoría
router.delete('/categories/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        // Verificar si hay transacciones usando esta categoría
        const transactionsCheck = await db.query(
            'SELECT COUNT(*) as count FROM transactions WHERE category_id = $1',
            [id]
        );
        
        if (parseInt(transactionsCheck.rows[0].count) > 0) {
            return res.status(400).json({ 
                error: 'No se puede eliminar la categoría porque tiene transacciones asociadas' 
            });
        }

        const result = await db.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }
        
        res.json({ message: 'Categoría eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar categoría:', error);
        res.status(500).json({ error: 'Error al eliminar categoría' });
    }
});

module.exports = router;
