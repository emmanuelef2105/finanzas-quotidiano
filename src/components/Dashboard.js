import React from 'react';
import { 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  CreditCardIcon 
} from '@heroicons/react/24/outline';
import { useDashboard } from '../hooks/useDashboard';
import { formatCurrency } from '../utils/helpers';

const Dashboard = () => {
  const { summary, loading, error } = useDashboard();

  if (loading) {
    return (
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-md animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-24"></div>
                <div className="h-8 bg-gray-300 rounded w-32"></div>
              </div>
              <div className="bg-gray-200 p-3 rounded-full w-12 h-12"></div>
            </div>
          </div>
        ))}
      </section>
    );
  }

  if (error) {
    return (
      <section className="mb-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error al cargar el dashboard
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const dashboardCards = [
    {
      title: 'Capital Actual',
      value: summary.currentCapital,
      icon: CurrencyDollarIcon,
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
    },
    {
      title: 'Ingresos del Mes',
      value: summary.monthlyIncome,
      icon: ArrowTrendingUpIcon,
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
    },
    {
      title: 'Gastos del Mes',
      value: summary.monthlyExpenses,
      icon: ArrowTrendingDownIcon,
      color: 'red',
      bgColor: 'bg-red-100',
      textColor: 'text-red-600',
    },
    {
      title: 'Balance Neto',
      value: summary.netWorth,
      icon: CreditCardIcon,
      color: summary.netWorth >= 0 ? 'green' : 'red',
      bgColor: summary.netWorth >= 0 ? 'bg-green-100' : 'bg-red-100',
      textColor: summary.netWorth >= 0 ? 'text-green-600' : 'text-red-600',
    },
  ];

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {dashboardCards.map((card) => {
        const IconComponent = card.icon;
        return (
          <div 
            key={card.title}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {card.title}
                </p>
                <p className={`text-3xl font-bold ${card.textColor}`}>
                  {formatCurrency(card.value)}
                </p>
                {card.title === 'Balance Neto' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Patrimonio total
                  </p>
                )}
              </div>
              <div className={`${card.bgColor} p-3 rounded-full`}>
                <IconComponent className={`h-6 w-6 ${card.textColor}`} />
              </div>
            </div>
            
            {/* Información adicional para algunas tarjetas */}
            {card.title === 'Capital Actual' && summary.debtsToCollect > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Por cobrar: {formatCurrency(summary.debtsToCollect)}
                </p>
              </div>
            )}
            
            {card.title === 'Balance Neto' && summary.myDebts > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-red-500">
                  Deudas: {formatCurrency(summary.myDebts)}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
};

export default Dashboard;
