const { Pool } = require('pg');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Configuración de bases de datos usando las credenciales del proyecto
const dbConfigs = {
  manizales: {
    host: process.env.DB_HOST || '5.161.103.230',
    port: process.env.DB_PORT || 7717,
    user: process.env.DB_USER || 'vercel_user',
    password: process.env.DB_PASSWORD || 'non@ver@ge',
    database: process.env.DB_NAME_MANIZALES || 'crsitaleriamanizales_complete',
    ssl: {
      rejectUnauthorized: false
    }
  },
  ladorada: {
    host: process.env.DB_HOST || '5.161.103.230',
    port: process.env.DB_PORT || 7717,
    user: process.env.DB_USER || 'vercel_user',
    password: process.env.DB_PASSWORD || 'non@ver@ge',
    database: process.env.DB_NAME_LADORADA || 'cristaleriaprod_complete',
    ssl: {
      rejectUnauthorized: false
    }
  }
};

// Query principal para extracción completa
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
`;

// Query adicional para obtener stock por sede
const STOCK_BY_HEADQUARTERS_QUERY = `
  SELECT 
    s."productId",
    h.name as headquarters_name,
    s.quantity as stock_quantity,
    s.updated_at as stock_updated
  FROM stock s
  LEFT JOIN headquarter h ON h.id = s."headquarterId" AND h.deleted_at IS NULL
  WHERE s.deleted_at IS NULL
  ORDER BY s."productId", h.name
`;

// Configuración de logging
const LOG_FILE = path.join(__dirname, '..', 'logs', 'extraction.log');

// Función para logging
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  
  console.log(logMessage);
  
  // Asegurar que el directorio de logs existe
  const logDir = path.dirname(LOG_FILE);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  // Escribir al archivo de log
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

// Función para crear conexión a la base de datos
async function createConnection(environment) {
  try {
    const config = dbConfigs[environment];
    log(`Conectando a base de datos: ${environment}`);
    const pool = new Pool(config);
    
    // Probar conexión
    const client = await pool.connect();
    await client.query('SELECT NOW() as current_time');
    client.release();
    
    log(`Conexión exitosa a ${environment}`);
    return pool;
  } catch (error) {
    log(`Error conectando a ${environment}: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Función para ejecutar consulta
async function executeQuery(environment, query) {
  let pool;
  try {
    pool = await createConnection(environment);
    log(`Ejecutando query en ${environment}...`);
    const result = await pool.query(query);
    log(`Query ejecutada exitosamente en ${environment}: ${result.rows.length} filas`);
    return result.rows;
  } catch (error) {
    log(`Error ejecutando query en ${environment}: ${error.message}`, 'ERROR');
    throw error;
  } finally {
    if (pool) {
      await pool.end();
      log(`Conexión cerrada para ${environment}`);
    }
  }
}

// Función para procesar y formatear datos
function processProductData(products, sede, stockMap) {
  log(`Procesando ${products.length} productos para ${sede}`);
  
  return products.map(product => {
    // Procesar códigos de barras
    let barCodes = [];
    if (product.bar_code) {
      try {
        if (typeof product.bar_code === 'string') {
          const parsed = JSON.parse(product.bar_code);
          barCodes = Array.isArray(parsed) ? parsed : [parsed];
        } else if (Array.isArray(product.bar_code)) {
          barCodes = product.bar_code;
        } else {
          barCodes = [product.bar_code];
        }
      } catch (e) {
        // Si no se puede parsear como JSON, tratar como string simple
        barCodes = [product.bar_code];
      }
    }

    // Obtener stock por sede desde el mapa
    const stockByHeadquarters = stockMap[product.id] || [];

    // Calcular valor del IVA
    const valorIVA = product.taxes || 0;
    const ivaText = valorIVA > 0 ? `IVA ${(valorIVA * 100).toFixed(0)}%` : 'Sin IVA';

    return {
      // Orden según especificación
      'Código Interno': product.internal_code || '',
      'ID Siigo': product.siigo_id || '',
      'Nombre': product.name || '',
      'Descripción': product.description || '',
      'Subtotal': product.sub_total || 0,
      'Costo': product.cost || 0,
      'IVA': ivaText,
      'Valor IVA': valorIVA,
      'Porcentaje Mayorista': product.wholesale_percentage ? (product.wholesale_percentage * 100).toFixed(0) : '0',
      'Porcentaje Minorista': product.retail_percentage ? (product.retail_percentage * 100).toFixed(0) : '0',
      'Porcentaje Estándar': product.shelf_percentage ? (product.shelf_percentage * 100).toFixed(0) : '0',
      'Precio Mayorista': product.wholesale_price || 0,
      'Precio Minorista': product.retail_price || 0,
      'Precio Estándar': product.shelf_price || 0,
      'Stock Total': product.total_stock || 0,
      'Stock por Sede': stockByHeadquarters.map(h => 
        `${h.headquarters_name}: ${h.stock_quantity}`
      ).join(', '),
      'Proveedor': 'MARGIL', // Valor fijo según ejemplo
      'Códigos de Barras': barCodes.join(', '),
      'Precio Alterado': product.alter_price ? 'Sí' : 'No',
      'Fecha Creación': product.created_at ? new Date(product.created_at).toLocaleDateString('es-ES') : '',
      'Última Actualización': product.updated_at ? new Date(product.updated_at).toLocaleDateString('es-ES') : ''
    };
  });
}

