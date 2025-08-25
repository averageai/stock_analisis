import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  // Solo permitir método GET
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Método no permitido. Use GET para descargar archivos.' 
    });
  }

  const { sede } = req.query;

  if (!sede || !['ladorada', 'manizales'].includes(sede)) {
    return res.status(400).json({
      error: 'Parámetro sede requerido. Valores válidos: ladorada, manizales'
    });
  }

  try {
    // Obtener la fecha actual
    const today = new Date().toISOString().split('T')[0];
    const filename = `productos_${sede}_${today}.xlsx`;
    
    // Ruta del archivo
    const filePath = path.join(process.cwd(), 'exports', filename);
    
    // Verificar si el archivo existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'Archivo no encontrado',
        message: `El archivo ${filename} no existe. Ejecuta primero la extracción.`,
        availableFiles: getAvailableFiles()
      });
    }

    // Obtener estadísticas del archivo
    const stats = fs.statSync(filePath);
    
    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Enviar el archivo
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error descargando archivo:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}

// Función para obtener archivos disponibles
function getAvailableFiles() {
  try {
    const exportsDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportsDir)) {
      return [];
    }
    
    const files = fs.readdirSync(exportsDir)
      .filter(file => file.endsWith('.xlsx'))
      .map(file => {
        const filePath = path.join(exportsDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size: stats.size,
          modified: stats.mtime.toISOString(),
          url: `/api/download-excel?sede=${file.includes('ladorada') ? 'ladorada' : 'manizales'}`
        };
      });
    
    return files;
  } catch (error) {
    return [];
  }
}
