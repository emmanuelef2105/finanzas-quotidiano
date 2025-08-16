import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { transactionsAPI } from '../services/financeAPI';
import { useAccounts } from '../hooks/useAccounts';
import { formatCurrency, formatDate, getCurrentDate } from '../utils/helpers';

const TransactionsTab = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  
  const { accounts } = useAccounts();
  
  const [formData, setFormData] = useState({
    accountId: '',
    categoryId: '',
    description: '',
    amount: '',
    transactionType: 'expense',
    transactionDate: getCurrentDate(),
    frequency: 'one-time',
    notes: '',
  });

  // Cargar datos iniciales
  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionsAPI.getAll({ limit: 50 });
      setTransactions(response.data.transactions || []);
    } catch (err) {
      setError('Error al cargar transacciones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await transactionsAPI.getCategories();
      setCategories(response.data);
    } catch (err) {
      console.error('Error al cargar categorías:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTransaction) {
        const response = await transactionsAPI.update(editingTransaction.id, formData);
        setTransactions(prev => prev.map(t => 
          t.id === editingTransaction.id ? response.data : t
        ));
      } else {
        const response = await transactionsAPI.create(formData);
        setTransactions(prev => [response.data, ...prev]);
      }
      
      resetForm();
    } catch (err) {
      setError('Error al guardar transacción');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta transacción?')) return;
    
    try {
      await transactionsAPI.delete(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      setError('Error al eliminar transacción');
      console.error(err);
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      accountId: transaction.account_id || '',
      categoryId: transaction.category_id || '',
      description: transaction.description || '',
      amount: transaction.amount || '',
      transactionType: transaction.transaction_type || 'expense',
      transactionDate: transaction.transaction_date?.split('T')[0] || getCurrentDate(),
      frequency: transaction.frequency || 'one-time',
      notes: transaction.notes || '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      accountId: '',
      categoryId: '',
      description: '',
      amount: '',
      transactionType: 'expense',
      transactionDate: getCurrentDate(),
      frequency: 'one-time',
      notes: '',
    });
    setEditingTransaction(null);
    setShowForm(false);
  };

  const filteredCategories = categories.filter(cat => cat.type === formData.transactionType);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-6 animate-pulse">
            <div className="h-6 bg-gray-300 rounded w-48 mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-4 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-md p-6 animate-pulse">
            <div className="h-6 bg-gray-300 rounded w-32 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Formulario */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingTransaction ? 'Editar Transacción' : 'Nueva Transacción'}
            </h3>
            {showForm && (
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>

          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Agregar Transacción
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tipo de transacción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, transactionType: 'income', categoryId: '' }))}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      formData.transactionType === 'income'
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}
                  >
                    Ingreso
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, transactionType: 'expense', categoryId: '' }))}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      formData.transactionType === 'expense'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}
                  >
                    Gasto
                  </button>
                </div>
              </div>

              {/* Cuenta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cuenta
                </label>
                <select
                  value={formData.accountId}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountId: e.target.value }))}
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Seleccionar cuenta</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Sin categoría</option>
                  {filteredCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Monto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  required
                  min="0"
                  step="0.01"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={formData.transactionDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, transactionDate: e.target.value }))}
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Frecuencia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frecuencia
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="one-time">Una vez</option>
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                  <option value="yearly">Anual</option>
                </select>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {editingTransaction ? 'Actualizar' : 'Agregar'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Lista de transacciones */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Transacciones Recientes
            </h3>
          </div>
          
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto custom-scrollbar">
            {transactions.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No hay transacciones registradas
              </div>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-4 hover:bg-gray-50 transition-colors duration-150"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">
                          {transaction.description}
                        </p>
                        {transaction.category_name && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {transaction.category_name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {transaction.account_name} • {formatDate(transaction.transaction_date)}
                      </p>
                      {transaction.notes && (
                        <p className="text-xs text-gray-600 mt-1">
                          {transaction.notes}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-semibold ${
                        transaction.transaction_type === 'income'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {transaction.transaction_type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </span>
                      
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="p-1 text-gray-400 hover:text-blue-600"
                          title="Editar"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Eliminar"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsTab;
