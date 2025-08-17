/**
 * Índice central de todas las consultas SQL
 * Importa y exporta todas las consultas organizadas por módulo
 */

const accountsQueries = require('./accounts.sql.js');
const transactionsQueries = require('./transactions.sql.js');
const dashboardQueries = require('./dashboard.sql.js');
const recurringQueries = require('./recurring.sql.js');
const investmentsQueries = require('./investments.sql.js');
const debtsQueries = require('./debts.sql.js');

module.exports = {
    accounts: accountsQueries,
    transactions: transactionsQueries,
    dashboard: dashboardQueries,
    recurring: recurringQueries,
    investments: investmentsQueries,
    debts: debtsQueries
};

// Exportación alternativa para acceso directo
module.exports.ACCOUNTS = accountsQueries;
module.exports.TRANSACTIONS = transactionsQueries;
module.exports.DASHBOARD = dashboardQueries;
module.exports.RECURRING = recurringQueries;
module.exports.INVESTMENTS = investmentsQueries;
module.exports.DEBTS = debtsQueries;
