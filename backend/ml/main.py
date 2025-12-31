"""
@file main.py
@brief Script principal para el entrenamiento del modelo de Machine Learning.

Este script ejecuta el pipeline completo de entrenamiento:
1. Carga el dataset de lecturas de suelo.
2. Preprocesa los datos para generar características y la variable objetivo.
3. Evalúa el modelo usando validación cruzada para medir su rendimiento.
4. Entrena el modelo final con todo el conjunto de datos.
5. Guarda el modelo entrenado (serializado) y las métricas de evaluación.

Este script está diseñado para ser ejecutado periódicamente (ej. a través de un cron job)
para reentrenar el modelo con nuevos datos.
"""

import os
import sys
import datetime
from utils import load_dataset, preprocess_data, save_model, save_metrics
from models import SoilHumidityRegressor

# --- Definición de Rutas ---
# Directorio base del módulo de Machine Learning.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Ruta del archivo CSV de entrada que contiene los datos exportados de MongoDB.
DATA_PATH = os.path.join(BASE_DIR, 'in', 'soil_readings.csv')

# Ruta donde se guardará el modelo de regresión serializado (.pkl).
MODEL_PATH = os.path.join(BASE_DIR, 'models', 'humidity_regressor.pkl')

# Ruta para guardar las métricas de rendimiento del modelo en formato JSON.
METRICS_PATH = os.path.join(BASE_DIR, 'out', 'metrics.json')

def main():
    """
    Función principal que orquesta el pipeline de entrenamiento del modelo.
    """
    print("--- [ML] Iniciando Pipeline de Entrenamiento de SoilNet ---")

    # 1. Carga de Datos
    try:
        print(f"[1/5] Cargando dataset desde: {DATA_PATH}")
        df = load_dataset(DATA_PATH)
        print(f"-> Dataset cargado con {len(df)} registros.")
    except Exception as e:
        print(f"Error crítico al cargar los datos: {e}")
        sys.exit(1)

    # 2. Preprocesamiento de Datos
    print("[2/5] Preprocesando datos y generando variables...")
    X, y = preprocess_data(df, is_training=True)
    print(f"-> Datos procesados: {X.shape[0]} muestras listas para el entrenamiento.")

    # 3. Inicialización del Modelo
    print("[3/5] Inicializando el modelo de regresión...")
    regressor = SoilHumidityRegressor()

    # 4. Evaluación del Modelo (usando Validación Cruzada)
    print("[4/5] Evaluando el rendimiento del modelo con Cross-Validation...")
    metrics = regressor.evaluate(X, y)
    print(f"-> Resultados de validación: RMSE Promedio = {metrics['rmse_mean']:.4f} (+/- {metrics['rmse_std']:.4f})")
    
    # Se añaden metadatos adicionales al archivo de métricas para control de versiones.
    metrics['training_timestamp'] = datetime.datetime.now().isoformat()
    metrics['training_samples'] = len(X)
    metrics['model_path'] = MODEL_PATH
    metrics['data_path'] = DATA_PATH

    # 5. Entrenamiento del Modelo Final
    print("[5/5] Entrenando modelo final con el conjunto de datos completo...")
    regressor.train(X, y)

    # 6. Guardado de Artefactos (Modelo y Métricas)
    print("--- Guardando artefactos del entrenamiento ---")
    save_model(regressor.model, MODEL_PATH)
    save_metrics(metrics, METRICS_PATH)

    print("--- Pipeline de entrenamiento completado exitosamente ---")

if __name__ == "__main__":
    main()