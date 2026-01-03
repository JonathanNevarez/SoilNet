/**
 * Umbrales de humedad (%) por tipo de suelo.
 * Centralizado para uso en lógica de negocio y alertas.
 * Debe mantenerse sincronizado con el frontend.
 */
const SOIL_THRESHOLDS = {
  SANDY: { dry: 10, medium_max: 20, optimal_max: 30, excess: 30 }, // Arenoso
  LOAM:  { dry: 15, medium_max: 30, optimal_max: 40, excess: 40 }, // Franco
  CLAY:  { dry: 25, medium_max: 40, optimal_max: 50, excess: 50 }  // Arcilloso
};

module.exports = { SOIL_THRESHOLDS };
