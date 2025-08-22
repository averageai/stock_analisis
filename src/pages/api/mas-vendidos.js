import { getProductosMasVendidos } from '../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  try {
    const { sede, rango, modo, fechaInicio, fechaFin, tipoAnalisis } = req.query;

    // Validar parámetros requeridos
    if (!sede || !['ladorada', 'manizales'].includes(sede)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Sede requerida: ladorada o manizales' 
      });
    }

    // Validar tipo de análisis
    if (!tipoAnalisis || !['cantidad', 'valor'].includes(tipoAnalisis)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Tipo de análisis requerido: cantidad o valor' 
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

    // Obtener productos más vendidos
    const productosMasVendidos = await getProductosMasVendidos(
      sede, 
      rangoDias, 
      fechaInicioAnalisis, 
      fechaFinAnalisis,
      tipoAnalisis
    );

    return res.status(200).json({
      success: true,
      productosMasVendidos,
      filtros: {
        sede,
        rangoDias,
        modo,
        fechaInicio: fechaInicioAnalisis,
        fechaFin: fechaFinAnalisis,
        tipoAnalisis
      }
    });

  } catch (error) {
    console.error('Error en API mas-vendidos:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    });
  }
}
