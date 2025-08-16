# Sistema de Transacciones Recurrentes

Este sistema permite crear transacciones que se generan automáticamente según una frecuencia establecida, con opciones avanzadas como lógica personalizada y manejo de días laborables.

## Características

### 1. Frecuencias Disponibles
- **Una vez**: Transacción única (comportamiento original)
- **Predefinidas**: Diario, Semanal, Mensual, Anual
- **Personalizada**: Cada X días/semanas/meses/años (ej: cada 15 días, cada 3 meses)

### 2. Opciones Avanzadas
- **Evitar fines de semana**: Mueve la transacción al viernes anterior
- **Evitar días festivos**: Usa una tabla de festivos para ajustar fechas
- **Lógica personalizada**: Permite código JavaScript para casos especiales

### 3. Gestión de Series
- **Pausar/Reanudar**: Control sobre series activas
- **Edición flexible**: 
  - Solo configuración de la serie
  - Esta transacción y todas las futuras
  - Todas las transacciones de la serie

## Uso

### Crear Transacción Recurrente

1. Ve a la pestaña "Transacciones"
2. Selecciona una frecuencia diferente a "Una vez"
3. Si eliges "Personalizada":
   - Especifica el intervalo (número)
   - Selecciona el período (días/semanas/meses/años)
4. Opcional: Activa validaciones para días laborables
5. Opcional: Activa lógica personalizada para casos especiales

### Gestionar Series Recurrentes

1. Ve a la nueva pestaña "Transacciones Recurrentes"
2. Visualiza todas las series activas y pausadas
3. Edita series con diferentes opciones de aplicación
4. Pausa/reanuda series según necesidades
5. Genera transacciones pendientes manualmente

## Automatización

### Generación Automática
- **Cada hora**: De 7 AM a 10 PM (horario laboral)
- **Diaria**: 6 AM como respaldo
- **Manual**: Botón "Generar Pendientes"

### Limpieza Automática
- **Mensual**: Elimina transacciones generadas automáticamente de hace más de 2 años

## Ejemplos de Uso

### Salario Quincenal con Ajuste de Días Laborables

```javascript
// Configuración:
// - Frecuencia: Personalizada, cada 15 días
// - Evitar fines de semana: ✓
// - Lógica personalizada: ✓

// Código personalizado:
// Si cae en fin de semana, mover al viernes anterior
if (date.getDay() === 6) { // Sábado
    return new Date(date.getTime() - 24*60*60*1000); // Viernes
}
if (date.getDay() === 0) { // Domingo  
    return new Date(date.getTime() - 2*24*60*60*1000); // Viernes
}
return date;
```

### Renta Mensual

```javascript
// Configuración:
// - Frecuencia: Mensual
// - Sin opciones especiales
```

### Servicios Cada 2 Meses

```javascript
// Configuración:
// - Frecuencia: Personalizada, cada 2 meses
// - Período: Mes(es)
```

## API Endpoints

### Series Recurrentes
- `GET /api/recurring/series` - Obtener todas las series
- `POST /api/recurring/series` - Crear nueva serie
- `PUT /api/recurring/series/:id` - Actualizar serie
- `PATCH /api/recurring/series/:id/toggle` - Pausar/reanudar
- `GET /api/recurring/series/:id/transactions` - Transacciones de una serie

### Utilidades
- `POST /api/recurring/series/generate` - Generar transacciones pendientes
- `POST /api/recurring/validate-logic` - Validar lógica personalizada

## Estructura de Base de Datos

### Tabla `recurring_series`
- Configuración de cada serie recurrente
- Tipo de recurrencia (simple/personalizada)
- Frecuencia e intervalo
- Opciones de días laborables
- Lógica personalizada opcional

### Tabla `transactions` (modificada)
- Campo `recurring_series_id` para vincular con serie
- Campo `is_generated` para identificar transacciones automáticas
- Campo `generation_date` para auditoría

### Tabla `holidays`
- Días festivos por país
- Usado para validaciones de días laborables

## Seguridad

### Lógica Personalizada
- Validación sintáctica básica
- Lista negra de instrucciones peligrosas
- Sandbox deshabilitado por seguridad (versión futura con vm2)
- Timeout automático en ejecución

### Limitaciones Actuales
- Lógica personalizada usa fecha original por seguridad
- Se requiere implementación de sandbox seguro para producción
- Recomendación: usar contenedor Docker separado para evaluación

## Migración

Para aplicar las mejoras a tu base de datos existente:

```bash
# En tu terminal de PostgreSQL o Docker
cd backend/migrations
psql -U tu_usuario -d tu_database -f 001_recurring_transactions.sql
```

## Instalación de Dependencias

```bash
cd backend
npm install node-cron
```

## Notas Importantes

1. **Transacciones existentes**: No se ven afectadas por estos cambios
2. **Compatibilidad**: El sistema mantiene compatibilidad con transacciones únicas
3. **Performance**: Las consultas están optimizadas con índices apropiados
4. **Monitoreo**: Logs detallados para troubleshooting

## Próximas Mejoras

1. **Sandbox seguro**: Implementar vm2 o servicio separado
2. **Notificaciones**: Alertas cuando fallan generaciones
3. **Dashboard**: Métricas de transacciones recurrentes
4. **Plantillas**: Guardar configuraciones comunes
5. **Importar/Exportar**: Configuraciones de series
6. **API de festivos**: Integración con servicios externos
7. **Timezone**: Soporte para múltiples zonas horarias
