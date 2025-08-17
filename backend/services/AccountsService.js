/**
 * Servicio para la gestión de cuentas
 * Encapsula la lógica de negocio y las consultas a la base de datos
 */

const db = require('../config/database');
const queries = require('../queries');

class AccountsService {
    
    /**
     * Obtener todas las cuentas activas
     */
    async getAllAccounts() {
        try {
            const result = await db.query(queries.accounts.GET_ALL_ACTIVE);
            return result.rows;
        } catch (error) {
            throw new Error(`Error al obtener cuentas: ${error.message}`);
        }
    }

    /**
     * Obtener cuenta por ID
     */
    async getAccountById(accountId) {
        try {
            const result = await db.query(queries.accounts.GET_BY_ID, [accountId]);
            return result.rows[0] || null;
        } catch (error) {
            throw new Error(`Error al obtener cuenta: ${error.message}`);
        }
    }

    /**
     * Crear nueva cuenta
     */
    async createAccount(accountData) {
        const { name, initialBalance = 0, accountType = 'checking' } = accountData;
        
        try {
            const result = await db.query(
                queries.accounts.CREATE_ACCOUNT, 
                [name, initialBalance, accountType]
            );
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error al crear cuenta: ${error.message}`);
        }
    }

    /**
     * Actualizar cuenta
     */
    async updateAccount(accountId, accountData) {
        const { name, accountType } = accountData;
        
        try {
            const result = await db.query(
                queries.accounts.UPDATE_ACCOUNT,
                [name, accountType, accountId]
            );
            
            if (result.rows.length === 0) {
                throw new Error('Cuenta no encontrada');
            }
            
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error al actualizar cuenta: ${error.message}`);
        }
    }

    /**
     * Eliminar cuenta (soft delete)
     */
    async deleteAccount(accountId) {
        try {
            // Verificar si hay transacciones asociadas
            const hasTransactions = await this.checkAccountHasTransactions(accountId);
            
            if (hasTransactions) {
                throw new Error('No se puede eliminar la cuenta porque tiene transacciones asociadas');
            }
            
            const result = await db.query(
                queries.accounts.SOFT_DELETE_ACCOUNT,
                [accountId]
            );
            
            if (result.rows.length === 0) {
                throw new Error('Cuenta no encontrada');
            }
            
            return { success: true, message: 'Cuenta eliminada exitosamente' };
        } catch (error) {
            throw new Error(`Error al eliminar cuenta: ${error.message}`);
        }
    }

    /**
     * Actualizar balance de cuenta
     */
    async updateAccountBalance(accountId, newBalance) {
        try {
            const result = await db.query(
                queries.accounts.UPDATE_BALANCE,
                [newBalance, accountId]
            );
            
            if (result.rows.length === 0) {
                throw new Error('Cuenta no encontrada');
            }
            
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error al actualizar balance: ${error.message}`);
        }
    }

    /**
     * Verificar si una cuenta tiene transacciones asociadas
     */
    async checkAccountHasTransactions(accountId) {
        try {
            const result = await db.query(
                queries.accounts.CHECK_TRANSACTIONS_EXISTS,
                [accountId]
            );
            return parseInt(result.rows[0].count) > 0;
        } catch (error) {
            throw new Error(`Error al verificar transacciones: ${error.message}`);
        }
    }

    /**
     * Obtener balance de una cuenta específica
     */
    async getAccountBalance(accountId) {
        try {
            const account = await this.getAccountById(accountId);
            
            if (!account) {
                throw new Error('Cuenta no encontrada');
            }
            
            return {
                current_balance: account.current_balance,
                initial_balance: account.initial_balance,
                name: account.name
            };
        } catch (error) {
            throw new Error(`Error al obtener balance: ${error.message}`);
        }
    }
}

module.exports = new AccountsService();