// Función para generar Excel
function generateExcel(data, filename) {
  try {
    log(`Generando archivo Excel: ${filename}`);
    
    // Crear workbook
    const workbook = XLSX.utils.book_new();
    
    // Crear worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Configurar anchos de columna según nuevo orden
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
    
    // Crear directorio si no existe
    const exportDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    // Guardar archivo
    const filePath = path.join(exportDir, filename);
    XLSX.writeFile(workbook, filePath);
    
    log(`Archivo Excel generado exitosamente: ${filePath}`);
    return filePath;
  } catch (error) {
    log(`Error generando Excel: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Función para validar archivo generado
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
    if (data.length < 2) { // Headers + al menos una fila de datos
      throw new Error('El archivo no contiene datos suficientes');
    }
    
    log(`Archivo validado exitosamente: ${data.length} filas encontradas`);
    return true;
  } catch (error) {
    log(`Error validando archivo: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Función para Git operations
async function gitOperations(filePath, sede) {
  try {
    log(`Iniciando operaciones Git para ${sede}`);
    
    const projectRoot = process.cwd();
    const fileName = path.basename(filePath);
    
    // Cambiar al directorio del proyecto
    process.chdir(projectRoot);
    
    // Agregar archivo al staging usando ruta relativa
    log('Agregando archivo al staging...');
    const relativePath = path.relative(projectRoot, filePath);
    await execAsync(`git add -f "${relativePath}"`);
    
    // Commit con mensaje descriptivo
    const commitMessage = `feat: Actualizar productos ${sede} - ${new Date().toISOString()}`;
    log(`Realizando commit: ${commitMessage}`);
    await execAsync(`git commit -m "${commitMessage}"`);
    
    // Push al repositorio remoto
    log('Realizando push al repositorio remoto...');
    await execAsync('git push origin main');
    
    log(`Operaciones Git completadas exitosamente para ${sede}`);
    return true;
  } catch (error) {
    log(`Error en operaciones Git: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Función principal de extracción
async function extractProducts() {
  const startTime = new Date();
  log('🚀 INICIANDO EXTRACCIÓN COMPLETA DE PRODUCTOS');
  log('=============================================');
  
  const results = {};
  
  try {
    // Procesar cada sede
    for (const sede of ['ladorada', 'manizales']) {
      log(`\n📊 PROCESANDO SEDE: ${sede.toUpperCase()}`);
      log('=====================================');
      
      try {
        // Ejecutar consulta principal
        const products = await executeQuery(sede, PRODUCT_EXTRACTION_QUERY);
        log(`✅ ${products.length} productos encontrados en ${sede}`);
        
        // Ejecutar consulta de stock por sede
        const stockByHeadquarters = await executeQuery(sede, STOCK_BY_HEADQUARTERS_QUERY);
        log(`✅ ${stockByHeadquarters.length} registros de stock por sede en ${sede}`);
        
        // Crear mapa de stock por producto
        const stockMap = {};
        stockByHeadquarters.forEach(stock => {
          if (!stockMap[stock.productId]) {
            stockMap[stock.productId] = [];
          }
          stockMap[stock.productId].push({
            headquarters_name: stock.headquarters_name,
            stock_quantity: stock.stock_quantity,
            stock_updated: stock.stock_updated
          });
        });
        
        // Procesar datos
        const processedData = processProductData(products, sede, stockMap);
        log(`✅ Datos procesados para ${sede}`);
        
        // Generar Excel
        const filename = `productos_${sede}_${new Date().toISOString().split('T')[0]}.xlsx`;
        const filePath = generateExcel(processedData, filename);
        
        // Validar archivo generado
        validateFile(filePath);
        
        // Comentado: Operaciones Git
        // await gitOperations(filePath, sede);
        
        results[sede] = {
          success: true,
          count: products.length,
          filePath: filePath
        };
        
        log(`✅ Procesamiento completado para ${sede}: ${filename}`);
        
      } catch (error) {
        log(`❌ Error procesando ${sede}: ${error.message}`, 'ERROR');
        results[sede] = {
          success: false,
          error: error.message
        };
      }
    }
    
    // Resumen final
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000;
    
    log('\n📋 RESUMEN DE EXTRACCIÓN:');
    log('==========================');
    
    for (const [sede, result] of Object.entries(results)) {
      if (result.success) {
        log(`✅ ${sede.toUpperCase()}: ${result.count} productos → ${result.filePath}`);
      } else {
        log(`❌ ${sede.toUpperCase()}: Error - ${result.error}`);
      }
    }
    
    log(`\n⏱️ Tiempo total de ejecución: ${duration.toFixed(2)} segundos`);
    log('🎯 Extracción completada.');
    
    return results;
    
  } catch (error) {
    log(`❌ Error general en extracción: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Ejecutar extracción si se llama directamente
if (require.main === module) {
  extractProducts()
    .then(() => {
      log('✅ Script de extracción ejecutado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      log(`❌ Error en script de extracción: ${error.message}`, 'ERROR');
      process.exit(1);
    });
}

module.exports = {
  extractProducts,
  processProductData,
  generateExcel,
  validateFile,
  gitOperations
};
