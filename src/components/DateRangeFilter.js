import React, { useState } from 'react';
import { CalendarIcon, XMarkIcon } from '@heroicons/react/24/outline';

const DateRangeFilter = ({ onDateRangeChange, dateRange }) => {
  const [showCustom, setShowCustom] = useState(false);

  const predefinedRanges = [
    { label: 'Todos los registros', value: null },
    { label: 'Este mes', value: 'current_month' },
    { label: 'Mes pasado', value: 'last_month' },
    { label: 'Últimos 3 meses', value: 'last_3_months' },
    { label: 'Este año', value: 'current_year' },
    { label: 'Año pasado', value: 'last_year' },
    { label: 'Personalizado', value: 'custom' },
  ];

  const handleRangeSelection = (range) => {
    if (range.value === 'custom') {
      setShowCustom(true);
      return;
    }
    
    setShowCustom(false);
    onDateRangeChange(range.value);
  };

  const handleCustomDateChange = () => {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    if (startDate && endDate) {
      onDateRangeChange({
        type: 'custom',
        startDate,
        endDate
      });
      setShowCustom(false);
    }
  };

  const clearFilter = () => {
    onDateRangeChange(null);
    setShowCustom(false);
  };

  const getCurrentRangeLabel = () => {
    if (!dateRange) return 'Todos los registros';
    
    if (typeof dateRange === 'string') {
      const range = predefinedRanges.find(r => r.value === dateRange);
      return range ? range.label : 'Filtro aplicado';
    }
    
    if (dateRange.type === 'custom') {
      return `${dateRange.startDate} - ${dateRange.endDate}`;
    }
    
    return 'Filtro aplicado';
  };

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">
            Período:
          </span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {predefinedRanges.map((range) => (
            <button
              key={range.label}
              onClick={() => handleRangeSelection(range)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                (dateRange === range.value) || 
                (dateRange === null && range.value === null) ||
                (range.value === 'custom' && dateRange?.type === 'custom')
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        {dateRange && (
          <button
            onClick={clearFilter}
            className="px-2 py-1.5 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
          >
            <XMarkIcon className="h-4 w-4" />
            Limpiar
          </button>
        )}
      </div>

      {/* Selector de fechas personalizadas */}
      {showCustom && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de inicio
              </label>
              <input
                type="date"
                id="start-date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de fin
              </label>
              <input
                type="date"
                id="end-date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleCustomDateChange}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              Aplicar filtro
            </button>
            <button
              onClick={() => setShowCustom(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Mostrar el filtro actual */}
      <div className="mt-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">Mostrando datos para:</span> 
          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md">
            {getCurrentRangeLabel()}
          </span>
        </div>
        {dateRange && dateRange !== null && (
          <p className="text-xs text-gray-500 mt-1">
            Los datos de las tarjetas se actualizan automáticamente según el período seleccionado
          </p>
        )}
      </div>
    </div>
  );
};

export default DateRangeFilter;
