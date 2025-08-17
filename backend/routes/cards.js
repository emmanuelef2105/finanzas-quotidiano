const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Obtener todas las tarjetas del usuario
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.*,
        a.name as account_name,
        a.account_type
      FROM cards c
      JOIN accounts a ON c.account_id = a.id
      WHERE c.user_id = 1 AND c.is_active = TRUE
      ORDER BY c.card_name
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener tarjetas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener tarjetas por cuenta
router.get('/by-account/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    
    const result = await pool.query(`
      SELECT *
      FROM cards
      WHERE account_id = $1 AND user_id = 1 AND is_active = TRUE
      ORDER BY card_name
    `, [accountId]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener tarjetas por cuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Crear nueva tarjeta
router.post('/', async (req, res) => {
  try {
    const {
      account_id,
      card_name,
      card_type,
      last_four_digits,
      brand,
      credit_limit,
      notes
    } = req.body;

    // Validaciones básicas
    if (!account_id || !card_name || !card_type) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios'
      });
    }

    if (!['credit', 'debit'].includes(card_type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de tarjeta inválido'
      });
    }

    const result = await pool.query(`
      INSERT INTO cards (
        user_id, account_id, card_name, card_type, 
        last_four_digits, brand, credit_limit, notes
      )
      VALUES (1, $1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [account_id, card_name, card_type, last_four_digits, brand, credit_limit, notes]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Tarjeta creada exitosamente'
    });
  } catch (error) {
    console.error('Error al crear tarjeta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Actualizar tarjeta
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      card_name,
      card_type,
      last_four_digits,
      brand,
      credit_limit,
      notes,
      is_active
    } = req.body;

    const result = await pool.query(`
      UPDATE cards 
      SET 
        card_name = COALESCE($2, card_name),
        card_type = COALESCE($3, card_type),
        last_four_digits = COALESCE($4, last_four_digits),
        brand = COALESCE($5, brand),
        credit_limit = COALESCE($6, credit_limit),
        notes = COALESCE($7, notes),
        is_active = COALESCE($8, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = 1
      RETURNING *
    `, [id, card_name, card_type, last_four_digits, brand, credit_limit, notes, is_active]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tarjeta no encontrada'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Tarjeta actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar tarjeta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Eliminar tarjeta (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si la tarjeta tiene transacciones asociadas
    const transactionsCheck = await pool.query(`
      SELECT COUNT(*) as count
      FROM transactions
      WHERE card_id = $1
    `, [id]);

    if (parseInt(transactionsCheck.rows[0].count) > 0) {
      // Si tiene transacciones, hacer soft delete
      await pool.query(`
        UPDATE cards 
        SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND user_id = 1
      `, [id]);
      
      return res.json({
        success: true,
        message: 'Tarjeta desactivada exitosamente'
      });
    } else {
      // Si no tiene transacciones, eliminar completamente
      const result = await pool.query(`
        DELETE FROM cards
        WHERE id = $1 AND user_id = 1
        RETURNING *
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Tarjeta no encontrada'
        });
      }

      res.json({
        success: true,
        message: 'Tarjeta eliminada exitosamente'
      });
    }
  } catch (error) {
    console.error('Error al eliminar tarjeta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener resumen de tarjeta con transacciones
router.get('/:id/summary', async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener información de la tarjeta
    const cardResult = await pool.query(`
      SELECT 
        c.*,
        a.name as account_name,
        a.account_type
      FROM cards c
      JOIN accounts a ON c.account_id = a.id
      WHERE c.id = $1 AND c.user_id = 1
    `, [id]);

    if (cardResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tarjeta no encontrada'
      });
    }

    const card = cardResult.rows[0];

    // Obtener resumen de transacciones
    const summaryResult = await pool.query(`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as total_expenses,
        SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END) as total_income,
        AVG(CASE WHEN transaction_type = 'expense' THEN amount ELSE NULL END) as avg_expense
      FROM transactions
      WHERE card_id = $1
    `, [id]);

    // Obtener transacciones recientes
    const recentTransactions = await pool.query(`
      SELECT 
        t.*,
        c.name as category_name,
        c.color as category_color
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.card_id = $1
      ORDER BY t.transaction_date DESC, t.created_at DESC
      LIMIT 10
    `, [id]);

    res.json({
      success: true,
      data: {
        card,
        summary: summaryResult.rows[0],
        recent_transactions: recentTransactions.rows
      }
    });
  } catch (error) {
    console.error('Error al obtener resumen de tarjeta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
