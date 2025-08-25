const { Pool } = require('pg');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Configuración de bases de datos optimizada para Vercel
const dbConfigs = {
  manizales: {
    host: process.env.DB_HOST || '5.161.103.230',
    port: process.env.DB_PORT || 7717,
    user: process.env.DB_USER || 'vercel_user',
    password: process.env.DB_PASSWORD || 'non@ver@ge',
    database: process.env.DB_NAME_MANIZALES || 'crsitaleriamanizales_complete',
    ssl: {
      rejectUnauthorized: false
    },
    // Configuración optimizada para Vercel
    max: 1, // Máximo 1 conexión para evitar límites
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    statement_timeout: 30000 // 30 segundos timeout
  },
  ladorada: {
    host: process.env.DB_HOST || '5.161.103.230',
    port: process.env.DB_PORT || 7717,
    user: process.env.DB_USER || 'vercel_user',
    password: process.env.DB_PASSWORD || 'non@ver@ge',
    database: process.env.DB_NAME_LADORADA || 'cristaleriaprod_complete',
    ssl: {
      rejectUnauthorized: false
    },
    // Configuración optimizada para Vercel
    max: 1, // Máximo 1 conexión para evitar límites
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    statement_timeout: 30000 // 30 segundos timeout
  }
};

// Query optimizado para Vercel (más eficiente)
const PRODUCT_EXTRACTION_QUERY = `
  SELECT 
    p.id,
    p.name,
    p.description,
    p.sku,
    p.internal_code,
    p.bar_code::text as bar_code,
    p.cost,
    p.sub_total,
    p.wholesale_price,
    p.wholesale_percentage,
    p.retail_price, 
    p.retail_percentage,
    p.shelf_price,
    p.shelf_percentage,
    p.minimum_price,
    p.taxes,
    p.alter_price,
    p.minimum_stock,
    p.siigo_id,
    p.data_siigo,
    p.old_internal_code,
    p.code_change_date,
    p.siigo_code_change_success,
    p.old_price,
    p.created_at,
    p.updated_at,
    p.observation,
    COALESCE(SUM(s.quantity), 0) as total_stock
  FROM product p
  LEFT JOIN stock s ON s."productId" = p.id AND s.deleted_at IS NULL
  WHERE p.deleted_at IS NULL
  GROUP BY p.id, p.name, p.description, p.sku, p.internal_code, 
           p.cost, p.sub_total, p.wholesale_price, p.wholesale_percentage, 
           p.retail_price, p.retail_percentage, p.shelf_price, p.shelf_percentage, 
           p.minimum_price, p.taxes, p.alter_price, p.minimum_stock, p.siigo_id, 
           p.data_siigo, p.old_internal_code, p.code_change_date, 
           p.siigo_code_change_success, p.old_price, p.created_at, p.updated_at, p.observation
  ORDER BY p.name ASC
  LIMIT 10000 -- Límite para evitar timeouts en Vercel
`;

// Query optimizado para stock por sede
const STOCK_BY_HEADQUARTERS_QUERY = `
  SELECT 
    s."productId",
    h.name as headquarters_name,
    s.quantity as stock_quantity
  FROM stock s
  LEFT JOIN headquarter h ON h.id = s."headquarterId" AND h.deleted_at IS NULL
  WHERE s.deleted_at IS NULL
  ORDER BY s."productId", h.name
`;

// Función de logging optimizada para Vercel
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  console.log(logMessage);
}

// Función para conectar a la base de datos con timeout
async function connectToDatabase(config, sede) {
  const pool = new Pool(config);
  
  try {
    log(`Conectando a base de datos ${sede}...`);
    
    // Test de conexión con timeout
    const client = await Promise.race([
      pool.connect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout de conexión')), 5000)
      )
    ]);
    
    log(`✅ Conexión exitosa a ${sede}`);
    client.release();
    return pool;
    
  } catch (error) {
    log(`❌ Error conectando a ${sede}: ${error.message}`, 'ERROR');
    await pool.end();
    throw error;
  }
}

