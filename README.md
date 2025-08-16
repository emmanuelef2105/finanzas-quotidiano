# 💰 Finanzas Quotidiano

Una aplicación moderna de gestión de finanzas personales construida con React, Node.js, Express y PostgreSQL. Permite gestionar transacciones, cuentas, deudas e inversiones de manera integral.

## 🚀 Características

- **Dashboard en tiempo real** con métricas financieras clave
- **Gestión de transacciones** (ingresos y gastos) con categorización
- **Control de cuentas bancarias** múltiples con balances automáticos
- **Seguimiento de deudas** tanto por cobrar como por pagar
- **Portafolio de inversiones** con cálculo de rendimientos
- **Interfaz moderna** con Tailwind CSS
- **Base de datos robusta** con PostgreSQL
- **Dockerizado** para fácil despliegue
- **API RESTful** completa

## 🏗️ Arquitectura

```
finanzas/
├── frontend/          # Aplicación React
├── backend/           # API Node.js/Express
├── database/          # Scripts SQL de PostgreSQL
└── docker-compose.yml # Orquestación de contenedores
```

## 🛠️ Tecnologías

### Frontend
- **React 18** con Hooks
- **Tailwind CSS** para estilos
- **Heroicons** para iconografía
- **Axios** para llamadas HTTP
- **html2canvas** para exportación de datos

### Backend  
- **Node.js** con Express
- **PostgreSQL** como base de datos
- **CORS** para comunicación cross-origin
- **Helmet** para seguridad
- **Rate limiting** para protección API

### DevOps
- **Docker & Docker Compose** para contenedores
- **PostgreSQL 15** en contenedor
- **Hot reload** en desarrollo

## 🚀 Instalación y Uso

### Prerrequisitos
- Docker y Docker Compose instalados
- Git

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd finanzas-quotidiano/finanzas
```

### 2. Iniciar con Docker Compose
```bash
docker-compose up --build
```

Esto iniciará:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000  
- **PostgreSQL**: puerto 5432

### 3. Desarrollo local (opcional)

Si prefieres ejecutar sin Docker:

#### Backend:
```bash
cd backend
npm install
npm run dev
```

#### Frontend:
```bash
cd ..  # volver al directorio raíz
npm install
npm start
```

## 📊 Funcionalidades Principales

### 🏦 Gestión de Cuentas
- Crear múltiples cuentas (corriente, ahorros, efectivo, etc.)
- Seguimiento automático de balances
- Tipos de cuenta configurables

### 💳 Transacciones
- Registro de ingresos y gastos
- Categorización automática
- Frecuencias (una vez, diario, semanal, mensual, anual)
- Filtros avanzados y búsqueda

### 💰 Control de Deudas
- **Me deben**: Seguimiento de dinero por cobrar
- **Yo debo**: Control de deudas personales
- Registro de pagos parciales
- Exportación de estados de cuenta
- Alertas de vencimientos

### 📈 Inversiones
- Portafolio de inversiones diversificado
- Cálculo de rendimientos proyectados
- Múltiples tipos: acciones, bonos, crypto, etc.
- Liquidación con registro de ganancias/pérdidas

### 📊 Dashboard Analítico
- Métricas financieras en tiempo real
- Capital actual vs. balance neto
- Ingresos y gastos mensuales
- Evolución temporal de finanzas
- Alertas y notificaciones inteligentes

## 🗄️ Base de Datos

La aplicación usa PostgreSQL con las siguientes tablas principales:

- `accounts` - Cuentas bancarias
- `transactions` - Transacciones de ingresos/gastos
- `categories` - Categorías para transacciones
- `debtors` - Personas que me deben dinero
- `debt_items` - Artículos de deuda específicos
- `debt_payments` - Pagos recibidos de deudas
- `my_debts` - Mis deudas pendientes
- `investments` - Inversiones del portafolio

### Triggers Automáticos
- Actualización automática de balances de cuenta
- Registro de transacciones al recibir pagos de deudas
- Índices optimizados para consultas rápidas

## 🌐 API Endpoints

### Cuentas (`/api/accounts`)
- `GET /` - Listar cuentas
- `POST /` - Crear cuenta
- `PUT /:id` - Actualizar cuenta
- `DELETE /:id` - Eliminar cuenta

### Transacciones (`/api/transactions`)
- `GET /` - Listar transacciones (con paginación)
- `POST /` - Crear transacción
- `PUT /:id` - Actualizar transacción
- `DELETE /:id` - Eliminar transacción
- `GET /categories` - Obtener categorías

### Deudas (`/api/debts`)
- `GET /debtors` - Listar deudores
- `POST /debtors` - Crear deudor
- `POST /debtors/:id/items` - Agregar artículo de deuda
- `POST /debtors/:id/payments` - Registrar pago
- `GET /my-debts` - Listar mis deudas
- `POST /my-debts` - Crear mi deuda

### Inversiones (`/api/investments`)
- `GET /` - Listar inversiones
- `POST /` - Crear inversión
- `PUT /:id/liquidate` - Liquidar inversión
- `GET /summary` - Resumen de inversiones

### Dashboard (`/api/dashboard`)
- `GET /summary` - Métricas generales
- `GET /recent-transactions` - Transacciones recientes
- `GET /category-stats` - Estadísticas por categoría
- `GET /alerts` - Alertas y notificaciones

## 🔧 Configuración

### Variables de Entorno

#### Backend (.env)
```
DATABASE_URL=postgresql://finanzas_user:finanzas_password@db:5432/finanzas_db
NODE_ENV=development
PORT=5000
```

#### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000
```

### Docker Compose
El archivo `docker-compose.yml` está preconfigurado para desarrollo local con:
- Hot reload para ambos servicios
- Persistencia de datos de PostgreSQL
- Red interna para comunicación entre servicios

## 📱 Funcionalidades Avanzadas

### Exportación de Datos
- Exportar estados de cuenta como imágenes PNG
- Resúmenes visuales de deudas para compartir

### Análisis Financiero
- Evolución mensual de ingresos/gastos
- Análisis por categorías
- Alertas inteligentes (saldos bajos, deudas por vencer)
- Cálculo automático de patrimonio neto

### Responsive Design
- Interfaz optimizada para móvil y desktop
- Componentes adaptativos con Tailwind CSS
- Navegación por pestañas intuitiva

## 🚧 Desarrollo

### Scripts Disponibles

```bash
# Frontend
npm start          # Modo desarrollo
npm run build      # Build producción
npm test           # Ejecutar tests

# Backend  
npm run dev        # Desarrollo con nodemon
npm start          # Producción
npm test           # Ejecutar tests
```

### Estructura del Código

```
src/
├── components/     # Componentes React
├── hooks/          # Custom hooks
├── services/       # API calls
├── utils/          # Utilidades y helpers
└── App.js          # Componente principal
```

## 🤝 Contribuir

1. Fork del proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

Si encuentras algún problema o tienes sugerencias:
1. Revisa los issues existentes
2. Crea un nuevo issue con detalles del problema
3. Incluye logs de error si es aplicable

---

**Desarrollado con ❤️ para una gestión financiera personal eficiente**
