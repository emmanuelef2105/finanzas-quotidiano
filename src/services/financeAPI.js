import api from './api';

// ========== CUENTAS ==========
export const accountsAPI = {
  getAll: () => api.get('/accounts'),
  create: (data) => api.post('/accounts', data),
  update: (id, data) => api.put(`/accounts/${id}`, data),
  delete: (id) => api.delete(`/accounts/${id}`),
  getBalance: (id) => api.get(`/accounts/${id}/balance`),
};

// ========== TRANSACCIONES ==========
export const transactionsAPI = {
  getAll: (params = {}) => api.get('/transactions', { params }),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
  getCategories: (type) => api.get('/transactions/categories', { params: { type } }),
  getMonthlySummary: (year, month) => 
    api.get('/transactions/monthly-summary', { params: { year, month } }),
};

// ========== TARJETAS ==========
export const cardsAPI = {
  getAll: () => api.get('/cards'),
  getByAccount: (accountId) => api.get(`/cards/by-account/${accountId}`),
  create: (data) => api.post('/cards', data),
  update: (id, data) => api.put(`/cards/${id}`, data),
  delete: (id) => api.delete(`/cards/${id}`),
  getSummary: (id) => api.get(`/cards/${id}/summary`),
};

// ========== MÉTODOS DE PAGO Y DIVISAS ==========
export const utilsAPI = {
  getPaymentMethods: () => api.get('/utils/payment-methods'),
  getCurrencies: () => api.get('/utils/currencies'),
  createPaymentMethod: (data) => api.post('/utils/payment-methods', data),
  createCurrency: (data) => api.post('/utils/currencies', data),
  updatePaymentMethod: (id, data) => api.put(`/utils/payment-methods/${id}`, data),
  updateCurrency: (id, data) => api.put(`/utils/currencies/${id}`, data),
  getExchangeRates: () => api.get('/utils/exchange-rates'),
};

// ========== DEUDAS ==========
export const debtsAPI = {
  // Deudas por cobrar
  getDebtors: () => api.get('/debts/debtors'),
  createDebtor: (data) => api.post('/debts/debtors', data),
  getDebtorDetails: (id) => api.get(`/debts/debtors/${id}`),
  deleteDebtor: (id) => api.delete(`/debts/debtors/${id}`),
  addDebtItem: (debtorId, data) => api.post(`/debts/debtors/${debtorId}/items`, data),
  addDebtPayment: (debtorId, data) => api.post(`/debts/debtors/${debtorId}/payments`, data),
  
  // Mis deudas
  getMyDebts: () => api.get('/debts/my-debts'),
  createMyDebt: (data) => api.post('/debts/my-debts', data),
  payMyDebt: (id, data) => api.put(`/debts/my-debts/${id}/payment`, data),
  deleteMyDebt: (id) => api.delete(`/debts/my-debts/${id}`),
};

// ========== INVERSIONES ==========
export const investmentsAPI = {
  getAll: () => api.get('/investments'),
  create: (data) => api.post('/investments', data),
  update: (id, data) => api.put(`/investments/${id}`, data),
  liquidate: (id, data) => api.put(`/investments/${id}/liquidate`, data),
  delete: (id) => api.delete(`/investments/${id}`),
  getSummary: () => api.get('/investments/summary'),
};

// ========== DASHBOARD ==========
export const dashboardAPI = {
  getSummary: (dateRange = null) => {
    const params = dateRange ? { dateRange: JSON.stringify(dateRange) } : {};
    return api.get('/dashboard/summary', { params });
  },
  getRecentTransactions: (limit = 10, dateRange = null) => {
    const params = { limit };
    if (dateRange) {
      params.dateRange = JSON.stringify(dateRange);
    }
    return api.get('/dashboard/recent-transactions', { params });
  },
  getCategoryStats: (dateRange = null) => {
    const params = dateRange ? { dateRange: JSON.stringify(dateRange) } : {};
    return api.get('/dashboard/category-stats', { params });
  },
  getMonthlyEvolution: () => api.get('/dashboard/monthly-evolution'),
  getUpcomingDebts: (days = 30) => 
    api.get('/dashboard/upcoming-debts', { params: { days } }),
  getAlerts: () => api.get('/dashboard/alerts'),
};

// ========== CONFIGURACIÓN ==========
export const configurationAPI = {
  // Gestión de categorías
  createCategory: (data) => api.post('/transactions/categories', data),
  updateCategory: (id, data) => api.put(`/transactions/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/transactions/categories/${id}`),
  
  // Futuras funciones de configuración
  // getBanksList: () => api.get('/configuration/banks'),
  // getAccountTypes: () => api.get('/configuration/account-types'),
};
