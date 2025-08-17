import React, { useState } from 'react';
import { PlusIcon, TrashIcon, PencilIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { cardsAPI } from '../services/financeAPI';
import { useAccounts } from '../hooks/useAccounts';
import { useCards } from '../hooks/useCards';
import { formatCurrency } from '../utils/helpers';

const CardsTab = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  
  const { accounts } = useAccounts();
  const { cards, fetchCards: refreshCards } = useCards();
  
  const [formData, setFormData] = useState({
    account_id: '',
    card_name: '',
    card_type: 'debit',
    last_four_digits: '',
    brand: '',
    credit_limit: '',
    notes: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingCard) {
        await cardsAPI.update(editingCard.id, formData);
      } else {
        await cardsAPI.create(formData);
      }
      await refreshCards(); // Actualizar la lista
      resetForm();
    } catch (err) {
      setError('Error al guardar tarjeta');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta tarjeta?')) return;
    
    try {
      setLoading(true);
      await cardsAPI.delete(id);
      await refreshCards(); // Actualizar la lista
    } catch (err) {
      setError('Error al eliminar tarjeta');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (card) => {
    setEditingCard(card);
    setFormData({
      account_id: card.account_id || '',
      card_name: card.card_name || '',
      card_type: card.card_type || 'debit',
      last_four_digits: card.last_four_digits || '',
      brand: card.brand || '',
      credit_limit: card.credit_limit || '',
      notes: card.notes || '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      account_id: '',
      card_name: '',
      card_type: 'debit',
      last_four_digits: '',
      brand: '',
      credit_limit: '',
      notes: '',
    });
    setEditingCard(null);
    setShowForm(false);
  };

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
              {editingCard ? 'Editar Tarjeta' : 'Nueva Tarjeta'}
            </h3>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md">
              {error}
            </div>
          )}

          {showForm ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Cuenta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cuenta bancaria
                </label>
                <select
                  value={formData.account_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, account_id: e.target.value }))}
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

              {/* Nombre de la tarjeta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la tarjeta
                </label>
                <input
                  type="text"
                  value={formData.card_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, card_name: e.target.value }))}
                  required
                  placeholder="Ej: Tarjeta Principal, Crédito BBVA"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Tipo de tarjeta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de tarjeta
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, card_type: 'debit', credit_limit: '' }))}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      formData.card_type === 'debit'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}
                  >
                    Débito
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, card_type: 'credit' }))}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      formData.card_type === 'credit'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}
                  >
                    Crédito
                  </button>
                </div>
              </div>

              {/* Últimos 4 dígitos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Últimos 4 dígitos <span className="text-gray-500 text-xs">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={formData.last_four_digits}
                  onChange={(e) => {
                    // Solo números y máximo 4 dígitos
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setFormData(prev => ({ ...prev, last_four_digits: value }));
                  }}
                  placeholder="1234"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Marca */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marca <span className="text-gray-500 text-xs">(opcional)</span>
                </label>
                <select
                  value={formData.brand}
                  onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Seleccionar marca</option>
                  <option value="Visa">Visa</option>
                  <option value="MasterCard">MasterCard</option>
                  <option value="American Express">American Express</option>
                  <option value="Discover">Discover</option>
                  <option value="Otra">Otra</option>
                </select>
              </div>

              {/* Límite de crédito (solo para tarjetas de crédito) */}
              {formData.card_type === 'credit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Límite de crédito <span className="text-gray-500 text-xs">(opcional)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.credit_limit}
                    onChange={(e) => setFormData(prev => ({ ...prev, credit_limit: e.target.value }))}
                    placeholder="50000.00"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas <span className="text-gray-500 text-xs">(opcional)</span>
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
                  {editingCard ? 'Actualizar' : 'Agregar'}
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
          ) : (
            <div className="text-center py-8">
              <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay formulario activo</h3>
              <p className="mt-1 text-sm text-gray-500">
                Haz clic en el botón + para agregar una nueva tarjeta.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Lista de tarjetas */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Mis Tarjetas ({cards.length})
          </h3>
          
          {cards.length === 0 ? (
            <div className="text-center py-8">
              <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tienes tarjetas registradas</h3>
              <p className="mt-1 text-sm text-gray-500">
                Comienza agregando tu primera tarjeta para poder asociarla a tus transacciones.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Agregar primera tarjeta
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cards.map((card) => (
                <div key={card.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <CreditCardIcon className={`h-5 w-5 ${
                          card.card_type === 'credit' ? 'text-purple-500' : 'text-blue-500'
                        }`} />
                        <h4 className="text-sm font-semibold text-gray-900">
                          {card.card_name}
                        </h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          card.card_type === 'credit' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {card.card_type === 'credit' ? 'Crédito' : 'Débito'}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Cuenta:</strong> {card.account_name}</p>
                        
                        {card.brand && (
                          <p><strong>Marca:</strong> {card.brand}</p>
                        )}
                        
                        {card.last_four_digits && (
                          <p><strong>Terminación:</strong> **** **** **** {card.last_four_digits}</p>
                        )}
                        
                        {card.card_type === 'credit' && (
                          <div className="space-y-1">
                            {card.credit_limit && (
                              <p><strong>Límite:</strong> {formatCurrency(card.credit_limit)}</p>
                            )}
                            <p><strong>Saldo utilizado:</strong> {formatCurrency(card.current_balance || 0)}</p>
                            {card.credit_limit && (
                              <p><strong>Disponible:</strong> {formatCurrency((card.credit_limit - (card.current_balance || 0)))}</p>
                            )}
                          </div>
                        )}
                        
                        {card.notes && (
                          <p className="text-gray-500"><strong>Notas:</strong> {card.notes}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-1 ml-4">
                      <button
                        onClick={() => handleEdit(card)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(card.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
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

export default CardsTab;
