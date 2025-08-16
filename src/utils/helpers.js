// Formatear moneda en pesos colombianos
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

// Formatear fecha en formato local colombiano
export const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('es-CO', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

// Formatear fecha para input HTML
export const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

// Obtener fecha actual en formato YYYY-MM-DD
export const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0];
};

// Formatear porcentaje
export const formatPercentage = (value) => {
  return `${(value || 0).toFixed(2)}%`;
};

// Calcular diferencia en días entre dos fechas
export const daysDifference = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000;
  const firstDate = new Date(date1);
  const secondDate = new Date(date2);
  
  return Math.round(Math.abs((firstDate - secondDate) / oneDay));
};

// Validar email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validar teléfono colombiano
export const isValidPhone = (phone) => {
  const phoneRegex = /^(\+57|57)?[1-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Generar ID único simple
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Truncar texto
export const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Capitalizar primera letra
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Debounce para búsquedas
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Formatear número con separadores de miles
export const formatNumber = (number) => {
  return new Intl.NumberFormat('es-CO').format(number || 0);
};

// Calcular color basado en un string (para avatares, etc.)
export const getColorFromString = (str) => {
  const colors = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
    '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
    '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
    '#EC4899', '#F43F5E'
  ];
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// Exportar imagen como PNG usando html2canvas
export const exportAsPNG = async (elementId, filename = 'export.png') => {
  try {
    const html2canvas = (await import('html2canvas')).default;
    const element = document.getElementById(elementId);
    
    if (!element) {
      throw new Error(`Elemento con ID ${elementId} no encontrado`);
    }
    
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2, // Mayor calidad
      logging: false,
      allowTaint: true,
      useCORS: true,
    });
    
    // Crear enlace de descarga
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    
    // Simular click para descargar
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error('Error al exportar imagen:', error);
    return false;
  }
};
