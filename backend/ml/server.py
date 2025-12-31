"""
@file server.py
@brief Script para servir predicciones del modelo de Machine Learning.

Este script se invoca desde el backend (Node.js) para generar una predicción
de humedad del suelo. Recibe las características como argumentos de línea de
comandos, las preprocesa, carga el modelo entrenado y devuelve la predicción
en formato JSON.
"""

import sys
import os
import json
import pandas as pd
from utils import load_model, preprocess_data

# --- Definición de Rutas ---
# Directorio base del módulo de Machine Learning.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Ruta del modelo serializado.
MODEL_PATH = os.path.join(BASE_DIR, 'models', 'humidity_regressor.pkl')

def predict():
    """
    Realiza una predicción basada en los argumentos de línea de comandos.

    Los argumentos deben ser 7 valores numéricos en el siguiente orden:
    humidity_percent, raw_value, rssi, voltage, sampling_interval, hour, day_of_week.

    Imprime el resultado de la predicción o un error en formato JSON.
    """
    # El script es el argumento 0, por lo que se esperan 8 argumentos en total.
    if len(sys.argv) < 8:
        error_msg = {"error": "Argumentos insuficientes. Se requieren 7 variables."}
        print(json.dumps(error_msg))
        sys.exit(1)

    try:
        # Construye un diccionario con los argumentos de entrada.
        input_dict = {
            'humidity_percent': float(sys.argv[1]),
            'raw_value': float(sys.argv[2]),
            'rssi': float(sys.argv[3]),
            'voltage': float(sys.argv[4]),
            'sampling_interval': int(sys.argv[5]),
            'hour': int(sys.argv[6]),
            'day_of_week': int(sys.argv[7])
        }

        # Crea un DataFrame de pandas a partir del diccionario.
        input_df = pd.DataFrame([input_dict])

        # Preprocesa los datos de entrada para que coincidan con el formato de entrenamiento.
        X_new = preprocess_data(input_df, is_training=False)
        
        # Carga el modelo de regresión entrenado.
        model = load_model(MODEL_PATH)

        # Genera la predicción.
        prediction = model.predict(X_new)

        # Formatea y devuelve el resultado como JSON.
        result = {
            "humidity_future_prediction": float(prediction[0]),
            "status": "success"
        }
        print(json.dumps(result))

    except Exception as e:
        # Captura cualquier excepción y la devuelve como un error JSON.
        print(json.dumps({"error": str(e), "status": "failed"}))
        sys.exit(1)

if __name__ == "__main__":
    predict()