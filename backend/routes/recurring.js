const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Obtener todas las series recurrentes
router.get('/series', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT rs.*, a.name as account_name, c.name as category_name, c.color as category_color,
                   COUNT(t.id) as generated_transactions_count
            FROM recurring_series rs
            LEFT JOIN accounts a ON rs.account_id = a.id
            LEFT JOIN categories c ON rs.category_id = c.id
            LEFT JOIN transactions t ON t.recurring_series_id = rs.id
            WHERE rs.is_active = TRUE
            GROUP BY rs.id, a.name, c.name, c.color
            ORDER BY rs.next_generation_date ASC
        `);
        
        res.json({ data: result.rows });
    } catch (error) {
        console.error('Error al obtener series recurrentes:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Crear nueva serie recurrente
router.post('/series', async (req, res) => {
    const {
        accountId,
        categoryId,
        description,
        amount,
        transactionType,
        recurrenceType,
        frequencyType,
        frequencyInterval = 1,
        startDate,
        endDate,
        customLogic,
        useCustomLogic = false,
        skipWeekends = false,
        skipHolidays = false,
        notes
    } = req.body;

    try {
        // Validar datos requeridos
        if (!accountId || !description || !amount || !transactionType || !startDate) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        // Calcular próxima fecha de generación
        let nextGenerationDate = new Date(startDate);
        
        const result = await db.query(`
            INSERT INTO recurring_series (
                user_id, account_id, category_id, description, amount, transaction_type,
                recurrence_type, frequency_type, frequency_interval,
                start_date, end_date, next_generation_date,
                custom_logic, use_custom_logic, skip_weekends, skip_holidays, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            RETURNING *
        `, [
            1, // user_id temporal
            accountId,
            categoryId || null,
            description,
            amount,
            transactionType,
            recurrenceType,
            frequencyType,
            frequencyInterval,
            startDate,
            endDate || null,
            nextGenerationDate.toISOString().split('T')[0],
            customLogic || null,
            useCustomLogic,
            skipWeekends,
            skipHolidays,
            notes || null
        ]);

        res.status(201).json({ data: result.rows[0] });
    } catch (error) {
        console.error('Error al crear serie recurrente:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Actualizar serie recurrente
router.put('/series/:id', async (req, res) => {
    const { id } = req.params;
    const updateType = req.body.updateType || 'series'; // 'series', 'future', 'all'
    
    try {
        if (updateType === 'series') {
            // Solo actualizar la serie, no las transacciones generadas
            const {
                accountId,
                categoryId,
                description,
                amount,
                transactionType,
                recurrenceType,
                frequencyType,
                frequencyInterval,
                endDate,
                customLogic,
                useCustomLogic,
                skipWeekends,
                skipHolidays,
                notes
            } = req.body;

            const result = await db.query(`
                UPDATE recurring_series 
                SET account_id = $1, category_id = $2, description = $3, amount = $4,
                    transaction_type = $5, recurrence_type = $6, frequency_type = $7,
                    frequency_interval = $8, end_date = $9, custom_logic = $10,
                    use_custom_logic = $11, skip_weekends = $12, skip_holidays = $13,
                    notes = $14, updated_at = CURRENT_TIMESTAMP
                WHERE id = $15
                RETURNING *
            `, [
                accountId, categoryId, description, amount, transactionType,
                recurrenceType, frequencyType, frequencyInterval, endDate,
                customLogic, useCustomLogic, skipWeekends, skipHolidays,
                notes, id
            ]);

            res.json({ data: result.rows[0] });
        } else if (updateType === 'future') {
            // Actualizar serie y transacciones futuras (>=hoy)
            await db.query('BEGIN');
            
            try {
                // Actualizar la serie
                await db.query(`
                    UPDATE recurring_series 
                    SET amount = $1, description = $2, notes = $3, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $4
                `, [req.body.amount, req.body.description, req.body.notes, id]);
                
                // Actualizar transacciones futuras no procesadas
                await db.query(`
                    UPDATE transactions 
                    SET amount = $1, description = $2, notes = $3, updated_at = CURRENT_TIMESTAMP
                    WHERE recurring_series_id = $4 
                    AND transaction_date >= CURRENT_DATE
                    AND is_generated = TRUE
                `, [req.body.amount, req.body.description, req.body.notes, id]);
                
                await db.query('COMMIT');
                res.json({ message: 'Serie y transacciones futuras actualizadas' });
            } catch (error) {
                await db.query('ROLLBACK');
                throw error;
            }
        } else if (updateType === 'all') {
            // Actualizar serie y todas las transacciones generadas
            await db.query('BEGIN');
            
            try {
                await db.query(`
                    UPDATE recurring_series 
                    SET amount = $1, description = $2, notes = $3, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $4
                `, [req.body.amount, req.body.description, req.body.notes, id]);
                
                await db.query(`
                    UPDATE transactions 
                    SET amount = $1, description = $2, notes = $3, updated_at = CURRENT_TIMESTAMP
                    WHERE recurring_series_id = $4 AND is_generated = TRUE
                `, [req.body.amount, req.body.description, req.body.notes, id]);
                
                await db.query('COMMIT');
                res.json({ message: 'Serie y todas las transacciones actualizadas' });
            } catch (error) {
                await db.query('ROLLBACK');
                throw error;
            }
        }
    } catch (error) {
        console.error('Error al actualizar serie recurrente:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Pausar/reactivar serie recurrente
router.patch('/series/:id/toggle', async (req, res) => {
    const { id } = req.params;
    
    try {
        const result = await db.query(`
            UPDATE recurring_series 
            SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Serie no encontrada' });
        }

        res.json({ 
            data: result.rows[0],
            message: result.rows[0].is_active ? 'Serie reactivada' : 'Serie pausada'
        });
    } catch (error) {
        console.error('Error al cambiar estado de serie:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Generar transacciones pendientes manualmente
router.post('/series/generate', async (req, res) => {
    try {
        const result = await db.query('SELECT generate_recurring_transactions()');
        const generatedCount = result.rows[0].generate_recurring_transactions;
        
        res.json({ 
            message: `Se generaron ${generatedCount} transacciones`,
            count: generatedCount
        });
    } catch (error) {
        console.error('Error al generar transacciones:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Obtener transacciones de una serie específica
router.get('/series/:id/transactions', async (req, res) => {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    try {
        const result = await db.query(`
            SELECT t.*, a.name as account_name, c.name as category_name
            FROM transactions t
            LEFT JOIN accounts a ON t.account_id = a.id
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.recurring_series_id = $1
            ORDER BY t.transaction_date DESC
            LIMIT $2 OFFSET $3
        `, [id, limit, offset]);
        
        res.json({ data: result.rows });
    } catch (error) {
        console.error('Error al obtener transacciones de serie:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Validar lógica personalizada
router.post('/validate-logic', async (req, res) => {
    const { customLogic } = req.body;
    
    try {
        // Validación básica de la lógica personalizada
        if (customLogic && customLogic.length > 0) {
            // Verificar que no contenga código peligroso
            const dangerousPatterns = [
                /require\s*\(/,
                /import\s+/,
                /process\./,
                /global\./,
                /console\./,
                /eval\s*\(/,
                /Function\s*\(/,
                /setTimeout|setInterval/
            ];
            
            const isDangerous = dangerousPatterns.some(pattern => pattern.test(customLogic));
            
            if (isDangerous) {
                return res.json({ 
                    valid: false, 
                    message: 'El código contiene instrucciones no permitidas por seguridad' 
                });
            }
            
            // Verificar sintaxis básica sin ejecutar
            const codeLines = customLogic.split('\n');
            const hasReturn = codeLines.some(line => line.trim().startsWith('return'));
            
            if (!hasReturn) {
                return res.json({ 
                    valid: false, 
                    message: 'El código debe incluir una declaración return con la fecha calculada' 
                });
            }
            
            res.json({ valid: true, message: 'Código válido' });
        } else {
            res.json({ valid: true, message: 'Sin lógica personalizada' });
        }
    } catch (error) {
        console.error('Error al validar lógica:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

module.exports = router;
