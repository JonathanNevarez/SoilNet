"""
@file models.py
@brief Define la clase del modelo de regresión para la humedad del suelo.
"""

from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import cross_val_score, KFold
from sklearn.metrics import mean_squared_error
import numpy as np

class SoilHumidityRegressor:
    """
    Clase que encapsula un modelo RandomForestRegressor para predecir la humedad del suelo.
    Proporciona métodos para entrenamiento, evaluación y predicción.
    """
    def __init__(self, n_estimators=100, max_depth=10, random_state=42):
        """Inicializa el regresor con hiperparámetros para RandomForest."""
        self.model = RandomForestRegressor(
            n_estimators=n_estimators,
            max_depth=max_depth,
            random_state=random_state,
            n_jobs=-1  # Usar todos los núcleos de CPU disponibles.
        )

    def train(self, X, y):
        """Entrena (ajusta) el modelo con los datos de entrenamiento."""
        self.model.fit(X, y)

    def evaluate(self, X, y, k_folds=5):
        """
        Evalúa el modelo usando validación cruzada (K-Fold).

        Calcula la raíz del error cuadrático medio (RMSE) para cada fold
        y retorna el promedio y la desviación estándar de esta métrica.
        """
        # Ajuste dinámico para evitar errores en datasets pequeños.
        if len(X) < k_folds:
            k_folds = len(X)
            if k_folds < 2:
                return {"rmse_mean": 0.0, "rmse_std": 0.0}

        kf = KFold(n_splits=k_folds, shuffle=True, random_state=42)
        
        # Scikit-learn usa el error cuadrático medio negativo como métrica de error.
        neg_mse_scores = cross_val_score(self.model, X, y, cv=kf, scoring='neg_mean_squared_error')
        
        # Se convierte el MSE negativo a RMSE positivo.
        rmse_scores = np.sqrt(-neg_mse_scores)
        
        return {
            "rmse_mean": float(np.mean(rmse_scores)),
            "rmse_std": float(np.std(rmse_scores))
        }

    def predict(self, X):
        """Realiza predicciones sobre nuevos datos."""
        return self.model.predict(X)