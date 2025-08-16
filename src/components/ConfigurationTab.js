import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  TrashIcon, 
  PencilIcon, 
  CogIcon, 
  TagIcon, 
  BuildingLibraryIcon 
} from '@heroicons/react/24/outline';
import { transactionsAPI, configurationAPI } from '../services/financeAPI';

const ConfigurationTab = () => {
  const [activeSection, setActiveSection] = useState('categories');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    type: 'expense',
    color: '#6B7280'
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await transactionsAPI.getCategories();
      setCategories(response.data);
    } catch (err) {
      const errorMessage = err.code === 'ERR_NETWORK' 
        ? 'Error de conexión: Verifica que el backend esté funcionando'
        : 'Error al cargar categorías';
      setError(errorMessage);
      console.error('Error detallado:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    try {
      setError(null); // Limpiar errores previos
      
      if (editingItem) {
        const response = await configurationAPI.updateCategory(editingItem.id, categoryForm);
        setCategories(prev => prev.map(cat => 
          cat.id === editingItem.id ? response.data : cat
        ));
      } else {
        const response = await configurationAPI.createCategory(categoryForm);
        setCategories(prev => [...prev, response.data]);
      }
      resetCategoryForm();
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error al guardar categoría';
      setError(errorMessage);
      console.error(err);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta categoría? Esto podría afectar transacciones existentes.')) return;
    
    try {
      await configurationAPI.deleteCategory(id);
      setCategories(prev => prev.filter(cat => cat.id !== id));
    } catch (err) {
      setError('Error al eliminar categoría');
      console.error(err);
    }
  };

  const handleEditCategory = (category) => {
    setEditingItem(category);
    setCategoryForm({
      name: category.name,
      type: category.type,
      color: category.color || '#6B7280'
    });
    setShowForm(true);
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      type: 'expense',
      color: '#6B7280'
    });
    setEditingItem(null);
    setShowForm(false);
  };

  const colorOptions = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E',
    '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E', '#6B7280'
  ];

  const sections = [
    { id: 'categories', label: 'Categorías', icon: TagIcon },
    { id: 'accounts', label: 'Configuración de Cuentas', icon: BuildingLibraryIcon },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-500">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <CogIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Configuración del Sistema</h2>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Administra las categorías, cuentas y otros aspectos de tu sistema de finanzas
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" role="tablist">
            {sections.map((section) => {
              const IconComponent = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center space-x-2 ${
                    activeSection === section.id
                      ? 'border-blue-500 text-blue-600 font-semibold'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  role="tab"
                  aria-selected={activeSection === section.id}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{section.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-600">{error}</div>
          </div>
        )}

        {/* Categories Section */}
        {activeSection === 'categories' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Gestión de Categorías</h3>
                <p className="text-sm text-gray-600">Administra las categorías para tus ingresos y gastos</p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nueva Categoría
              </button>
            </div>

            {/* Category Form */}
            {showForm && (
              <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-md font-medium text-gray-900 mb-4">
                  {editingItem ? 'Editar Categoría' : 'Nueva Categoría'}
                </h4>
                <form onSubmit={handleSubmitCategory} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo
                    </label>
                    <select
                      value={categoryForm.type}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, type: e.target.value }))}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="income">Ingreso</option>
                      <option value="expense">Gasto</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={categoryForm.color}
                        onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                        className="h-10 w-16 rounded-md border border-gray-300 cursor-pointer"
                      />
                      <div className="flex flex-wrap gap-1">
                        {colorOptions.map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setCategoryForm(prev => ({ ...prev, color }))}
                            className={`w-6 h-6 rounded-full border-2 ${
                              categoryForm.color === color ? 'border-gray-400' : 'border-gray-200'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-end space-x-2">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      {editingItem ? 'Actualizar' : 'Crear'}
                    </button>
                    <button
                      type="button"
                      onClick={resetCategoryForm}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Categories List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Income Categories */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  Categorías de Ingresos
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    {categories.filter(cat => cat.type === 'income').length}
                  </span>
                </h4>
                <div className="space-y-2">
                  {categories.filter(cat => cat.type === 'income').map(category => (
                    <div key={category.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-200" 
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="Editar categoría"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          title="Eliminar categoría"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {categories.filter(cat => cat.type === 'income').length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No hay categorías de ingresos
                    </div>
                  )}
                </div>
              </div>

              {/* Expense Categories */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  Categorías de Gastos
                  <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                    {categories.filter(cat => cat.type === 'expense').length}
                  </span>
                </h4>
                <div className="space-y-2">
                  {categories.filter(cat => cat.type === 'expense').map(category => (
                    <div key={category.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-200" 
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="Editar categoría"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          title="Eliminar categoría"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {categories.filter(cat => cat.type === 'expense').length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No hay categorías de gastos
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Accounts Configuration Section */}
        {activeSection === 'accounts' && (
          <div className="p-6">
            <div className="text-center py-8">
              <BuildingLibraryIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Configuración de Cuentas</h3>
              <p className="mt-1 text-sm text-gray-500">
                Esta sección permitirá configurar tipos de cuentas, bancos predefinidos, etc.
              </p>
              <p className="mt-2 text-xs text-blue-600">
                💡 Por ahora, puedes gestionar tus cuentas desde la pestaña "Cuentas"
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigurationTab;
