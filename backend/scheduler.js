const cron = require('node-cron');
const db = require('./config/database');

// Función para generar transacciones recurrentes
async function generateRecurringTransactions() {
    try {
        console.log('🔄 Iniciando generación de transacciones recurrentes...');
        
        const result = await db.query('SELECT generate_recurring_transactions()');
        const generatedCount = result.rows[0].generate_recurring_transactions;
        
        if (generatedCount > 0) {
            console.log(`✅ Se generaron ${generatedCount} nuevas transacciones`);
        } else {
            console.log('ℹ️ No hay transacciones pendientes por generar');
        }
        
        return generatedCount;
    } catch (error) {
        console.error('❌ Error al generar transacciones recurrentes:', error);
        return 0;
    }
}

// Ejecutar evaluación personalizada de JavaScript (sandbox seguro)
async function executeCustomLogic(code, date, skipWeekends, skipHolidays) {
    try {
        // Por seguridad, por ahora solo permitimos validación sintáctica
        // En un entorno de producción, se recomendaría usar un sandbox más robusto
        // como vm2 o evaluar en un contenedor separado
        
        console.warn('⚠️ Lógica personalizada detectada - usando fecha original por seguridad');
        return new Date(date);
        
        // TODO: Implementar sandbox seguro en versión futura
        // Opciones: vm2, isolated-vm, o servicio separado con Docker
        
    } catch (error) {
        console.error('Error en lógica personalizada:', error);
        return new Date(date);
    }
}

// Programar la generación automática
function startRecurringJobScheduler() {
    // Ejecutar cada hora durante horarios laborables (7 AM - 10 PM)
    cron.schedule('0 7-22 * * *', async () => {
        await generateRecurringTransactions();
    }, {
        timezone: "America/Bogota"
    });
    
    // Ejecutar una vez al día a las 6 AM como respaldo
    cron.schedule('0 6 * * *', async () => {
        console.log('🌅 Generación diaria de transacciones recurrentes...');
        await generateRecurringTransactions();
    }, {
        timezone: "America/Bogota"
    });
    
    console.log('📅 Programador de transacciones recurrentes iniciado');
    console.log('⏰ Se ejecutará cada hora de 7 AM a 10 PM');
    console.log('🌅 Y una vez al día a las 6 AM como respaldo');
}

// Función para generar transacciones recurrentes con lógica personalizada mejorada
async function generateRecurringTransactionsWithCustomLogic() {
    try {
        console.log('🔄 Iniciando generación avanzada de transacciones recurrentes...');
        
        // Obtener series que requieren generación
        const seriesResult = await db.query(`
            SELECT * FROM recurring_series 
            WHERE is_active = TRUE 
            AND next_generation_date <= CURRENT_DATE
            AND (end_date IS NULL OR next_generation_date <= end_date)
        `);
        
        let generatedCount = 0;
        
        for (const series of seriesResult.rows) {
            try {
                let transactionDate = new Date(series.next_generation_date);
                
                // Aplicar lógica personalizada si está habilitada
                if (series.use_custom_logic && series.custom_logic) {
                    transactionDate = await executeCustomLogic(
                        series.custom_logic,
                        transactionDate,
                        series.skip_weekends,
                        series.skip_holidays
                    );
                }
                
                // Si no hay lógica personalizada, usar la función SQL
                const finalDateResult = await db.query(`
                    SELECT calculate_next_business_date($1, $2, $3) as final_date
                `, [
                    transactionDate.toISOString().split('T')[0],
                    series.skip_weekends,
                    series.skip_holidays
                ]);
                
                const finalDate = series.use_custom_logic ? 
                    transactionDate : new Date(finalDateResult.rows[0].final_date);
                
                // Crear la transacción
                await db.query(`
                    INSERT INTO transactions (
                        user_id, account_id, category_id, description, amount, transaction_type,
                        transaction_date, frequency, is_recurring, recurring_series_id,
                        is_generated, generation_date, notes
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                `, [
                    series.user_id,
                    series.account_id,
                    series.category_id,
                    series.description,
                    series.amount,
                    series.transaction_type,
                    finalDate.toISOString().split('T')[0],
                    series.recurrence_type === 'custom' ? 
                        `custom-${series.frequency_interval}-${series.frequency_type}` : 
                        series.frequency_type,
                    true,
                    series.id,
                    true,
                    new Date(),
                    series.notes
                ]);
                
                // Calcular próxima fecha de generación
                let nextDate = new Date(series.next_generation_date);
                
                switch (series.frequency_type) {
                    case 'daily':
                        nextDate.setDate(nextDate.getDate() + series.frequency_interval);
                        break;
                    case 'weekly':
                        nextDate.setDate(nextDate.getDate() + (series.frequency_interval * 7));
                        break;
                    case 'monthly':
                        nextDate.setMonth(nextDate.getMonth() + series.frequency_interval);
                        break;
                    case 'yearly':
                        nextDate.setFullYear(nextDate.getFullYear() + series.frequency_interval);
                        break;
                    default:
                        // Si no hay tipo válido, usar frecuencia diaria por defecto
                        nextDate.setDate(nextDate.getDate() + (series.frequency_interval || 1));
                        console.warn(`Tipo de frecuencia desconocido para serie ${series.id}: ${series.frequency_type}`);
                        break;
                }
                
                // Actualizar la serie con la próxima fecha
                await db.query(`
                    UPDATE recurring_series 
                    SET next_generation_date = $1, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $2
                `, [
                    nextDate.toISOString().split('T')[0],
                    series.id
                ]);
                
                generatedCount++;
                
            } catch (seriesError) {
                console.error(`Error procesando serie ${series.id}:`, seriesError);
            }
        }
        
        if (generatedCount > 0) {
            console.log(`✅ Se generaron ${generatedCount} nuevas transacciones con lógica avanzada`);
        } else {
            console.log('ℹ️ No hay transacciones pendientes por generar');
        }
        
        return generatedCount;
    } catch (error) {
        console.error('❌ Error en generación avanzada:', error);
        return 0;
    }
}

// Función para limpiar transacciones antiguas (opcional)
async function cleanupOldTransactions() {
    try {
        // Eliminar transacciones generadas automáticamente de hace más de 2 años
        const result = await db.query(`
            DELETE FROM transactions 
            WHERE is_generated = TRUE 
            AND transaction_date < CURRENT_DATE - INTERVAL '2 years'
        `);
        
        if (result.rowCount > 0) {
            console.log(`🧹 Se limpiaron ${result.rowCount} transacciones antiguas`);
        }
        
        return result.rowCount;
    } catch (error) {
        console.error('❌ Error en limpieza:', error);
        return 0;
    }
}

// Programar limpieza mensual
function startCleanupScheduler() {
    // Primer día de cada mes a las 2 AM
    cron.schedule('0 2 1 * *', async () => {
        console.log('🧹 Iniciando limpieza mensual...');
        await cleanupOldTransactions();
    }, {
        timezone: "America/Bogota"
    });
    
    console.log('🧹 Programador de limpieza mensual iniciado');
}

module.exports = {
    generateRecurringTransactions,
    generateRecurringTransactionsWithCustomLogic,
    executeCustomLogic,
    startRecurringJobScheduler,
    startCleanupScheduler,
    cleanupOldTransactions
};
