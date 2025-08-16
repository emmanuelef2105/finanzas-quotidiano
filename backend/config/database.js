// Configuración de PostgreSQL
const { Pool } = require('pg');

console.log('Configurando PostgreSQL...');
console.log('DATABASE_URL:', process.env.DATABASE_URL);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://finanzas_user:finanzas_password@db:5432/finanzas_db',
    ssl: false
});

// Verificar conexión
pool.on('connect', () => {
    console.log('✅ Conectado a PostgreSQL exitosamente');
});

pool.on('error', (err) => {
    console.error('❌ Error en conexión a PostgreSQL:', err);
    process.exit(1);
});

const db = {
    query: (text, params) => pool.query(text, params),
    pool
};

module.exports = db;