// Función para extraer datos de productos optimizada
async function extractProductData(pool, sede) {
  try {
    log(`Extrayendo datos de productos de ${sede}...`);
    
    // Ejecutar query principal con timeout
    const productsResult = await Promise.race([
      pool.query(PRODUCT_EXTRACTION_QUERY),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout en query de productos')), 25000)
      )
    ]);
    
    log(`✅ ${productsResult.rows.length} productos extraídos de ${sede}`);
    
    // Ejecutar query de stock por sede
    const stockResult = await Promise.race([
      pool.query(STOCK_BY_HEADQUARTERS_QUERY),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout en query de stock')), 15000)
      )
    ]);
    
    log(`✅ ${stockResult.rows.length} registros de stock extraídos de ${sede}`);
    
    return {
      products: productsResult.rows,
      stock: stockResult.rows
    };
    
  } catch (error) {
    log(`❌ Error extrayendo datos de ${sede}: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Función para procesar datos de productos
function processProductData(products, stockData) {
  try {
    log('Procesando datos de productos...');
    
    // Crear mapa de stock por producto
    const stockMap = {};
    stockData.forEach(stock => {
      if (!stockMap[stock.productId]) {
        stockMap[stock.productId] = {};
      }
      stockMap[stock.productId][stock.headquarters_name] = stock.stock_quantity;
    });
    
    // Procesar productos
    const processedData = products.map(product => {
      // Procesar códigos de barras
      let barCodes = [];
      try {
        if (product.bar_code) {
          const parsed = JSON.parse(product.bar_code);
          barCodes = Array.isArray(parsed) ? parsed : [parsed];
        }
      } catch (e) {
        barCodes = product.bar_code ? [product.bar_code] : [];
      }
      
      // Obtener stock por sede
      const productStock = stockMap[product.id] || {};
      const stockBySede = Object.entries(productStock)
        .map(([sede, cantidad]) => `${sede}: ${cantidad}`)
        .join(', ');
      
      // Calcular IVA
      const ivaText = product.taxes ? 'IVA 19%' : 'Sin IVA';
      const ivaValue = product.taxes ? 0.19 : 0;
      
      return {
        'Código Interno': product.internal_code || '',
        'ID Siigo': product.siigo_id || '',
        'Nombre': product.name || '',
        'Descripción': product.description || '',
        'Subtotal': product.sub_total || 0,
        'Costo': product.cost || 0,
        'IVA': ivaText,
        'Valor IVA': ivaValue,
        'Porcentaje Mayorista': product.wholesale_percentage || 0,
        'Porcentaje Minorista': product.retail_percentage || 0,
        'Porcentaje Estándar': product.shelf_percentage || 0,
        'Precio Mayorista': product.wholesale_price || 0,
        'Precio Minorista': product.retail_price || 0,
        'Precio Estándar': product.shelf_price || 0,
        'Stock Total': product.total_stock || 0,
        'Stock por Sede': stockBySede,
        'Proveedor': 'MARGIL',
        'Códigos de Barras': barCodes.join(', '),
        'Precio Alterado': product.alter_price ? 'Sí' : 'No',
        'Fecha Creación': product.created_at ? new Date(product.created_at).toLocaleDateString('es-ES') : '',
        'Última Actualización': product.updated_at ? new Date(product.updated_at).toLocaleDateString('es-ES') : ''
      };
    });
    
    log(`✅ ${processedData.length} productos procesados`);
    return processedData;
    
  } catch (error) {
    log(`❌ Error procesando datos: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Función para generar Excel optimizada para Vercel
function generateExcel(data, filename) {
  try {
    log(`Generando archivo Excel: ${filename}`);
    
    // Crear workbook
    const workbook = XLSX.utils.book_new();
    
    // Crear worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Configurar anchos de columna
    const columnWidths = [
      { wch: 15 },  // Código Interno
      { wch: 40 },  // ID Siigo
      { wch: 40 },  // Nombre
      { wch: 40 },  // Descripción
      { wch: 12 },  // Subtotal
      { wch: 12 },  // Costo
      { wch: 15 },  // IVA
      { wch: 10 },  // Valor IVA
      { wch: 15 },  // Porcentaje Mayorista
      { wch: 15 },  // Porcentaje Minorista
      { wch: 15 },  // Porcentaje Estándar
      { wch: 15 },  // Precio Mayorista
      { wch: 15 },  // Precio Minorista
      { wch: 15 },  // Precio Estándar
      { wch: 12 },  // Stock Total
      { wch: 60 },  // Stock por Sede
      { wch: 15 },  // Proveedor
      { wch: 20 },  // Códigos de Barras
      { wch: 15 },  // Precio Alterado
      { wch: 15 },  // Fecha Creación
      { wch: 20 }   // Última Actualización
    ];
    
    worksheet['!cols'] = columnWidths;
    
    // Agregar worksheet al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');
    
    // Crear directorio temporal para Vercel
    const exportDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    // Guardar archivo
    const filePath = path.join(exportDir, filename);
    XLSX.writeFile(workbook, filePath);
    
    log(`✅ Archivo Excel generado: ${filePath}`);
    return filePath;
    
  } catch (error) {
    log(`❌ Error generando Excel: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Función para validar archivo
function validateFile(filePath) {
  try {
    log(`Validando archivo: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error('El archivo no existe');
    }
    
    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      throw new Error('El archivo está vacío');
    }
    
    // Verificar que es un archivo Excel válido
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets['Productos'];
    
    if (!worksheet) {
      throw new Error('No se encontró la hoja "Productos"');
    }
    
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    if (data.length < 2) {
      throw new Error('El archivo no contiene datos suficientes');
    }
    
    log(`✅ Archivo validado: ${data.length} filas`);
    return true;
    
  } catch (error) {
    log(`❌ Error validando archivo: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Función principal de extracción optimizada para Vercel
async function extractProducts() {
  const results = {};
  const startTime = Date.now();
  
  log('🚀 Iniciando extracción de productos optimizada para Vercel...');
  
  try {
    // Procesar cada sede
    for (const [sede, config] of Object.entries(dbConfigs)) {
      log(`📊 Procesando sede: ${sede}`);
      
      try {
        // Conectar a la base de datos
        const pool = await connectToDatabase(config, sede);
        
        // Extraer datos
        const { products, stock } = await extractProductData(pool, sede);
        
        // Procesar datos
        const processedData = processProductData(products, stock);
        
        // Generar archivo Excel
        const today = new Date().toISOString().split('T')[0];
        const filename = `productos_${sede}_${today}.xlsx`;
        const filePath = generateExcel(processedData, filename);
        
        // Validar archivo
        validateFile(filePath);
        
        // Cerrar conexión
        await pool.end();
        
        results[sede] = {
          success: true,
          count: processedData.length,
          filePath: filePath,
          filename: filename,
          processingTime: Date.now() - startTime
        };
        
        log(`✅ ${sede} completado: ${processedData.length} productos`);
        
      } catch (error) {
        log(`❌ Error procesando ${sede}: ${error.message}`, 'ERROR');
        results[sede] = {
          success: false,
          error: error.message,
          processingTime: Date.now() - startTime
        };
      }
    }
    
    const totalTime = Date.now() - startTime;
    log(`🎉 Extracción completada en ${totalTime}ms`);
    
    return results;
    
  } catch (error) {
    log(`❌ Error general en extracción: ${error.message}`, 'ERROR');
    throw error;
  }
}

module.exports = { extractProducts };

// Ejecutar directamente si se llama desde línea de comandos
if (require.main === module) {
  extractProducts()
    .then(results => {
      console.log('\n🎉 RESULTADOS FINALES:');
      console.log(JSON.stringify(results, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error fatal:', error.message);
      process.exit(1);
    });
}
