import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, BanknotesIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { debtsAPI } from '../services/financeAPI';
import { useAccounts } from '../hooks/useAccounts';
import { formatCurrency, formatDate, getCurrentDate, exportAsPNG } from '../utils/helpers';

const DebtsTab = () => {
  const [activeSubTab, setActiveSubTab] = useState('debtors');
  const [debtors, setDebtors] = useState([]);
  const [myDebts, setMyDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDebtorForm, setShowDebtorForm] = useState(false);
  const [showMyDebtForm, setShowMyDebtForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState(null);
  const [selectedMyDebt, setSelectedMyDebt] = useState(null);
  
  const { accounts } = useAccounts();
  
  const [debtorForm, setDebtorForm] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });

  const [myDebtForm, setMyDebtForm] = useState({
    creditorName: '',
    originalAmount: '',
    monthlyPayment: '',
    interestRate: '',
    dueDate: '',
    notes: '',
  });

  const [paymentForm, setPaymentForm] = useState({
    accountId: '',
    amount: '',
    paymentDate: getCurrentDate(),
    notes: '',
  });

  const [itemForm, setItemForm] = useState({
    description: '',
    amount: '',
    itemDate: getCurrentDate(),
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [debtorsRes, myDebtsRes] = await Promise.all([
        debtsAPI.getDebtors(),
        debtsAPI.getMyDebts(),
      ]);
      setDebtors(debtorsRes.data);
      setMyDebts(myDebtsRes.data);
    } catch (err) {
      console.error('Error al cargar deudas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDebtor = async (e) => {
    e.preventDefault();
    try {
      await debtsAPI.createDebtor(debtorForm);
      setDebtorForm({ name: '', phone: '', email: '', notes: '' });
      setShowDebtorForm(false);
      fetchData();
    } catch (err) {
      console.error('Error al crear deudor:', err);
    }
  };

  const handleAddDebtItem = async (debtorId, e) => {
    e.preventDefault();
    try {
      await debtsAPI.addDebtItem(debtorId, itemForm);
      setItemForm({ description: '', amount: '', itemDate: getCurrentDate(), notes: '' });
      setSelectedDebtor(null);
      fetchData();
    } catch (err) {
      console.error('Error al agregar artículo de deuda:', err);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      await debtsAPI.addDebtPayment(selectedDebtor.id, paymentForm);
      setPaymentForm({ accountId: '', amount: '', paymentDate: getCurrentDate(), notes: '' });
      setShowPaymentModal(false);
      setSelectedDebtor(null);
      fetchData();
    } catch (err) {
      console.error('Error al registrar pago:', err);
    }
  };

  const handleCreateMyDebt = async (e) => {
    e.preventDefault();
    try {
      await debtsAPI.createMyDebt(myDebtForm);
      setMyDebtForm({
        creditorName: '',
        originalAmount: '',
        monthlyPayment: '',
        interestRate: '',
        dueDate: '',
        notes: '',
      });
      setShowMyDebtForm(false);
      fetchData();
    } catch (err) {
      console.error('Error al crear mi deuda:', err);
    }
  };

  const handlePayMyDebt = async (debt, amount, accountId) => {
    try {
      await debtsAPI.payMyDebt(debt.id, {
        paymentAmount: amount,
        accountId: accountId,
      });
      fetchData();
    } catch (err) {
      console.error('Error al pagar deuda:', err);
    }
  };

  const handleDeleteDebtor = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este deudor?')) return;
    try {
      await debtsAPI.deleteDebtor(id);
      fetchData();
    } catch (err) {
      console.error('Error al eliminar deudor:', err);
    }
  };

  const handleDeleteMyDebt = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta deuda?')) return;
    try {
      await debtsAPI.deleteMyDebt(id);
      fetchData();
    } catch (err) {
      console.error('Error al eliminar mi deuda:', err);
    }
  };

  const handleExportDebtor = async (debtor) => {
    const success = await exportAsPNG(`debtor-${debtor.id}`, `deuda-${debtor.name.replace(/\s+/g, '-')}.png`);
    if (!success) {
      alert('Error al exportar. Inténtalo de nuevo.');
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[1, 2].map(i => (
          <div key={i} className="bg-white rounded-xl shadow-md p-6 animate-pulse">
            <div className="h-6 bg-gray-300 rounded w-32 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(j => (
                <div key={j} className="h-16 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Deudas por Cobrar */}
      <div className="bg-white rounded-xl shadow-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Me Deben
            </h3>
            <button
              onClick={() => setShowDebtorForm(true)}
              className="flex items-center px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Agregar Deudor
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
          {debtors.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <BanknotesIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No tienes deudores registrados</p>
            </div>
          ) : (
            debtors.map((debtor) => (
              <div
                key={debtor.id}
                id={`debtor-${debtor.id}`}
                className="bg-green-50 border border-green-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{debtor.name}</h4>
                    {debtor.phone && (
                      <p className="text-sm text-gray-600">📞 {debtor.phone}</p>
                    )}
                    {debtor.email && (
                      <p className="text-sm text-gray-600">✉️ {debtor.email}</p>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleExportDebtor(debtor)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                      title="Exportar como imagen"
                    >
                      <DocumentArrowDownIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDebtor(debtor.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Eliminar deudor"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                  <div className="text-center">
                    <p className="text-gray-600">Debe</p>
                    <p className="font-semibold text-red-600">
                      {formatCurrency(debtor.total_debt)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">Pagado</p>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(debtor.total_paid)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">Saldo</p>
                    <p className="font-semibold text-orange-600">
                      {formatCurrency(debtor.balance)}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedDebtor(debtor)}
                    className="flex-1 text-xs bg-blue-600 text-white py-1.5 px-3 rounded hover:bg-blue-700"
                  >
                    Agregar Artículo
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDebtor(debtor);
                      setShowPaymentModal(true);
                    }}
                    className="flex-1 text-xs bg-green-600 text-white py-1.5 px-3 rounded hover:bg-green-700"
                  >
                    Registrar Pago
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mis Deudas */}
      <div className="bg-white rounded-xl shadow-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Yo Debo
            </h3>
            <button
              onClick={() => setShowMyDebtForm(true)}
              className="flex items-center px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Agregar Deuda
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
          {myDebts.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <BanknotesIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No tienes deudas registradas</p>
            </div>
          ) : (
            myDebts.map((debt) => (
              <div
                key={debt.id}
                className="bg-red-50 border border-red-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{debt.creditor_name}</h4>
                    {debt.due_date && (
                      <p className="text-sm text-gray-600">
                        Vence: {formatDate(debt.due_date)}
                      </p>
                    )}
                    {debt.monthly_payment && (
                      <p className="text-sm text-gray-600">
                        Cuota: {formatCurrency(debt.monthly_payment)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteMyDebt(debt.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Eliminar deuda"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div className="text-center">
                    <p className="text-gray-600">Original</p>
                    <p className="font-semibold text-gray-800">
                      {formatCurrency(debt.original_amount)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">Saldo</p>
                    <p className="font-semibold text-red-600">
                      {formatCurrency(debt.current_balance)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedMyDebt(debt)}
                  className="w-full text-sm bg-blue-600 text-white py-1.5 px-3 rounded hover:bg-blue-700"
                >
                  Hacer Pago
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modales */}
      {showDebtorForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium mb-4">Agregar Deudor</h3>
            <form onSubmit={handleCreateDebtor} className="space-y-4">
              <input
                type="text"
                placeholder="Nombre"
                value={debtorForm.name}
                onChange={(e) => setDebtorForm(prev => ({ ...prev, name: e.target.value }))}
                required
                className="w-full rounded-md border-gray-300"
              />
              <input
                type="tel"
                placeholder="Teléfono"
                value={debtorForm.phone}
                onChange={(e) => setDebtorForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full rounded-md border-gray-300"
              />
              <input
                type="email"
                placeholder="Email"
                value={debtorForm.email}
                onChange={(e) => setDebtorForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full rounded-md border-gray-300"
              />
              <textarea
                placeholder="Notas"
                value={debtorForm.notes}
                onChange={(e) => setDebtorForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full rounded-md border-gray-300"
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                  Agregar
                </button>
                <button
                  type="button"
                  onClick={() => setShowDebtorForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMyDebtForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium mb-4">Agregar Mi Deuda</h3>
            <form onSubmit={handleCreateMyDebt} className="space-y-4">
              <input
                type="text"
                placeholder="Acreedor"
                value={myDebtForm.creditorName}
                onChange={(e) => setMyDebtForm(prev => ({ ...prev, creditorName: e.target.value }))}
                required
                className="w-full rounded-md border-gray-300"
              />
              <input
                type="number"
                placeholder="Monto original"
                value={myDebtForm.originalAmount}
                onChange={(e) => setMyDebtForm(prev => ({ ...prev, originalAmount: e.target.value }))}
                required
                className="w-full rounded-md border-gray-300"
              />
              <input
                type="number"
                placeholder="Cuota mensual"
                value={myDebtForm.monthlyPayment}
                onChange={(e) => setMyDebtForm(prev => ({ ...prev, monthlyPayment: e.target.value }))}
                className="w-full rounded-md border-gray-300"
              />
              <input
                type="date"
                placeholder="Fecha de vencimiento"
                value={myDebtForm.dueDate}
                onChange={(e) => setMyDebtForm(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full rounded-md border-gray-300"
              />
              <textarea
                placeholder="Notas"
                value={myDebtForm.notes}
                onChange={(e) => setMyDebtForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full rounded-md border-gray-300"
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700"
                >
                  Agregar
                </button>
                <button
                  type="button"
                  onClick={() => setShowMyDebtForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Más modales similares para agregar artículos, pagos, etc. */}
    </div>
  );
};

export default DebtsTab;
