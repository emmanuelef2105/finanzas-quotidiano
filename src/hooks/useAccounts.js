import { useState, useEffect } from 'react';
import { accountsAPI } from '../services/financeAPI';

export const useAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await accountsAPI.getAll();
      setAccounts(response.data);
    } catch (err) {
      setError(err.message || 'Error al cargar cuentas');
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const createAccount = async (accountData) => {
    try {
      const response = await accountsAPI.create(accountData);
      setAccounts(prev => [response.data, ...prev]);
      return response.data;
    } catch (err) {
      setError(err.message || 'Error al crear cuenta');
      throw err;
    }
  };

  const updateAccount = async (id, accountData) => {
    try {
      const response = await accountsAPI.update(id, accountData);
      setAccounts(prev => prev.map(acc => 
        acc.id === id ? response.data : acc
      ));
      return response.data;
    } catch (err) {
      setError(err.message || 'Error al actualizar cuenta');
      throw err;
    }
  };

  const deleteAccount = async (id) => {
    try {
      await accountsAPI.delete(id);
      setAccounts(prev => prev.filter(acc => acc.id !== id));
    } catch (err) {
      setError(err.message || 'Error al eliminar cuenta');
      throw err;
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const refreshAccounts = () => {
    fetchAccounts();
  };

  return {
    accounts,
    loading,
    error,
    createAccount,
    updateAccount,
    deleteAccount,
    refreshAccounts,
  };
};
