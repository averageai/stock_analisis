import { extractProducts } from '../../scripts/extract_products_vercel.js';

export default async function handler(req, res) {
  // Solo permitir método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Método no permitido. Use POST para ejecutar la extracción.' 
    });
  }

  try {
    console.log('🚀 API: Iniciando extracción de productos optimizada para Vercel...');
    
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
        errors: [],
        totalProcessingTime: 0
      }
    };

    // Procesar resultados
    for (const [sede, result] of Object.entries(results)) {
      if (result.success) {
        response.summary.totalProducts += result.count;
        response.summary.filesGenerated.push({
          sede: sede,
          filename: result.filename,
          count: result.count,
          processingTime: result.processingTime
        });
        response.summary.totalProcessingTime = Math.max(response.summary.totalProcessingTime, result.processingTime);
      } else {
        response.summary.errors.push({
          sede: sede,
          error: result.error,
          processingTime: result.processingTime
        });
      }
    }

    // Determinar código de estado
    const hasErrors = response.summary.errors.length > 0;
    const statusCode = hasErrors ? 207 : 200; // 207 = Multi-Status si hay errores parciales

    console.log(`✅ API: Extracción completada - ${response.summary.totalProducts} productos procesados en ${response.summary.totalProcessingTime}ms`);
    
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
