"""
@file utils.py
@brief Funciones de utilidad para el pipeline de Machine Learning.
"""

import pandas as pd
import joblib
import os
import json

def load_dataset(filepath):
    """Carga un dataset desde un archivo CSV."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"El archivo de datos no se encontró en: {filepath}")
    return pd.read_csv(filepath)

def preprocess_data(df, is_training=True):
    """
    Preprocesa los datos para entrenamiento o inferencia.
    - Extrae características temporales (hora, día de la semana).
    - Si es entrenamiento, genera la variable objetivo ('humidity_future')
      desplazando la humedad para predecir la siguiente lectura de cada nodo.
    """
    # Ingeniería de características temporales
    if 'sensor_timestamp' in df.columns:
        df['sensor_timestamp'] = pd.to_datetime(df['sensor_timestamp'])
        df['hour'] = df['sensor_timestamp'].dt.hour
        df['day_of_week'] = df['sensor_timestamp'].dt.dayofweek

    # Lista de características que usará el modelo
    features = [
        'humidity_percent', 
        'raw_value', 
        'rssi', 
        'voltage', 
        'sampling_interval', 
        'hour', 
        'day_of_week'
    ]

    # Asegura que todas las columnas de features existan para evitar errores en inferencia.
    for col in features:
        if col not in df.columns:
            df[col] = 0

    if is_training:
        # Ordena por nodo y fecha para que el `shift` sea correcto.
        df = df.sort_values(by=['node_id', 'sensor_timestamp'])
        
        # Genera el target: la humedad de la siguiente lectura para el mismo nodo.
        df['humidity_future'] = df.groupby('node_id')['humidity_percent'].shift(-1)
        
        # Elimina la última lectura de cada nodo, ya que no tiene un "futuro" que predecir.
        df = df.dropna(subset=['humidity_future'])
        
        X = df[features]
        y = df['humidity_future']
        return X, y
    else:
        # Para inferencia, solo devuelve las features en el formato correcto.
        return df[features]

def save_model(model, filepath):
    """Guarda (serializa) un modelo entrenado en un archivo .pkl."""
    directory = os.path.dirname(filepath)
    if not os.path.exists(directory):
        os.makedirs(directory, exist_ok=True)
    joblib.dump(model, filepath)
    print(f"Modelo guardado en: {filepath}")

def load_model(filepath):
    """Carga (deserializa) un modelo desde un archivo .pkl."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"No se encontró el modelo en {filepath}")
    return joblib.load(filepath)

def save_metrics(metrics, filepath):
    """Guarda un diccionario de métricas en un archivo JSON."""
    directory = os.path.dirname(filepath)
    if directory and not os.path.exists(directory):
        os.makedirs(directory, exist_ok=True)
        
    with open(filepath, 'w') as f:
        json.dump(metrics, f, indent=4)
    print(f"Métricas guardadas en: {filepath}")