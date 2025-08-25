import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  // Solo permitir método GET
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Método no permitido. Use GET para listar archivos.' 
    });
  }

  try {
    const exportsDir = path.join(process.cwd(), 'exports');
    
    if (!fs.existsSync(exportsDir)) {
      return res.status(200).json({
        success: true,
        message: 'No hay archivos disponibles',
        files: [],
        totalFiles: 0
      });
    }

    const files = fs.readdirSync(exportsDir)
      .filter(file => file.endsWith('.xlsx'))
      .map(file => {
        const filePath = path.join(exportsDir, file);
        const stats = fs.statSync(filePath);
        const sede = file.includes('ladorada') ? 'ladorada' : 'manizales';
        
        return {
          filename: file,
          sede: sede,
          size: stats.size,
          sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
          modified: stats.mtime.toISOString(),
          downloadUrl: `${req.headers.host ? `http://${req.headers.host}` : 'http://localhost:3000'}/api/download-excel?sede=${sede}`,
          directUrl: `${req.headers.host ? `http://${req.headers.host}` : 'http://localhost:3000'}/exports/${file}`
        };
      })
      .sort((a, b) => new Date(b.modified) - new Date(a.modified));

    return res.status(200).json({
      success: true,
      message: 'Archivos disponibles',
      files: files,
      totalFiles: files.length,
      serverInfo: {
        host: req.headers.host || 'localhost:3000',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error listando archivos:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}
