const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Reading = require('../models/Reading');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function generateCSV() {
    try {
        console.log('Conectando a MongoDB Atlas...');
        
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI no definida en .env");
        }

        await mongoose.connect(process.env.MONGO_URI, { dbName: 'SoilNet' });
        console.log('Conectado. Descargando lecturas...');

        // Obtener todos los documentos de la colección 'readings' en MongoDB
        const readings = await Reading.find({}).sort({ createdAt: 1 });

        if (readings.length === 0) {
            console.log('La colección "readings" está vacía.');
            return;
        }

        // Definir cabeceras (deben coincidir con lo que espera utils.py en Python)
        const headers = [
            'node_id',
            'createdAt',
            'humidity_percent',
            'raw_value',
            'rssi',
            'voltage',
            'sampling_interval'
        ];

        const rows = [];
        rows.push(headers.join(',')); // Agregar cabecera

        readings.forEach(data => {
            // Convertir Timestamp a ISO String para que Pandas lo entienda correctamente
            const dateStr = data.createdAt ? new Date(data.createdAt).toISOString() : '';

            const row = [
                data.node_id,
                dateStr,
                data.humidity_percent || 0,
                data.raw_value,
                data.rssi,
                data.voltage,
                data.sampling_interval
            ];

            rows.push(row.join(','));
        });

        // Guardar en backend/ml/in/soil_readings.csv
        const outputDir = path.join(__dirname, 'in');
        const outputPath = path.join(outputDir, 'soil_readings.csv');

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(outputPath, rows.join('\n'), 'utf8');
        console.log(`CSV generado exitosamente en: ${outputPath}`);
        console.log(`Total de registros exportados: ${readings.length}`);

    } catch (error) {
        console.error('Error exportando datos:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

generateCSV();