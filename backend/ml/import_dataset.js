const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Reading = require('../models/Reading');

// Cargar variables de entorno (.env en backend/)
require('dotenv').config({
  path: path.join(__dirname, '..', '.env')
});

async function importCSV() {
  try {
    console.log('Conectando a MongoDB Atlas...');

    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI no definida en backend/.env');
    }

    await mongoose.connect(process.env.MONGO_URI, {
      dbName: 'SoilNet'
    });

    console.log('Conectado a MongoDB');

    // Ruta REAL del CSV
    const csvPath = path.join(__dirname, 'in', 'soil_readings.csv');
    console.log('Leyendo CSV:', csvPath);

    if (!fs.existsSync(csvPath)) {
      throw new Error('El archivo CSV no existe');
    }

    const fileContent = fs.readFileSync(csvPath, 'utf8');

    const lines = fileContent
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length < 2) {
      console.log('CSV vacío o sin datos');
      return;
    }

    console.log(`Registros encontrados: ${lines.length - 1}`);

    const readingsToInsert = [];

    // Saltar cabecera
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');

      if (values.length < 7) {
        console.warn('Línea inválida, se omite:', lines[i]);
        continue;
      }

      const sensorTimestamp = new Date(values[1]);

      if (isNaN(sensorTimestamp.getTime())) {
        console.warn('Fecha inválida, se omite:', values[1]);
        continue;
      }

      readingsToInsert.push({
        node_id: values[0].trim().toUpperCase(),
        sensor_timestamp: sensorTimestamp,
        humidity_percent: Number(values[2]),
        raw_value: Number(values[3]),
        rssi: Number(values[4]),
        voltage: Number(values[5]),
        sampling_interval: Number(values[6])
      });
    }

    if (readingsToInsert.length === 0) {
      console.log('No hay documentos válidos para insertar');
      return;
    }

    console.log(`Insertando ${readingsToInsert.length} documentos...`);

    const result = await Reading.insertMany(readingsToInsert, {
      ordered: false
    });

    console.log(`Importación exitosa: ${result.length} documentos`);

  } catch (error) {
    console.error('Error durante la importación:');
    console.error(error.message || error);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado de MongoDB');
  }
}

// Ejecutar
importCSV();
