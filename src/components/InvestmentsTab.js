import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { investmentsAPI } from '../services/financeAPI';
import { useAccounts } from '../hooks/useAccounts';
import { formatCurrency, formatDate, formatPercentage, getCurrentDate } from '../utils/helpers';

const InvestmentsTab = () => {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showLiquidateModal, setShowLiquidateModal] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  
  const { accounts } = useAccounts();
  
  const [formData, setFormData] = useState({
    accountId: '',
    name: '',
    amount: '',
    expectedYield: '',
    investmentType: 'other',
    startDate: getCurrentDate(),
    maturityDate: '',
    notes: '',
  });

  const [liquidateForm, setLiquidateForm] = useState({
    returnAmount: '',
    liquidationDate: getCurrentDate(),
    accountId: '',
  });

  const investmentTypes = [
    { value: 'stocks', label: 'Acciones' },
    { value: 'bonds', label: 'Bonos' },
    { value: 'mutual_funds', label: 'Fondos Mutuos' },
    { value: 'etf', label: 'ETF' },
    { value: 'crypto', label: 'Criptomonedas' },
    { value: 'real_estate', label: 'Bienes Raíces' },
    { value: 'commodities', label: 'Commodities' },
    { value: 'fixed_deposit', label: 'Depósito a Plazo' },
    { value: 'other', label: 'Otro' },
  ];

  useEffect(() => {
    fetchInvestments();
  }, []);

  const fetchInvestments = async () => {
    try {
      setLoading(true);
      const response = await investmentsAPI.getAll();
      setInvestments(response.data);
    } catch (err) {
      console.error('Error al cargar inversiones:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const investmentData = {
        ...formData,
        amount: parseFloat(formData.amount),
        expectedYield: parseFloat(formData.expectedYield) || 0,
      };

      await investmentsAPI.create(investmentData);
      resetForm();
      fetchInvestments();
    } catch (err) {
      console.error('Error al crear inversión:', err);
    }
  };

  const handleLiquidate = async (e) => {
    e.preventDefault();
    try {
      const liquidationData = {
        returnAmount: parseFloat(liquidateForm.returnAmount),
        liquidationDate: liquidateForm.liquidationDate,
        accountId: liquidateForm.accountId || selectedInvestment.account_id,
      };

      await investmentsAPI.liquidate(selectedInvestment.id, liquidationData);
      setShowLiquidateModal(false);
      setSelectedInvestment(null);
      setLiquidateForm({
        returnAmount: '',
        liquidationDate: getCurrentDate(),
        accountId: '',
      });
      fetchInvestments();
    } catch (err) {
      console.error('Error al liquidar inversión:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta inversión?')) return;
    
    try {
      await investmentsAPI.delete(id);
      fetchInvestments();
    } catch (err) {
      console.error('Error al eliminar inversión:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      accountId: '',
      name: '',
      amount: '',
      expectedYield: '',
      investmentType: 'other',
      startDate: getCurrentDate(),
      maturityDate: '',
      notes: '',
    });
    setShowForm(false);
  };

  const openLiquidateModal = (investment) => {
    setSelectedInvestment(investment);
    setLiquidateForm({
      returnAmount: investment.amount.toString(),
      liquidationDate: getCurrentDate(),
      accountId: investment.account_id,
    });
    setShowLiquidateModal(true);
  };

  const getInvestmentTypeIcon = (type) => {
    const icons = {
      stocks: '📈',
      bonds: '📊',
      mutual_funds: '🏦',
      etf: '📉',
      crypto: '₿',
      real_estate: '🏠',
      commodities: '🥇',
      fixed_deposit: '💰',
      other: '💼',
    };
    return icons[type] || '💼';
  };

  const getInvestmentTypeLabel = (type) => {
    const investmentType = investmentTypes.find(t => t.value === type);
    return investmentType ? investmentType.label : 'Inversión';
  };

  const calculateDaysInvested = (startDate) => {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateProjectedReturn = (investment) => {
    if (!investment.expected_yield || investment.expected_yield === 0) return 0;
    const daysInvested = calculateDaysInvested(investment.start_date);
    const yearlyReturn = (parseFloat(investment.amount) * parseFloat(investment.expected_yield)) / 100;
    const dailyReturn = yearlyReturn / 365;
    return dailyReturn * daysInvested;
  };

  // Calcular totales
  const totalInvested = investments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
  const totalProjectedReturn = investments.reduce((sum, inv) => sum + calculateProjectedReturn(inv), 0);

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
                <div key={i} className="h-40 bg-gray-300 rounded"></div>
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
              Nueva Inversión
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
                Agregar Inversión
              </button>

              {/* Resumen */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Resumen</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total invertido:</span>
                    <span className="font-semibold text-blue-600">
                      {formatCurrency(totalInvested)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Retorno proyectado:</span>
                    <span className={`font-semibold ${
                      totalProjectedReturn >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {totalProjectedReturn >= 0 ? '+' : ''}
                      {formatCurrency(totalProjectedReturn)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total inversiones:</span>
                    <span className="font-medium">{investments.length}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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

              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la inversión
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Ej: Acciones Apple, Bitcoin, CDT Banco"
                />
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de inversión
                </label>
                <select
                  value={formData.investmentType}
                  onChange={(e) => setFormData(prev => ({ ...prev, investmentType: e.target.value }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {investmentTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Monto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto invertido
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

              {/* Rendimiento esperado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rendimiento esperado anual (%)
                </label>
                <input
                  type="number"
                  value={formData.expectedYield}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectedYield: e.target.value }))}
                  step="0.01"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Ej: 8.5"
                />
              </div>

              {/* Fecha de inicio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de inversión
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Fecha de vencimiento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de vencimiento (opcional)
                </label>
                <input
                  type="date"
                  value={formData.maturityDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, maturityDate: e.target.value }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
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
                  Agregar Inversión
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

      {/* Lista de inversiones */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Mis Inversiones
            </h3>
          </div>

          {investments.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <ArrowTrendingUpIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No tienes inversiones registradas</p>
              <p className="text-sm">Agrega tu primera inversión para comenzar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
              {investments.map((investment) => {
                const daysInvested = calculateDaysInvested(investment.start_date);
                const projectedReturn = calculateProjectedReturn(investment);
                const projectedValue = parseFloat(investment.amount) + projectedReturn;
                
                return (
                  <div
                    key={investment.id}
                    className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-100"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">
                          {getInvestmentTypeIcon(investment.investment_type)}
                        </span>
                        <div>
                          <h4 className="font-medium text-gray-900 text-sm">
                            {investment.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {getInvestmentTypeLabel(investment.investment_type)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-1">
                        <button
                          onClick={() => openLiquidateModal(investment)}
                          className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                          title="Liquidar inversión"
                        >
                          <ArrowTrendingDownIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(investment.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Eliminar inversión"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Invertido:</span>
                        <span className="font-semibold text-blue-600">
                          {formatCurrency(investment.amount)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Valor proyectado:</span>
                        <span className={`font-semibold ${
                          projectedReturn >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(projectedValue)}
                        </span>
                      </div>

                      {investment.expected_yield > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Rendimiento:</span>
                          <span className="text-xs text-gray-600">
                            {formatPercentage(investment.expected_yield)} anual
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Tiempo invertido:</span>
                        <span className="text-xs text-gray-600">
                          {daysInvested} días
                        </span>
                      </div>

                      {investment.maturity_date && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Vencimiento:</span>
                          <span className="text-xs text-gray-600">
                            {formatDate(investment.maturity_date)}
                          </span>
                        </div>
                      )}

                      {projectedReturn !== 0 && (
                        <div className="pt-2 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">Ganancia/Pérdida:</span>
                            <span className={`text-xs font-medium ${
                              projectedReturn >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {projectedReturn >= 0 ? '+' : ''}
                              {formatCurrency(projectedReturn)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de liquidación */}
      {showLiquidateModal && selectedInvestment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium mb-4">
              Liquidar Inversión: {selectedInvestment.name}
            </h3>
            <form onSubmit={handleLiquidate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto recibido
                </label>
                <input
                  type="number"
                  value={liquidateForm.returnAmount}
                  onChange={(e) => setLiquidateForm(prev => ({ ...prev, returnAmount: e.target.value }))}
                  required
                  step="0.01"
                  className="w-full rounded-md border-gray-300"
                  placeholder="Monto que recibes al liquidar"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Inversión original: {formatCurrency(selectedInvestment.amount)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de liquidación
                </label>
                <input
                  type="date"
                  value={liquidateForm.liquidationDate}
                  onChange={(e) => setLiquidateForm(prev => ({ ...prev, liquidationDate: e.target.value }))}
                  required
                  className="w-full rounded-md border-gray-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cuenta de destino
                </label>
                <select
                  value={liquidateForm.accountId}
                  onChange={(e) => setLiquidateForm(prev => ({ ...prev, accountId: e.target.value }))}
                  className="w-full rounded-md border-gray-300"
                >
                  <option value="">Usar cuenta original</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700"
                >
                  Liquidar
                </button>
                <button
                  type="button"
                  onClick={() => setShowLiquidateModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentsTab;
