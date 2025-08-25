import { extractProducts } from '../../scripts/extract_products_final.js';

export default async function handler(req, res) {
  // Solo permitir método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Método no permitido. Use POST para ejecutar la extracción.' 
    });
  }

  try {
    console.log('🚀 API: Iniciando extracción de productos...');
    
    // Ejecutar la extracción
    const results = await extractProducts();
    
    // Preparar respuesta
    const response = {
      success: true,
      message: 'Extracción completada exitosamente',
      timestamp: new Date().toISOString(),
      results: results,
      summary: {
        totalProducts: 0,
        filesGenerated: [],
        errors: []
      }
    };

    // Procesar resultados
    for (const [sede, result] of Object.entries(results)) {
      if (result.success) {
        response.summary.totalProducts += result.count;
        response.summary.filesGenerated.push({
          sede: sede,
          filename: result.filePath.split('/').pop(),
          count: result.count
        });
      } else {
        response.summary.errors.push({
          sede: sede,
          error: result.error
        });
      }
    }

    // Determinar código de estado
    const hasErrors = response.summary.errors.length > 0;
    const statusCode = hasErrors ? 207 : 200; // 207 = Multi-Status si hay errores parciales

    console.log(`✅ API: Extracción completada - ${response.summary.totalProducts} productos procesados`);
    
    return res.status(statusCode).json(response);

  } catch (error) {
    console.error('❌ API: Error en extracción:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
