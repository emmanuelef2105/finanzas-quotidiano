const express = require('express');
const router = express.Router();
const AccountsService = require('../services/AccountsService');

// Obtener todas las cuentas
router.get('/', async (req, res) => {
    try {
        const accounts = await AccountsService.getAllAccounts();
        res.json(accounts);
    } catch (error) {
        console.error('Error al obtener cuentas:', error);
        res.status(500).json({ error: error.message });
    }
});

// Crear nueva cuenta
router.post('/', async (req, res) => {
    try {
        const account = await AccountsService.createAccount(req.body);
        res.status(201).json(account);
    } catch (error) {
        console.error('Error al crear cuenta:', error);
        res.status(500).json({ error: error.message });
    }
});

// Actualizar cuenta
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const account = await AccountsService.updateAccount(id, req.body);
        res.json(account);
    } catch (error) {
        console.error('Error al actualizar cuenta:', error);
        
        if (error.message.includes('no encontrada')) {
            return res.status(404).json({ error: error.message });
        }
        
        res.status(500).json({ error: error.message });
    }
});

// Eliminar cuenta (soft delete)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const result = await AccountsService.deleteAccount(id);
        res.json(result);
    } catch (error) {
        console.error('Error al eliminar cuenta:', error);
        
        if (error.message.includes('no encontrada')) {
            return res.status(404).json({ error: error.message });
        }
        
        if (error.message.includes('transacciones asociadas')) {
            return res.status(400).json({ error: error.message });
        }
        
        res.status(500).json({ error: error.message });
    }
});

// Obtener balance de una cuenta específica
router.get('/:id/balance', async (req, res) => {
    const { id } = req.params;
    
    try {
        const balance = await AccountsService.getAccountBalance(id);
        res.json(balance);
    } catch (error) {
        console.error('Error al obtener balance:', error);
        
        if (error.message.includes('no encontrada')) {
            return res.status(404).json({ error: error.message });
        }
        
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
