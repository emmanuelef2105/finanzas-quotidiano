import React, { useState } from 'react';
import { PlusIcon, TrashIcon, PencilIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { useAccounts } from '../hooks/useAccounts';
import { formatCurrency } from '../utils/helpers';

const AccountsTab = () => {
  const { accounts, loading, error, createAccount, updateAccount, deleteAccount } = useAccounts();
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    initialBalance: '',
    accountType: 'checking',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const accountData = {
        name: formData.name,
        initialBalance: parseFloat(formData.initialBalance) || 0,
        accountType: formData.accountType,
      };

      if (editingAccount) {
        await updateAccount(editingAccount.id, accountData);
      } else {
        await createAccount(accountData);
      }
      
      resetForm();
    } catch (err) {
      console.error('Error al guardar cuenta:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta cuenta?')) return;
    
    try {
      await deleteAccount(id);
    } catch (err) {
      console.error('Error al eliminar cuenta:', err);
    }
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name || '',
      initialBalance: account.initial_balance || '',
      accountType: account.account_type || 'checking',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      initialBalance: '',
      accountType: 'checking',
    });
    setEditingAccount(null);
    setShowForm(false);
  };

  const accountTypes = [
    { value: 'checking', label: 'Cuenta Corriente' },
    { value: 'savings', label: 'Cuenta de Ahorros' },
    { value: 'cash', label: 'Efectivo' },
    { value: 'credit', label: 'Tarjeta de Crédito' },
    { value: 'investment', label: 'Inversión' },
    { value: 'other', label: 'Otro' },
  ];

  const getAccountTypeIcon = (type) => {
    switch (type) {
      case 'cash':
        return '💵';
      case 'savings':
        return '🏦';
      case 'credit':
        return '💳';
      case 'investment':
        return '📈';
      default:
        return '💰';
    }
  };

  const getAccountTypeLabel = (type) => {
    const accountType = accountTypes.find(t => t.value === type);
    return accountType ? accountType.label : 'Cuenta';
  };

  // Calcular totales
  const totalBalance = accounts.reduce((sum, account) => sum + parseFloat(account.current_balance || 0), 0);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-6 animate-pulse">
            <div className="h-6 bg-gray-300 rounded w-32 mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-4 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-md p-6 animate-pulse">
            <div className="h-6 bg-gray-300 rounded w-24 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-300 rounded"></div>
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
              {editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta'}
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
            <div className="space-y-4">
              <button
                onClick={() => setShowForm(true)}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Agregar Cuenta
              </button>

              {/* Resumen */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Resumen</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total de cuentas:</span>
                    <span className="font-medium">{accounts.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Balance total:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(totalBalance)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la cuenta
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Ej: Banco Bogotá - Ahorros"
                />
              </div>

              {/* Tipo de cuenta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de cuenta
                </label>
                <select
                  value={formData.accountType}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountType: e.target.value }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {accountTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Balance inicial */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Balance inicial
                </label>
                <input
                  type="number"
                  value={formData.initialBalance}
                  onChange={(e) => setFormData(prev => ({ ...prev, initialBalance: e.target.value }))}
                  step="0.01"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editingAccount 
                    ? 'Solo se puede cambiar el nombre y tipo de cuenta'
                    : 'Monto que tienes actualmente en esta cuenta'
                  }
                </p>
              </div>

              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {editingAccount ? 'Actualizar' : 'Agregar'}
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

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Lista de cuentas */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Mis Cuentas
            </h3>
          </div>

          {accounts.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <BanknotesIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No tienes cuentas registradas</p>
              <p className="text-sm">Agrega tu primera cuenta para comenzar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{getAccountTypeIcon(account.account_type)}</span>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">
                          {account.name}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {getAccountTypeLabel(account.account_type)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEdit(account)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Editar cuenta"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(account.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Eliminar cuenta"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Balance actual:</span>
                      <span className={`font-semibold text-lg ${
                        parseFloat(account.current_balance) >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {formatCurrency(account.current_balance)}
                      </span>
                    </div>
                    
                    {account.initial_balance !== account.current_balance && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Balance inicial:</span>
                        <span className="text-xs text-gray-600">
                          {formatCurrency(account.initial_balance)}
                        </span>
                      </div>
                    )}
                    
                    {account.initial_balance !== account.current_balance && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Diferencia:</span>
                        <span className={`text-xs font-medium ${
                          (parseFloat(account.current_balance) - parseFloat(account.initial_balance)) >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {parseFloat(account.current_balance) - parseFloat(account.initial_balance) >= 0 ? '+' : ''}
                          {formatCurrency(parseFloat(account.current_balance) - parseFloat(account.initial_balance))}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountsTab;
