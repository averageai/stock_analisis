import { getProductosSinMovimiento } from '../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  try {
    const { sede, rango, modo, fechaInicio, fechaFin } = req.query;

    // Validar parámetros requeridos
    if (!sede || !['ladorada', 'manizales'].includes(sede)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Sede requerida: ladorada o manizales' 
      });
    }

    let rangoDias = 30;
    let fechaInicioAnalisis = null;
    let fechaFinAnalisis = null;

    if (modo === 'personalizado') {
      // Validar fechas personalizadas
      if (!fechaInicio || !fechaFin) {
        return res.status(400).json({ 
          success: false, 
          error: 'Fechas de inicio y fin requeridas para rango personalizado' 
        });
      }
      fechaInicioAnalisis = fechaInicio;
      fechaFinAnalisis = fechaFin;
    } else {
      // Rango predefinido
      rangoDias = parseInt(rango) || 30;
      if (![15, 30, 60, 90].includes(rangoDias)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Rango debe ser 15, 30, 60 o 90 días' 
        });
      }
    }

    // Obtener productos sin movimiento
    const productosSinMovimiento = await getProductosSinMovimiento(
      sede, 
      rangoDias, 
      fechaInicioAnalisis, 
      fechaFinAnalisis
    );

    return res.status(200).json({
      success: true,
      productosSinMovimiento,
      filtros: {
        sede,
        rangoDias,
        modo,
        fechaInicio: fechaInicioAnalisis,
        fechaFin: fechaFinAnalisis
      }
    });

  } catch (error) {
    console.error('Error en API productos-sin-movimiento:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    });
  }
}
