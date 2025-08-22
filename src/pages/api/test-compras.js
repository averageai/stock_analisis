import { testCompras } from '../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  try {
    const { sede } = req.query;

    // Validar parámetros requeridos
    if (!sede || !['ladorada', 'manizales'].includes(sede)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Sede requerida: ladorada o manizales' 
      });
    }

    // Obtener datos de compras
    const compras = await testCompras(sede);

    return res.status(200).json({
      success: true,
      compras,
      sede
    });

  } catch (error) {
    console.error('Error en API test-compras:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    });
  }
}
