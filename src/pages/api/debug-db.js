import { verificarPermisosDB, debugProviderTable } from '../../lib/database';

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

    console.log(`[DEBUG] Iniciando diagnóstico de base de datos para ${sede}...`);

    // Verificar permisos generales
    const permisos = await verificarPermisosDB(sede);
    
    // Verificar estructura específica de provider
    let estructuraProvider = null;
    try {
      estructuraProvider = await debugProviderTable(sede);
    } catch (error) {
      console.error(`Error obteniendo estructura de provider:`, error);
      estructuraProvider = { error: error.message };
    }

    return res.status(200).json({
      success: true,
      sede,
      timestamp: new Date().toISOString(),
      permisos,
      estructuraProvider,
      recomendaciones: [
        "Si hay errores de permisos, verificar que el usuario 'vercel_user' tenga permisos SELECT en todas las tablas",
        "Si la tabla provider no existe, verificar el nombre correcto de la tabla",
        "Si hay problemas de conexión, verificar la configuración de red y credenciales"
      ]
    });

  } catch (error) {
    console.error('Error en API debug-db:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
