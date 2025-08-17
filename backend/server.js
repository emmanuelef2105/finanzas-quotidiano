const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs').promises;
const path = require('path');
// const rateLimit = require('express-rate-limit'); // Deshabilitado para desarrollo
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Verificar conexión a base de datos al inicio
const db = require('./config/database');

async function testDatabaseConnection() {
    try {
        await db.query('SELECT NOW()');
        console.log('✅ Conexión a base de datos verificada');
    } catch (error) {
        console.error('❌ Error al conectar con la base de datos:', error);
        process.exit(1);
    }
}

async function runMigrations() {
    try {
        const fs = require('fs').promises;
        const path = require('path');
        
        // Crear tabla de migraciones si no existe
        await db.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(255) UNIQUE NOT NULL,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Obtener migraciones ya ejecutadas
        const executedResult = await db.query('SELECT filename FROM migrations');
        const executedMigrations = executedResult.rows.map(row => row.filename);
        
        // Buscar archivos de migración
        const migrationsDir = path.join(__dirname, 'migrations');
        
        try {
            const migrationFiles = await fs.readdir(migrationsDir);
            const sqlFiles = migrationFiles
                .filter(file => file.endsWith('.sql'))
                .sort(); // Ejecutar en orden alfabético
            
            for (const filename of sqlFiles) {
                if (!executedMigrations.includes(filename)) {
                    console.log(`🔄 Ejecutando migración: ${filename}`);
                    
                    const filePath = path.join(migrationsDir, filename);
                    const sql = await fs.readFile(filePath, 'utf8');
                    
                    // Ejecutar la migración
                    await db.query(sql);
                    
                    // Marcar como ejecutada
                    await db.query(
                        'INSERT INTO migrations (filename) VALUES ($1)',
                        [filename]
                    );
                    
                    console.log(`✅ Migración completada: ${filename}`);
                }
            }
            
            console.log('✅ Todas las migraciones completadas');
        } catch (dirError) {
            console.log('📁 Directorio migrations no encontrado, saltando migraciones');
        }
        
    } catch (error) {
        console.error('❌ Error ejecutando migraciones:', error);
    }
}

// Middlewares de seguridad
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Rate limiting - DESHABILITADO para desarrollo
// const limiter = rateLimit({
//     windowMs: 1 * 60 * 1000, // 1 minuto en desarrollo
//     max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 1000 requests en desarrollo, 100 en producción
//     message: {
//         error: 'Demasiadas peticiones desde esta IP, por favor intenta de nuevo más tarde.',
//         retryAfter: '1 minuto'
//     },
//     standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
//     legacyHeaders: false, // Disable the `X-RateLimit-*` headers
// });

// Solo aplicar rate limiting si no estamos en modo desarrollo
// if (process.env.NODE_ENV === 'production') {
//     app.use(limiter);
// } else {
//     console.log('🚧 Rate limiting deshabilitado en modo desarrollo');
// }

console.log('🚧 Rate limiting completamente deshabilitado para desarrollo');

// Middleware para parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Importar rutas
const accountRoutes = require('./routes/accounts');
const transactionRoutes = require('./routes/transactions');
const debtRoutes = require('./routes/debts');
const investmentRoutes = require('./routes/investments');
const dashboardRoutes = require('./routes/dashboard');
const recurringRoutes = require('./routes/recurring');

// Usar rutas
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/recurring', recurringRoutes);

// Ruta de salud
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Algo salió mal!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor'
    });
});

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

app.listen(PORT, async () => {
    console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
    console.log(`📊 Modo: ${process.env.NODE_ENV || 'development'}`);
    
    // Verificar conexión a base de datos
    await testDatabaseConnection();
    
    // Ejecutar migraciones
    await runMigrations();
    
    // TODO: Iniciar el programador de transacciones recurrentes después de instalar node-cron
    // const scheduler = require('./scheduler');
    // scheduler.startRecurringJobScheduler();
    // scheduler.startCleanupScheduler();
    
    console.log('✅ Servidor completamente iniciado');
});
