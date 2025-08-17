const getDateRangeFilter = (dateRange) => {
  if (!dateRange || dateRange === 'null') {
    return { whereClause: '', params: [] };
  }

  let parsedRange;
  try {
    parsedRange = typeof dateRange === 'string' ? JSON.parse(dateRange) : dateRange;
  } catch (error) {
    console.log('Error parsing date range:', error);
    return { whereClause: '', params: [] };
  }

  const currentDate = new Date();
  let startDate, endDate;

  switch (parsedRange) {
    case 'current_month':
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      break;
    
    case 'last_month':
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
      break;
    
    case 'last_3_months':
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, 1);
      endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      break;
    
    case 'current_year':
      startDate = new Date(currentDate.getFullYear(), 0, 1);
      endDate = new Date(currentDate.getFullYear(), 11, 31);
      break;
    
    case 'last_year':
      startDate = new Date(currentDate.getFullYear() - 1, 0, 1);
      endDate = new Date(currentDate.getFullYear() - 1, 11, 31);
      break;
    
    default:
      if (parsedRange && parsedRange.type === 'custom' && parsedRange.startDate && parsedRange.endDate) {
        startDate = new Date(parsedRange.startDate);
        endDate = new Date(parsedRange.endDate);
        endDate.setHours(23, 59, 59, 999); // Final del día
      } else {
        return { whereClause: '', params: [] };
      }
  }

  const whereClause = 'AND transaction_date >= $? AND transaction_date <= $?';
  const params = [startDate.toISOString(), endDate.toISOString()];

  return { whereClause, params };
};

const applyDateRangeToQuery = (baseQuery, dateRange, existingParams = []) => {
  const dateFilter = getDateRangeFilter(dateRange);
  
  if (!dateFilter.whereClause) {
    return { query: baseQuery, params: existingParams };
  }

  // Reemplazar los marcadores de posición $? con los números de parámetros correctos
  let paramIndex = existingParams.length + 1;
  const whereClause = dateFilter.whereClause.replace(/\$\?/g, () => `$${paramIndex++}`);
  
  const query = baseQuery.replace(/WHERE/, `WHERE 1=1 ${whereClause} AND`);
  const params = [...existingParams, ...dateFilter.params];

  return { query, params };
};

module.exports = {
  getDateRangeFilter,
  applyDateRangeToQuery
};
