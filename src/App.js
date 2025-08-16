import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import TransactionsTab from './components/TransactionsTab';
import DebtsTab from './components/DebtsTab';
import InvestmentsTab from './components/InvestmentsTab';
import AccountsTab from './components/AccountsTab';
import ConfigurationTab from './components/ConfigurationTab';

const App = () => {
  const [activeTab, setActiveTab] = useState('transactions');

  const tabs = [
    { id: 'transactions', label: 'Transacciones', component: TransactionsTab },
    { id: 'debts', label: 'Deudas y Préstamos', component: DebtsTab },
    { id: 'investments', label: 'Inversiones', component: InvestmentsTab },
    { id: 'accounts', label: 'Cuentas', component: AccountsTab },
    { id: 'configuration', label: 'Configuración', component: ConfigurationTab },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="bg-gray-100 min-h-screen text-gray-800">
      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Panel de Finanzas</h1>
          <p className="text-gray-600">Tu centro de control financiero personal.</p>
        </header>

        {/* Dashboard */}
        <Dashboard />

        {/* Navigation Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8 -mb-px" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`${tab.id}-panel`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <main id="tab-content">
          <div
            id={`${activeTab}-panel`}
            role="tabpanel"
            aria-labelledby={`${activeTab}-tab`}
            className="fade-in"
          >
            {ActiveComponent && <ActiveComponent />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
