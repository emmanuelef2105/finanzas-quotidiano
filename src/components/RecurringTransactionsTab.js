import React, { useState, useEffect } from 'react';
import { 
  PauseIcon, 
  PlayIcon, 
  PencilIcon, 
  ClockIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { formatCurrency, formatDate } from '../utils/helpers';

const RecurringTransactionsTab = () => {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSeries, setEditingSeries] = useState(null);
  const [updateType, setUpdateType] = useState('series');

  useEffect(() => {
    fetchSeries();
  }, []);

  const fetchSeries = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/recurring/series');
      const data = await response.json();
      setSeries(data.data || []);
    } catch (err) {
      setError('Error al cargar series recurrentes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSeriesStatus = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/recurring/series/${id}/toggle`, {
        method: 'PATCH',
      });
      
      if (response.ok) {
        fetchSeries();
      }
    } catch (err) {
      setError('Error al cambiar estado de la serie');
      console.error(err);
    }
  };

  const generateTransactions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/recurring/series/generate', {
        method: 'POST',
      });
      
      const result = await response.json();
      alert(`Se generaron ${result.count} nuevas transacciones`);
    } catch (err) {
      setError('Error al generar transacciones');
      console.error(err);
    }
  };

  const handleEdit = (seriesItem, type = 'series') => {
    setEditingSeries(seriesItem);
    setUpdateType(type);
    setShowEditModal(true);
  };

  const getFrequencyDescription = (seriesItem) => {
    if (seriesItem.recurrence_type === 'custom') {
      const interval = seriesItem.frequency_interval || 1;
      const type = seriesItem.frequency_type;
      const typeLabel = {
        'daily': interval === 1 ? 'día' : 'días',
        'weekly': interval === 1 ? 'semana' : 'semanas', 
        'monthly': interval === 1 ? 'mes' : 'meses',
        'yearly': interval === 1 ? 'año' : 'años'
      };
      return `Cada ${interval} ${typeLabel[type]}`;
    }
    
    const labels = {
      'daily': 'Diario',
      'weekly': 'Semanal',
      'monthly': 'Mensual',
      'yearly': 'Anual'
    };
    return labels[seriesItem.frequency_type] || 'Desconocido';
  };

  const EditModal = () => {
    const [formData, setFormData] = useState({
      amount: editingSeries?.amount || '',
      description: editingSeries?.description || '',
      notes: editingSeries?.notes || ''
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const response = await fetch(`http://localhost:5000/api/recurring/series/${editingSeries.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            updateType
          }),
        });

        if (response.ok) {
          setShowEditModal(false);
          setEditingSeries(null);
          fetchSeries();
        }
      } catch (err) {
        setError('Error al actualizar serie');
        console.error(err);
      }
    };

    if (!showEditModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">
            Editar Serie: {editingSeries?.description}
          </h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ¿Qué deseas actualizar?
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="series"
                  checked={updateType === 'series'}
                  onChange={(e) => setUpdateType(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">Solo la configuración de la serie</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="future"
                  checked={updateType === 'future'}
                  onChange={(e) => setUpdateType(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">Esta transacción y todas las futuras</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="all"
                  checked={updateType === 'all'}
                  onChange={(e) => setUpdateType(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">Todas las transacciones de la serie</span>
              </label>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="flex space-x-2 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                Guardar Cambios
              </button>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-300 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Transacciones Recurrentes
          </h3>
          <button
            onClick={generateTransactions}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
          >
            <ClockIcon className="h-4 w-4 mr-2" />
            Generar Pendientes
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Lista de series */}
      <div className="bg-white rounded-xl shadow-md">
        <div className="divide-y divide-gray-200">
          {series.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No hay transacciones recurrentes configuradas
            </div>
          ) : (
            series.map((seriesItem) => (
              <div key={seriesItem.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        {seriesItem.description}
                      </h4>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        seriesItem.transaction_type === 'income'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {seriesItem.transaction_type === 'income' ? 'Ingreso' : 'Gasto'}
                      </span>
                      {!seriesItem.is_active && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          Pausada
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>
                        <strong>Cuenta:</strong> {seriesItem.account_name}
                      </span>
                      <span>
                        <strong>Frecuencia:</strong> {getFrequencyDescription(seriesItem)}
                      </span>
                      <span>
                        <strong>Próxima:</strong> {formatDate(seriesItem.next_generation_date)}
                      </span>
                      <span>
                        <strong>Generadas:</strong> {seriesItem.generated_transactions_count || 0}
                      </span>
                    </div>

                    {(seriesItem.skip_weekends || seriesItem.skip_holidays || seriesItem.use_custom_logic) && (
                      <div className="mt-2 flex space-x-2">
                        {seriesItem.skip_weekends && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                            Sin fines de semana
                          </span>
                        )}
                        {seriesItem.skip_holidays && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-800">
                            Sin festivos
                          </span>
                        )}
                        {seriesItem.use_custom_logic && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800">
                            <CogIcon className="h-3 w-3 mr-1" />
                            Lógica personalizada
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-semibold ${
                      seriesItem.transaction_type === 'income'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {seriesItem.transaction_type === 'income' ? '+' : '-'}
                      {formatCurrency(seriesItem.amount)}
                    </span>

                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEdit(seriesItem, 'series')}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Editar"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleSeriesStatus(seriesItem.id)}
                        className="p-1 text-gray-400 hover:text-yellow-600"
                        title={seriesItem.is_active ? 'Pausar' : 'Reanudar'}
                      >
                        {seriesItem.is_active ? (
                          <PauseIcon className="h-4 w-4" />
                        ) : (
                          <PlayIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <EditModal />
    </div>
  );
};

export default RecurringTransactionsTab;
