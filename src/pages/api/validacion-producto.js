import { buscarProductos, analizarProductoIndividual } from '../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  try {
    const { sede, action, busqueda, productId, ignorarStock } = req.query;

    // Validar parámetros requeridos
    if (!sede || !['ladorada', 'manizales'].includes(sede)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Sede requerida: ladorada o manizales' 
      });
    }

    // Manejar búsqueda de productos
    if (action === 'buscar') {
      if (!busqueda || busqueda.trim().length < 2) {
        return res.status(400).json({ 
          success: false, 
          error: 'Término de búsqueda debe tener al menos 2 caracteres' 
        });
      }

      const productos = await buscarProductos(sede, busqueda.trim());
      
      return res.status(200).json({
        success: true,
        productos
      });
    }

    // Manejar análisis de producto individual
    if (productId) {
      const analisis = await analizarProductoIndividual(
        sede, 
        parseInt(productId), 
        ignorarStock === 'true'
      );
      
      return res.status(200).json({
        success: true,
        analisis
      });
    }

    return res.status(400).json({
      success: false,
      error: 'Parámetros inválidos. Use action=buscar o productId'
    });

  } catch (error) {
    console.error('Error en API validacion-producto:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    });
  }
}
