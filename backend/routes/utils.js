const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Obtener todos los métodos de pago
router.get('/payment-methods', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM payment_methods
      WHERE is_active = TRUE
      ORDER BY name
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener métodos de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener todas las divisas
router.get('/currencies', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM currencies
      WHERE is_active = TRUE
      ORDER BY code
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener divisas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Crear nuevo método de pago
router.post('/payment-methods', async (req, res) => {
  try {
    const { name, description, requires_card } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'El nombre es obligatorio'
      });
    }

    const result = await pool.query(`
      INSERT INTO payment_methods (name, description, requires_card)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [name, description, requires_card || false]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Método de pago creado exitosamente'
    });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({
        success: false,
        message: 'Ya existe un método de pago con ese nombre'
      });
    }
    
    console.error('Error al crear método de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Crear nueva divisa
router.post('/currencies', async (req, res) => {
  try {
    const { code, name, symbol } = req.body;

    if (!code || !name || !symbol) {
      return res.status(400).json({
        success: false,
        message: 'Código, nombre y símbolo son obligatorios'
      });
    }

    if (code.length !== 3) {
      return res.status(400).json({
        success: false,
        message: 'El código de divisa debe tener 3 caracteres'
      });
    }

    const result = await pool.query(`
      INSERT INTO currencies (code, name, symbol)
      VALUES (UPPER($1), $2, $3)
      RETURNING *
    `, [code, name, symbol]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Divisa creada exitosamente'
    });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({
        success: false,
        message: 'Ya existe una divisa con ese código'
      });
    }
    
    console.error('Error al crear divisa:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Actualizar método de pago
router.put('/payment-methods/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, requires_card, is_active } = req.body;

    const result = await pool.query(`
      UPDATE payment_methods 
      SET 
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        requires_card = COALESCE($4, requires_card),
        is_active = COALESCE($5, is_active)
      WHERE id = $1
      RETURNING *
    `, [id, name, description, requires_card, is_active]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Método de pago no encontrado'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Método de pago actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar método de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Actualizar divisa
router.put('/currencies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, symbol, is_active } = req.body;

    const result = await pool.query(`
      UPDATE currencies 
      SET 
        code = COALESCE(UPPER($2), code),
        name = COALESCE($3, name),
        symbol = COALESCE($4, symbol),
        is_active = COALESCE($5, is_active)
      WHERE id = $1
      RETURNING *
    `, [id, code, name, symbol, is_active]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Divisa no encontrada'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Divisa actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar divisa:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener tipos de cambio (placeholder para futura implementación)
router.get('/exchange-rates', async (req, res) => {
  try {
    // En el futuro, aquí podrías integrar con una API de tipos de cambio
    // Por ahora, devolvemos tipos de cambio estáticos
    const exchangeRates = [
      { from: 'USD', to: 'MXN', rate: 18.50 },
      { from: 'MXN', to: 'USD', rate: 0.054 },
      { from: 'EUR', to: 'MXN', rate: 20.20 },
      { from: 'MXN', to: 'EUR', rate: 0.0495 }
    ];

    res.json({
      success: true,
      data: exchangeRates,
      message: 'Tipos de cambio obtenidos (valores de ejemplo)'
    });
  } catch (error) {
    console.error('Error al obtener tipos de cambio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
