# Arquitectura de Consultas SQL Centralizadas

## Descripción General

Este documento explica la nueva arquitectura implementada para centralizar y organizar las consultas SQL del proyecto, siguiendo las mejores prácticas de desarrollo de software.

## Estructura de Archivos

```
backend/
├── queries/                    # Consultas SQL centralizadas
│   ├── index.js               # Archivo índice que exporta todas las consultas
│   ├── accounts.sql.js        # Consultas de cuentas
│   ├── transactions.sql.js    # Consultas de transacciones
│   ├── dashboard.sql.js       # Consultas del dashboard
│   ├── recurring.sql.js       # Consultas de transacciones recurrentes
│   ├── investments.sql.js     # Consultas de inversiones
│   └── debts.sql.js          # Consultas de deudas
├── services/                  # Capa de lógica de negocio
│   ├── AccountsService.js     # Servicio de cuentas (ejemplo implementado)
│   └── ...                    # Otros servicios por implementar
└── routes/                    # Rutas HTTP (solo lógica de endpoints)
    ├── accounts.js            # Rutas de cuentas (refactorizado)
    └── ...                    # Otras rutas
```

## Ventajas de la Nueva Arquitectura

### 1. **Mantenibilidad**
- ✅ Consultas organizadas por módulo
- ✅ Cambios en BD solo requieren modificar archivos de queries
- ✅ Fácil localización de consultas específicas

### 2. **Reutilización**
- ✅ Evita duplicación de consultas similares
- ✅ Consultas complejas pueden ser reutilizadas en múltiples servicios
- ✅ Fácil compartir lógica entre diferentes endpoints

### 3. **Testing**
- ✅ Servicios pueden ser testeados independientemente
- ✅ Consultas pueden ser verificadas por separado
- ✅ Mock de base de datos más sencillo

### 4. **Legibilidad**
- ✅ Código de rutas enfocado en lógica HTTP
- ✅ Servicios enfocados en lógica de negocio
- ✅ Consultas SQL bien documentadas y organizadas

### 5. **Escalabilidad**
- ✅ Fácil agregar nuevas consultas
- ✅ Arquitectura preparada para múltiples bases de datos
- ✅ Separación clara de responsabilidades

## Cómo Usar

### 1. Usando Consultas Directamente

```javascript
const db = require('../config/database');
const queries = require('../queries');

// Forma básica
const result = await db.query(queries.accounts.GET_ALL_ACTIVE);

// Con parámetros
const result = await db.query(
    queries.accounts.GET_BY_ID, 
    [accountId]
);
```

### 2. Usando Servicios (Recomendado)

```javascript
const AccountsService = require('../services/AccountsService');

// En una ruta
router.get('/', async (req, res) => {
    try {
        const accounts = await AccountsService.getAllAccounts();
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

## Patrones Implementados

### 1. **Repository Pattern**
Los archivos en `/queries/` actúan como repositorios que encapsulan el acceso a datos.

### 2. **Service Layer Pattern**
Los archivos en `/services/` contienen la lógica de negocio y coordinan las consultas.

### 3. **Dependency Injection**
Las rutas dependen de servicios, los servicios dependen de queries.

## Migración de Código Existente

### Antes (Código Disperso):
```javascript
// En routes/accounts.js
const result = await db.query(`
    SELECT id, name, current_balance 
    FROM accounts 
    WHERE is_active = true 
    ORDER BY created_at DESC
`);
```

### Después (Centralizado):
```javascript
// En queries/accounts.sql.js
GET_ALL_ACTIVE: `
    SELECT id, name, initial_balance, current_balance, account_type, is_active, created_at
    FROM accounts 
    WHERE is_active = true 
    ORDER BY created_at DESC
`,

// En services/AccountsService.js
async getAllAccounts() {
    const result = await db.query(queries.accounts.GET_ALL_ACTIVE);
    return result.rows;
}

// En routes/accounts.js
const accounts = await AccountsService.getAllAccounts();
```

## Convenciones de Nomenclatura

### Consultas SQL:
- **GET_**: Para consultas SELECT
- **CREATE_**: Para consultas INSERT
- **UPDATE_**: Para consultas UPDATE
- **DELETE_**: Para consultas DELETE
- **CHECK_**: Para validaciones
- **COUNT_**: Para conteos

Ejemplos:
- `GET_ALL_ACTIVE`
- `CREATE_ACCOUNT`
- `UPDATE_BALANCE`
- `CHECK_TRANSACTIONS_EXISTS`

### Servicios:
- Usar PascalCase: `AccountsService`
- Métodos en camelCase: `getAllAccounts()`
- Métodos descriptivos: `checkAccountHasTransactions()`

## Próximos Pasos para Completar la Migración

1. **Crear servicios faltantes:**
   - TransactionsService.js
   - DashboardService.js
   - RecurringService.js
   - InvestmentsService.js
   - DebtsService.js

2. **Refactorizar archivos de rutas:**
   - transactions.js
   - dashboard.js
   - recurring.js
   - investments.js
   - debts.js

3. **Migrar scheduler.js** para usar la nueva arquitectura

4. **Añadir tests unitarios** para servicios y consultas

## Ejemplo Completo: AccountsService

El archivo `AccountsService.js` ya está implementado como ejemplo y muestra:
- ✅ Manejo de errores consistente
- ✅ Validaciones de negocio
- ✅ Uso de consultas centralizadas
- ✅ API clara y documentada
- ✅ Separación de responsabilidades

## Beneficios Inmediatos

Con esta nueva arquitectura ya implementada para cuentas:

1. **Mantenimiento más fácil**: Cambiar una consulta de cuenta solo requiere editar un archivo
2. **Código más limpio**: Las rutas son más legibles y enfocadas
3. **Testing más sencillo**: Se puede testear la lógica de negocio independientemente
4. **Menos errores**: Consultas reutilizables reducen duplicación y errores de tipeo
5. **Documentación natural**: Las consultas están claramente nombradas y organizadas

## Conclusión

Esta arquitectura transforma el código de:
```javascript
// Antes: 120+ líneas con SQL embebido
router.get('/', async (req, res) => {
    const result = await db.query(`SELECT...`); // SQL inline
    // lógica mezclada
});
```

A:
```javascript
// Después: Código limpio y mantenible
router.get('/', async (req, res) => {
    const accounts = await AccountsService.getAllAccounts();
    res.json(accounts);
});
```

Esta es una mejora significativa en la organización y mantenibilidad del código. 🚀
