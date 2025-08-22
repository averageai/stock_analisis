const { Pool } = require('pg');

// Configuración de bases de datos - Usar variables de entorno en producción
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

// Función para crear conexión a la base de datos
async function createConnection(environment = 'ladorada') {
  try {
    const config = dbConfigs[environment];
    const pool = new Pool(config);
    return pool;
  } catch (error) {
    console.error(`Error conectando a ${environment}:`, error);
    throw error;
  }
}

// Función para ejecutar consultas
async function executeQuery(environment, query, params = []) {
  let pool;
  try {
    pool = await createConnection(environment);
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error(`Error ejecutando query en ${environment}:`, error);
    throw error;
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

           // Función para probar ventas
    async function testVentas(sede) {
      try {
        // HeadquarterId correctos para cada base de datos
        // La Dorada: headquarterId 6,3,2,5 (CRISTALERIA MI HOGAR, SURTITODO, CRISTALERIA MULTIFAMILIAR)
        // Manizales: headquarterId 3,1,2 (MI HOGAR, MULTIFAMILIAR 2, BODEGA)
        const headquarterIds = sede === 'ladorada' ? [6, 3, 2, 5] : [3, 1, 2];
        
        const queryTest = `
          SELECT 
            COUNT(*) as total_ventas,
            COUNT(DISTINCT s.id) as numero_facturas,
            COUNT(DISTINCT ps."productId") as productos_vendidos,
            MIN(s.created_at) as primera_venta,
            MAX(s.created_at) as ultima_venta,
            SUM(ps.quantity) as cantidad_total_vendida
          FROM sell s
          JOIN product_sell ps ON s.id = ps."sellId"
          WHERE s."headquarterId" = ANY($1) 
            AND s.deleted_at IS NULL
        `;
        
        const resultado = await executeQuery(sede, queryTest, [headquarterIds]);
        const data = resultado[0];
        
        // Convertir fechas a strings para serialización JSON
        if (data.primera_venta) {
          data.primera_venta = data.primera_venta.toISOString();
        }
        if (data.ultima_venta) {
          data.ultima_venta = data.ultima_venta.toISOString();
        }
        
        console.log(`[TEST VENTAS ${sede}]:`, data);
        return data;
      } catch (error) {
        console.error(`Error testeando ventas en ${sede}:`, error);
        throw error;
      }
    }

    // Función para probar compras
    async function testCompras(sede) {
      try {
        // HeadquarterId correctos para cada base de datos
        // La Dorada: headquarterId 6,3,2,5 (CRISTALERIA MI HOGAR, SURTITODO, CRISTALERIA MULTIFAMILIAR)
        // Manizales: headquarterId 3,1,2 (MI HOGAR, MULTIFAMILIAR 2, BODEGA)
        const headquarterIds = sede === 'ladorada' ? [6, 3, 2, 5] : [3, 1, 2];
        
        const queryTest = `
          SELECT 
            COUNT(*) as total_compras,
            COUNT(DISTINCT pur.id) as numero_facturas_compra,
            COUNT(DISTINCT p.id) as productos_comprados,
            MIN(pur.created_at) as primera_compra,
            MAX(pur.created_at) as ultima_compra,
            SUM(pp.quantity) as cantidad_total_comprada
          FROM purchase pur
          JOIN product_purchase pp ON pur.id = pp."purchaseId"
          JOIN product p ON pp."productId" = p.id
          WHERE pur."headquarterId" = ANY($1) 
            AND pur.deleted_at IS NULL
            AND p.deleted_at IS NULL
        `;
        
        const resultado = await executeQuery(sede, queryTest, [headquarterIds]);
        const data = resultado[0];
        
        // Convertir fechas a strings para serialización JSON
        if (data.primera_compra) {
          data.primera_compra = data.primera_compra.toISOString();
        }
        if (data.ultima_compra) {
          data.ultima_compra = data.ultima_compra.toISOString();
        }
        
        console.log(`[TEST COMPRAS ${sede}]:`, data);
        return data;
      } catch (error) {
        console.error(`Error testeando compras en ${sede}:`, error);
        throw error;
      }
    }

   // Función para obtener productos de ambas sedes
   async function getProductosAmbasSedes() {
    try {
             const queryLadorada = `
         SELECT 
           p.id,
           p.name as nombre,
           p.description as descripcion,
           p.retail_price as precio,
           COALESCE(SUM(s.quantity), 0) as stock,
           'ladorada' as sede
         FROM product p
         LEFT JOIN stock s ON p.id = s."productId" AND s."headquarterId" = ANY(ARRAY[6, 3, 2, 5])
         WHERE p.deleted_at IS NULL
         GROUP BY p.id, p.name, p.description, p.retail_price
         ORDER BY p.name
         LIMIT 10
       `;
       
       const queryManizales = `
         SELECT 
           p.id,
           p.name as nombre,
           p.description as descripcion,
           p.retail_price as precio,
           COALESCE(SUM(s.quantity), 0) as stock,
           'manizales' as sede
         FROM product p
         LEFT JOIN stock s ON p.id = s."productId" AND s."headquarterId" = ANY(ARRAY[3, 1, 2])
         WHERE p.deleted_at IS NULL
         GROUP BY p.id, p.name, p.description, p.retail_price
         ORDER BY p.name
         LIMIT 10
       `;
    
    const [ladoradaProductos, manizalesProductos] = await Promise.all([
      executeQuery('ladorada', queryLadorada),
      executeQuery('manizales', queryManizales)
    ]);
    
    return {
      ladorada: ladoradaProductos,
      manizales: manizalesProductos
    };
  } catch (error) {
    console.error('Error obteniendo productos de ambas sedes:', error);
    throw error;
  }
}

    // Función para obtener proyección de compras por sede con rango configurable
  async function getProyeccionCompras(sede, rangoDias = 30, fechaInicio = null, fechaFin = null, ignorarStock = false) {
    try {
      console.log(`[DEBUG] Parámetros recibidos:`, { sede, rangoDias, fechaInicio, fechaFin });
      
      // HeadquarterId correctos para cada base de datos
      // La Dorada: headquarterId 6,3,2,5 (CRISTALERIA MI HOGAR, SURTITODO, CRISTALERIA MULTIFAMILIAR)
      // Manizales: headquarterId 3,1,2 (MI HOGAR, MULTIFAMILIAR 2, BODEGA)
      const headquarterIds = sede === 'ladorada' ? [6, 3, 2, 5] : [3, 1, 2];
      
             // Calcular fechas del rango
       let fechaInicioAnalisis, fechaFinAnalisis;
       
       if (fechaInicio && fechaFin) {
         // Rango personalizado
         fechaInicioAnalisis = new Date(fechaInicio);
         fechaFinAnalisis = new Date(fechaFin);
       } else {
         // Rango predefinido (15, 30, 60 días)
         fechaFinAnalisis = new Date();
         fechaInicioAnalisis = new Date();
         fechaInicioAnalisis.setDate(fechaFinAnalisis.getDate() - rangoDias);
       }
      
       console.log(`[DEBUG] Fechas calculadas:`, {
         fechaInicioAnalisis: fechaInicioAnalisis.toISOString(),
         fechaFinAnalisis: fechaFinAnalisis.toISOString(),
         rangoDias,
         modo: fechaInicio && fechaFin ? 'personalizado' : 'predefinido'
       });
      
       // Query principal con nueva lógica
       const queryProyeccion = `
         WITH compras_en_rango AS (
           -- Productos comprados en el rango de análisis (suma todas las compras)
           SELECT DISTINCT
             p.id,
             p.name as nombre,
             p.cost as costo,
             p.retail_price as precio_venta,
             p.sku,
             p.internal_code,
             MIN(pur.created_at) as primera_compra_en_rango,
             MAX(pur.created_at) as ultima_compra_en_rango,
             SUM(pp.quantity) as cantidad_total_comprada_en_rango,
             COUNT(DISTINCT pur.id) as numero_compras_en_rango,
             AVG(pp.unit_price) as precio_promedio_compra
           FROM product p
           JOIN product_purchase pp ON p.id = pp."productId"
           JOIN purchase pur ON pp."purchaseId" = pur.id
           WHERE pur."headquarterId" = ANY($1)
             AND pur.deleted_at IS NULL
             AND p.deleted_at IS NULL
             AND pur.created_at >= $2
             AND pur.created_at <= $3
           GROUP BY p.id, p.name, p.cost, p.retail_price, p.sku, p.internal_code
         ),
         stock_actual AS (
           -- Stock actual por producto (suma todos los headquarters)
           SELECT 
             "productId",
             SUM(quantity) as stock_actual
           FROM stock 
           WHERE "headquarterId" = ANY($1)
           GROUP BY "productId"
         ),
         ventas_desde_compra AS (
           -- Ventas realizadas desde la primera compra de cada producto hasta hoy
           SELECT 
             ps."productId",
             SUM(ps.quantity) as vendido_desde_compra,
             COUNT(DISTINCT s.id) as numero_ventas,
             MIN(s.created_at) as primera_venta_desde_compra,
             MAX(s.created_at) as ultima_venta
           FROM product_sell ps
           JOIN sell s ON ps."sellId" = s.id
           JOIN (
             -- Obtener la fecha de la primera compra de cada producto en el rango
             SELECT 
               p.id as product_id,
               MIN(pur.created_at) as primera_compra_fecha
             FROM product p
             JOIN product_purchase pp ON p.id = pp."productId"
             JOIN purchase pur ON pp."purchaseId" = pur.id
             WHERE pur."headquarterId" = ANY($1)
               AND pur.deleted_at IS NULL
               AND p.deleted_at IS NULL
               AND pur.created_at >= $2
               AND pur.created_at <= $3
             GROUP BY p.id
           ) primera_compra ON ps."productId" = primera_compra.product_id
           WHERE s."headquarterId" = ANY($1) 
             AND s.deleted_at IS NULL
             AND s.created_at >= primera_compra.primera_compra_fecha
           GROUP BY ps."productId"
         )
         SELECT DISTINCT
           cr.id,
           cr.nombre,
           cr.costo,
           cr.precio_venta,
           cr.sku,
           cr.internal_code,
           cr.primera_compra_en_rango,
           cr.ultima_compra_en_rango,
           cr.cantidad_total_comprada_en_rango,
           cr.numero_compras_en_rango,
           cr.precio_promedio_compra,
           COALESCE(sa.stock_actual, 0) as stock_actual,
           COALESCE(vdc.vendido_desde_compra, 0) as vendido_desde_compra,
           COALESCE(vdc.numero_ventas, 0) as numero_ventas,
           COALESCE(vdc.primera_venta_desde_compra, cr.primera_compra_en_rango) as primera_venta_desde_compra,
           COALESCE(vdc.ultima_venta, cr.ultima_compra_en_rango) as ultima_venta
         FROM compras_en_rango cr
         LEFT JOIN stock_actual sa ON cr.id = sa."productId"
         LEFT JOIN ventas_desde_compra vdc ON cr.id = vdc."productId"
         WHERE COALESCE(vdc.vendido_desde_compra, 0) > 0
         ORDER BY cr.nombre
       `;

             const resultados = await executeQuery(sede, queryProyeccion, [
         headquarterIds,
         fechaInicioAnalisis.toISOString(),
         fechaFinAnalisis.toISOString()
       ]);

                           // Test de ventas y compras para debug
        await testVentas(sede);
        await testCompras(sede);
       
               console.log(`[DEBUG] Proyección para ${sede}:`, {
          headquarterIds,
          fechaInicioAnalisis: fechaInicioAnalisis.toISOString(),
          fechaFinAnalisis: fechaFinAnalisis.toISOString(),
          totalResultados: resultados.length,
          muestraResultados: resultados.slice(0, 2).map(r => ({
            nombre: r.nombre,
            vendido_desde_compra: r.vendido_desde_compra,
            numero_ventas: r.numero_ventas,
            primera_compra: r.primera_compra_en_rango,
            ultima_compra: r.ultima_compra_en_rango
          }))
        });

      // Procesar resultados y calcular métricas
       const proyeccion = resultados.map(producto => {
                   const fechaPrimeraCompra = new Date(producto.primera_compra_en_rango);
          const fechaUltimaCompra = new Date(producto.ultima_compra_en_rango);
          const fechaPrimeraVenta = new Date(producto.primera_venta_desde_compra);
          const fechaUltimaVenta = new Date(producto.ultima_venta);
          const hoy = new Date();
          
          // Calcular días transcurridos desde la primera compra hasta hoy
          const diasDesdePrimeraCompra = Math.max(1, Math.floor((hoy - fechaPrimeraCompra) / (1000 * 60 * 60 * 24)));
          
          // Calcular días desde la última compra
          const diasDesdeUltimaCompra = Math.max(1, Math.floor((hoy - fechaUltimaCompra) / (1000 * 60 * 60 * 24)));
          
          // Calcular días desde primera venta
          const diasDesdePrimeraVenta = Math.max(1, Math.floor((hoy - fechaPrimeraVenta) / (1000 * 60 * 60 * 24)));
          
          // Calcular frecuencia de venta diaria (ventas por día desde la primera compra)
          const frecuenciaVentaDiaria = diasDesdePrimeraCompra > 0 ? 
            producto.vendido_desde_compra / diasDesdePrimeraCompra : 0;
          
          // Calcular días de inventario restante basado en la frecuencia de venta
          const diasInventarioRestante = ignorarStock ? null : (frecuenciaVentaDiaria > 0 ? 
            Math.floor(producto.stock_actual / frecuenciaVentaDiaria) : 999);
          
          // Sugerir cantidad a comprar basado en:
          // 1. Proyección de ventas para 30 días (frecuencia * 30)
          // 2. Menos el stock actual (si no se ignora)
          // 3. Más un margen de seguridad del 20%
          const proyeccionVentas30Dias = frecuenciaVentaDiaria * 30;
          const margenSeguridad = proyeccionVentas30Dias * 0.2;
          const sugeridoComprar = ignorarStock ? 
            Math.max(0, Math.ceil(proyeccionVentas30Dias + margenSeguridad)) :
            Math.max(0, Math.ceil(proyeccionVentas30Dias - producto.stock_actual + margenSeguridad));
         
         // Calcular margen de ganancia
         const margenGanancia = producto.precio_venta > 0 ? 
           ((producto.precio_venta - producto.costo) / producto.precio_venta) * 100 : 0;

         return {
           id: producto.id,
           nombre: producto.nombre,
           sku: producto.sku,
           internal_code: producto.internal_code,
           costo: producto.costo,
           precio_venta: producto.precio_venta,
           margen_ganancia: margenGanancia,
           primera_compra_en_rango: producto.primera_compra_en_rango.toISOString(),
           ultima_compra_en_rango: producto.ultima_compra_en_rango.toISOString(),
           cantidad_total_comprada_en_rango: producto.cantidad_total_comprada_en_rango,
           numero_compras_en_rango: producto.numero_compras_en_rango,
           precio_promedio_compra: producto.precio_promedio_compra,
           stock_actual: producto.stock_actual,
           vendido_desde_compra: producto.vendido_desde_compra,
           numero_ventas: producto.numero_ventas,
           primera_venta_desde_compra: producto.primera_venta_desde_compra.toISOString(),
           ultima_venta: producto.ultima_venta.toISOString(),
                       dias_desde_primera_compra: diasDesdePrimeraCompra,
            dias_desde_ultima_compra: diasDesdeUltimaCompra,
            dias_desde_primera_venta: diasDesdePrimeraVenta,
            frecuencia_venta_diaria: frecuenciaVentaDiaria,
                      dias_inventario_restante: diasInventarioRestante,
          sugerido_comprar: sugeridoComprar,
          ignorar_stock: ignorarStock,
          sede: sede,
          rango_analisis: rangoDias,
          fecha_inicio_analisis: fechaInicioAnalisis.toISOString(),
          fecha_fin_analisis: fechaFinAnalisis.toISOString()
         };
       });

      return proyeccion;
    } catch (error) {
      console.error(`Error obteniendo proyección de compras para ${sede}:`, error);
      throw error;
    }
  }

  // Función de debug para verificar estructura de provider
  async function debugProviderTable(sede) {
    try {
      const queryDebug = `
        SELECT 
          column_name, 
          data_type, 
          is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'provider' 
        ORDER BY ordinal_position
      `;
      
      const estructura = await executeQuery(sede, queryDebug, []);
      console.log(`[DEBUG] Estructura tabla provider en ${sede}:`, estructura);
      
      // También verificar si hay datos
      const queryCount = `SELECT COUNT(*) as total FROM provider WHERE deleted_at IS NULL`;
      const count = await executeQuery(sede, queryCount, []);
      console.log(`[DEBUG] Total proveedores en ${sede}:`, count[0]);
      
      return { estructura, count: count[0] };
    } catch (error) {
      console.error(`Error debuggeando tabla provider en ${sede}:`, error);
      throw error;
    }
  }

  // Función para verificar permisos y estructura de la base de datos
  async function verificarPermisosDB(sede) {
    try {
      console.log(`[DEBUG] Verificando permisos en ${sede}...`);
      
      // Verificar si podemos conectarnos
      const pool = await createConnection(sede);
      
      // Verificar tablas disponibles
      const queryTablas = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('provider', 'purchase', 'product', 'stock', 'sell', 'product_sell', 'product_purchase')
        ORDER BY table_name
      `;
      
      const tablas = await pool.query(queryTablas);
      console.log(`[DEBUG] Tablas disponibles en ${sede}:`, tablas.rows);
      
      // Verificar permisos en tabla provider específicamente
      try {
        const queryProvider = `SELECT COUNT(*) FROM provider LIMIT 1`;
        const providerTest = await pool.query(queryProvider);
        console.log(`[DEBUG] Permisos en tabla provider ${sede}: OK`);
      } catch (providerError) {
        console.error(`[DEBUG] Error de permisos en tabla provider ${sede}:`, providerError.message);
      }
      
      // Verificar estructura de provider si existe
      try {
        const queryEstructura = `
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'provider' 
          ORDER BY ordinal_position
        `;
        const estructura = await pool.query(queryEstructura);
        console.log(`[DEBUG] Estructura tabla provider en ${sede}:`, estructura.rows);
      } catch (estructuraError) {
        console.error(`[DEBUG] Error obteniendo estructura de provider en ${sede}:`, estructuraError.message);
      }
      
      await pool.end();
      
      return {
        sede,
        tablas: tablas.rows,
        status: 'verificado'
      };
    } catch (error) {
      console.error(`[DEBUG] Error verificando permisos en ${sede}:`, error);
      throw error;
    }
  }

  // Función para obtener proveedores disponibles con mejor manejo de errores
  async function getProveedores(sede) {
    try {
      console.log(`[DEBUG] Obteniendo proveedores de ${sede}...`);
      
      // Primero verificar permisos
      await verificarPermisosDB(sede);
      
      const headquarterIds = sede === 'ladorada' ? [6, 3, 2, 5] : [3, 1, 2];
      
      // Consulta simplificada usando solo el nombre de provider
      const queryProveedores = `
        SELECT DISTINCT
          pr.id,
          pr.name as nombre,
          COUNT(DISTINCT pur.id) as total_facturas,
          MIN(pur.created_at) as primera_compra,
          MAX(pur.created_at) as ultima_compra,
          COALESCE(SUM(pp.quantity), 0) as total_productos_comprados
        FROM provider pr
        INNER JOIN purchase pur ON pr.id = pur."providerId"
        LEFT JOIN product_purchase pp ON pur.id = pp."purchaseId"
        WHERE pur."headquarterId" = ANY($1)
          AND pur.deleted_at IS NULL
          AND pr.deleted_at IS NULL
        GROUP BY pr.id, pr.name
        ORDER BY pr.name
      `;
      
      console.log(`[DEBUG] Buscando proveedores en ${sede} con headquarterIds:`, headquarterIds);
      
      const proveedores = await executeQuery(sede, queryProveedores, [headquarterIds]);
      
      console.log(`[DEBUG] Proveedores encontrados:`, proveedores.length, proveedores.slice(0, 3));
      
      // Convertir fechas a strings para serialización JSON
      const proveedoresFormateados = proveedores.map(proveedor => ({
        ...proveedor,
        primera_compra: proveedor.primera_compra?.toISOString(),
        ultima_compra: proveedor.ultima_compra?.toISOString()
      }));
      
      return proveedoresFormateados;
    } catch (error) {
      console.error(`Error obteniendo proveedores para ${sede}:`, error);
      
      // Si es un error de permisos, intentar una consulta alternativa
      if (error.message.includes('permission denied') || error.message.includes('does not exist')) {
        console.log(`[DEBUG] Intentando consulta alternativa para proveedores en ${sede}...`);
        
        try {
          // Consulta alternativa sin JOIN directo con provider
          const queryAlternativa = `
            SELECT DISTINCT
              pur."providerId" as id,
              'Proveedor ' || pur."providerId" as nombre,
              COUNT(DISTINCT pur.id) as total_facturas,
              MIN(pur.created_at) as primera_compra,
              MAX(pur.created_at) as ultima_compra,
              COALESCE(SUM(pp.quantity), 0) as total_productos_comprados
            FROM purchase pur
            LEFT JOIN product_purchase pp ON pur.id = pp."purchaseId"
            WHERE pur."headquarterId" = ANY($1)
              AND pur.deleted_at IS NULL
              AND pur."providerId" IS NOT NULL
            GROUP BY pur."providerId"
            ORDER BY pur."providerId"
          `;
          
          const proveedoresAlt = await executeQuery(sede, queryAlternativa, [headquarterIds]);
          
          const proveedoresFormateados = proveedoresAlt.map(proveedor => ({
            ...proveedor,
            primera_compra: proveedor.primera_compra?.toISOString(),
            ultima_compra: proveedor.ultima_compra?.toISOString()
          }));
          
          console.log(`[DEBUG] Proveedores encontrados con consulta alternativa:`, proveedoresFormateados.length);
          return proveedoresFormateados;
          
        } catch (errorAlt) {
          console.error(`Error en consulta alternativa para proveedores en ${sede}:`, errorAlt);
          throw new Error(`No se pueden obtener proveedores: ${error.message}. Consulta alternativa también falló: ${errorAlt.message}`);
        }
      }
      
      throw error;
    }
  }

  // Función para obtener todas las facturas de todos los proveedores
  async function getTodasLasFacturas(sede) {
    try {
      const headquarterIds = sede === 'ladorada' ? [6, 3, 2, 5] : [3, 1, 2];
      
      const query = `
        SELECT 
          pur.id,
          pur.invoice_number,
          pur.total_value,
          pur.created_at,
          pur.observation,
          pr.name as nombre_proveedor,
          COUNT(DISTINCT pp."productId") as total_productos,
          SUM(pp.quantity) as total_cantidad
        FROM purchase pur
        JOIN provider pr ON pur."providerId" = pr.id
        LEFT JOIN product_purchase pp ON pur.id = pp."purchaseId"
        WHERE pur."headquarterId" = ANY($1)
          AND pur.deleted_at IS NULL
        GROUP BY pur.id, pur.invoice_number, pur.total_value, pur.created_at, pur.observation, pr.name
        ORDER BY pur.created_at DESC
      `;
      
      const resultados = await executeQuery(sede, query, [headquarterIds]);
      return resultados;
    } catch (error) {
      console.error(`Error obteniendo todas las facturas en ${sede}:`, error);
      throw error;
    }
  }

  // Función para obtener facturas de un proveedor específico
  async function getFacturasProveedor(sede, providerId) {
    try {
      const headquarterIds = sede === 'ladorada' ? [6, 3, 2, 5] : [3, 1, 2];
      
      const queryFacturas = `
        SELECT 
          pur.id,
          pur.invoice_number,
          pur.total_value,
          pur.created_at,
          pur.observation,
          COUNT(pp.id) as total_productos,
          SUM(pp.quantity) as cantidad_total
        FROM purchase pur
        LEFT JOIN product_purchase pp ON pur.id = pp."purchaseId"
        WHERE pur."providerId" = $1
          AND pur."headquarterId" = ANY($2)
          AND pur.deleted_at IS NULL
        GROUP BY pur.id, pur.invoice_number, pur.total_value, pur.created_at, pur.observation
        ORDER BY pur.created_at DESC
      `;
      
      const facturas = await executeQuery(sede, queryFacturas, [providerId, headquarterIds]);
      
      // Convertir fechas a strings para serialización JSON
      return facturas.map(factura => ({
        ...factura,
        created_at: factura.created_at?.toISOString()
      }));
    } catch (error) {
      console.error(`Error obteniendo facturas del proveedor ${providerId} en ${sede}:`, error);
      throw error;
    }
  }

  // Función para obtener análisis de recompra por proveedor
  async function getAnalisisRecompraProveedor(sede, providerId, facturaIds = null, ignorarStock = false, filtroDias = null) {
    try {
      console.log(`[DEBUG] Análisis recompra:`, { sede, providerId, facturaIds });
      
      const headquarterIds = sede === 'ladorada' ? [6, 3, 2, 5] : [3, 1, 2];
      
      // Construir filtro de facturas
      let filtroFacturas = '';
      let filtroFecha = '';
      let params = [providerId, headquarterIds];
      let paramIndex = 3;
      
      if (facturaIds && facturaIds.length > 0) {
        filtroFacturas = `AND pur.id = ANY($${paramIndex})`;
        params.push(facturaIds);
        paramIndex++;
      }
      
      // Agregar filtro de fecha si se especifica
      if (filtroDias && filtroDias !== 'todos') {
        const dias = parseInt(filtroDias);
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - dias);
        filtroFecha = `AND pur.created_at >= $${paramIndex}`;
        params.push(fechaLimite.toISOString());
      }
      
      const queryAnalisis = `
        WITH productos_comprados AS (
          -- Productos comprados al proveedor específico
          SELECT DISTINCT
            p.id,
            p.name as nombre,
            p.description as descripcion,
            p.cost as costo,
            p.retail_price as precio_venta,
            p.wholesale_price as precio_mayorista,
            p.sku,
            p.internal_code,
            p.minimum_stock,
            MIN(pur.created_at) as primera_compra,
            MAX(pur.created_at) as ultima_compra,
            SUM(pp.quantity) as cantidad_total_comprada,
            COUNT(DISTINCT pur.id) as numero_facturas_compra,
            AVG(pp.unit_price) as precio_promedio_compra,
            pr.name as nombre_proveedor
          FROM product p
          JOIN product_purchase pp ON p.id = pp."productId"
          JOIN purchase pur ON pp."purchaseId" = pur.id
          JOIN provider pr ON pur."providerId" = pr.id
          WHERE pur."providerId" = $1
            AND pur."headquarterId" = ANY($2)
            AND pur.deleted_at IS NULL
            AND p.deleted_at IS NULL
            ${filtroFacturas}
            ${filtroFecha}
          GROUP BY p.id, p.name, p.description, p.cost, p.retail_price, p.wholesale_price, p.sku, p.internal_code, p.minimum_stock, pr.name
        ),
        stock_actual AS (
          -- Stock actual por producto (o 0 si se ignora el stock)
          SELECT 
            "productId",
            ${ignorarStock ? '0' : 'SUM(quantity)'} as stock_actual
          FROM stock 
          WHERE "headquarterId" = ANY($2)
          GROUP BY "productId"
        ),
        ventas_desde_compra AS (
          -- Ventas realizadas desde la primera compra de cada producto
          SELECT 
            ps."productId",
            SUM(ps.quantity) as vendido_desde_compra,
            COUNT(DISTINCT s.id) as numero_ventas,
            MIN(s.created_at) as primera_venta_desde_compra,
            MAX(s.created_at) as ultima_venta,
            AVG(ps."unitPrice") as precio_promedio_venta
          FROM product_sell ps
          JOIN sell s ON ps."sellId" = s.id
          JOIN (
            -- Obtener la fecha de la primera compra de cada producto al proveedor
            SELECT 
              p.id as product_id,
              MIN(pur.created_at) as primera_compra_fecha
            FROM product p
            JOIN product_purchase pp ON p.id = pp."productId"
            JOIN purchase pur ON pp."purchaseId" = pur.id
            WHERE pur."providerId" = $1
              AND pur."headquarterId" = ANY($2)
              AND pur.deleted_at IS NULL
              AND p.deleted_at IS NULL
              ${filtroFacturas}
              ${filtroFecha}
            GROUP BY p.id
          ) primera_compra ON ps."productId" = primera_compra.product_id
          WHERE s."headquarterId" = ANY($2) 
            AND s.deleted_at IS NULL
            AND s.created_at >= primera_compra.primera_compra_fecha
          GROUP BY ps."productId"
        )
        SELECT 
          pc.id,
          pc.nombre,
          pc.descripcion,
          pc.costo,
          pc.precio_venta,
          pc.precio_mayorista,
          pc.sku,
          pc.internal_code,
          pc.minimum_stock,
          pc.nombre_proveedor,
          pc.primera_compra,
          pc.ultima_compra,
          pc.cantidad_total_comprada,
          pc.numero_facturas_compra,
          pc.precio_promedio_compra,
          COALESCE(sa.stock_actual, 0) as stock_actual,
          COALESCE(vdc.vendido_desde_compra, 0) as vendido_desde_compra,
          COALESCE(vdc.numero_ventas, 0) as numero_ventas,
          COALESCE(vdc.primera_venta_desde_compra, pc.primera_compra) as primera_venta_desde_compra,
          COALESCE(vdc.ultima_venta, pc.ultima_compra) as ultima_venta,
          COALESCE(vdc.precio_promedio_venta, pc.precio_venta) as precio_promedio_venta
        FROM productos_comprados pc
        LEFT JOIN stock_actual sa ON pc.id = sa."productId"
        LEFT JOIN ventas_desde_compra vdc ON pc.id = vdc."productId"
        ORDER BY COALESCE(vdc.vendido_desde_compra, 0) DESC, pc.nombre
      `;
      
      const resultados = await executeQuery(sede, queryAnalisis, params);
      
      // Procesar resultados y calcular métricas
      const analisis = resultados.map(producto => {
        const fechaPrimeraCompra = new Date(producto.primera_compra);
        const fechaUltimaCompra = new Date(producto.ultima_compra);
        const fechaPrimeraVenta = new Date(producto.primera_venta_desde_compra);
        const fechaUltimaVenta = new Date(producto.ultima_venta);
        const hoy = new Date();
        
        // Calcular días transcurridos desde la primera compra hasta hoy
        const diasDesdePrimeraCompra = Math.max(1, Math.floor((hoy - fechaPrimeraCompra) / (1000 * 60 * 60 * 24)));
        
        // Calcular días desde la última compra
        const diasDesdeUltimaCompra = Math.max(1, Math.floor((hoy - fechaUltimaCompra) / (1000 * 60 * 60 * 24)));
        
        // Calcular días desde primera venta
        const diasDesdePrimeraVenta = Math.max(1, Math.floor((hoy - fechaPrimeraVenta) / (1000 * 60 * 60 * 24)));
        
        // Calcular frecuencia de venta diaria
        const frecuenciaVentaDiaria = diasDesdePrimeraCompra > 0 ? 
          producto.vendido_desde_compra / diasDesdePrimeraCompra : 0;
        
        // Calcular días de inventario restante
        const diasInventarioRestante = ignorarStock ? null : (frecuenciaVentaDiaria > 0 ? 
          Math.floor(producto.stock_actual / frecuenciaVentaDiaria) : 999);
        
        // Sugerir cantidad a comprar
        const proyeccionVentas30Dias = frecuenciaVentaDiaria * 30;
        const margenSeguridad = proyeccionVentas30Dias * 0.2;
        const sugeridoComprar = ignorarStock ? 
          Math.max(0, Math.ceil(proyeccionVentas30Dias + margenSeguridad)) :
          Math.max(0, Math.ceil(proyeccionVentas30Dias - producto.stock_actual + margenSeguridad));
        
        // Calcular margen de ganancia
        const margenGanancia = producto.precio_venta > 0 ? 
          ((producto.precio_venta - producto.costo) / producto.precio_venta) * 100 : 0;
        
        // Calcular margen mayorista
        const margenMayorista = producto.precio_mayorista > 0 ? 
          ((producto.precio_mayorista - producto.costo) / producto.precio_mayorista) * 100 : 0;

        return {
          id: producto.id,
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          sku: producto.sku,
          internal_code: producto.internal_code,
          costo: producto.costo,
          precio_venta: producto.precio_venta,
          precio_mayorista: producto.precio_mayorista,
          minimum_stock: producto.minimum_stock,
          nombre_proveedor: producto.nombre_proveedor,
          margen_ganancia: margenGanancia,
          margen_mayorista: margenMayorista,
          primera_compra: producto.primera_compra?.toISOString(),
          ultima_compra: producto.ultima_compra?.toISOString(),
          cantidad_total_comprada: producto.cantidad_total_comprada,
          numero_facturas_compra: producto.numero_facturas_compra,
          precio_promedio_compra: producto.precio_promedio_compra,
          stock_actual: producto.stock_actual,
          vendido_desde_compra: producto.vendido_desde_compra,
          numero_ventas: producto.numero_ventas,
          primera_venta_desde_compra: producto.primera_venta_desde_compra?.toISOString(),
          ultima_venta: producto.ultima_venta?.toISOString(),
          precio_promedio_venta: producto.precio_promedio_venta,
          dias_desde_primera_compra: diasDesdePrimeraCompra,
          dias_desde_ultima_compra: diasDesdeUltimaCompra,
          dias_desde_primera_venta: diasDesdePrimeraVenta,
          frecuencia_venta_diaria: frecuenciaVentaDiaria,
          dias_inventario_restante: diasInventarioRestante,
          sugerido_comprar: sugeridoComprar,
          sede: sede,
          provider_id: providerId
        };
      });

      return analisis;
    } catch (error) {
      console.error(`Error obteniendo análisis de recompra para proveedor ${providerId} en ${sede}:`, error);
      throw error;
    }
  }

  // Función para obtener análisis de recompra de todos los proveedores
  async function getAnalisisTodosProveedores(sede, facturaIds = null, ignorarStock = false, filtroDias = null) {
    try {
      console.log(`[DEBUG] Análisis todos proveedores:`, { sede, facturaIds });
      
      const headquarterIds = sede === 'ladorada' ? [6, 3, 2, 5] : [3, 1, 2];
      
      // Construir filtro de facturas
      let filtroFacturas = '';
      let filtroFecha = '';
      let params = [headquarterIds];
      let paramIndex = 2;
      
      if (facturaIds && facturaIds.length > 0) {
        filtroFacturas = `AND pur.id = ANY($${paramIndex})`;
        params.push(facturaIds);
        paramIndex++;
      }
      
      // Agregar filtro de fecha si se especifica
      if (filtroDias && filtroDias !== 'todos') {
        const dias = parseInt(filtroDias);
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - dias);
        filtroFecha = `AND pur.created_at >= $${paramIndex}`;
        params.push(fechaLimite.toISOString());
      }
      
      const queryAnalisis = `
        WITH productos_comprados AS (
          -- Productos comprados a todos los proveedores
          SELECT DISTINCT
            p.id,
            p.name as nombre,
            p.description as descripcion,
            p.cost as costo,
            p.retail_price as precio_venta,
            p.wholesale_price as precio_mayorista,
            p.sku,
            p.internal_code,
            p.minimum_stock,
            MIN(pur.created_at) as primera_compra,
            MAX(pur.created_at) as ultima_compra,
            SUM(pp.quantity) as cantidad_total_comprada,
            COUNT(DISTINCT pur.id) as numero_facturas_compra,
            AVG(pp.unit_price) as precio_promedio_compra,
            COUNT(DISTINCT pr.id) as numero_proveedores
          FROM product p
          JOIN product_purchase pp ON p.id = pp."productId"
          JOIN purchase pur ON pp."purchaseId" = pur.id
          JOIN provider pr ON pur."providerId" = pr.id
          WHERE pur."headquarterId" = ANY($1)
            AND pur.deleted_at IS NULL
            AND p.deleted_at IS NULL
            ${filtroFacturas}
            ${filtroFecha}
          GROUP BY p.id, p.name, p.description, p.cost, p.retail_price, p.wholesale_price, p.sku, p.internal_code, p.minimum_stock
        ),
        stock_actual AS (
          -- Stock actual por producto (o 0 si se ignora el stock)
          SELECT 
            "productId",
            ${ignorarStock ? '0' : 'SUM(quantity)'} as stock_actual
          FROM stock 
          WHERE "headquarterId" = ANY($1)
          GROUP BY "productId"
        ),
        ventas_desde_compra AS (
          -- Ventas realizadas desde la primera compra de cada producto
          SELECT 
            ps."productId",
            SUM(ps.quantity) as vendido_desde_compra,
            COUNT(DISTINCT s.id) as numero_ventas,
            MIN(s.created_at) as primera_venta_desde_compra,
            MAX(s.created_at) as ultima_venta,
            AVG(ps."unitPrice") as precio_promedio_venta
          FROM product_sell ps
          JOIN sell s ON ps."sellId" = s.id
          JOIN (
            -- Obtener la fecha de la primera compra de cada producto
            SELECT 
              p.id as product_id,
              MIN(pur.created_at) as primera_compra_fecha
            FROM product p
            JOIN product_purchase pp ON p.id = pp."productId"
            JOIN purchase pur ON pp."purchaseId" = pur.id
            WHERE pur."headquarterId" = ANY($1)
              AND pur.deleted_at IS NULL
              AND p.deleted_at IS NULL
              ${filtroFacturas}
              ${filtroFecha}
            GROUP BY p.id
          ) primera_compra ON ps."productId" = primera_compra.product_id
          WHERE s."headquarterId" = ANY($1) 
            AND s.deleted_at IS NULL
            AND s.created_at >= primera_compra.primera_compra_fecha
          GROUP BY ps."productId"
        )
        SELECT 
          pc.id,
          pc.nombre,
          pc.descripcion,
          pc.costo,
          pc.precio_venta,
          pc.precio_mayorista,
          pc.sku,
          pc.internal_code,
          pc.minimum_stock,
          'Todos los proveedores' as nombre_proveedor,
          pc.primera_compra,
          pc.ultima_compra,
          pc.cantidad_total_comprada,
          pc.numero_facturas_compra,
          pc.precio_promedio_compra,
          pc.numero_proveedores,
          COALESCE(sa.stock_actual, 0) as stock_actual,
          COALESCE(vdc.vendido_desde_compra, 0) as vendido_desde_compra,
          COALESCE(vdc.numero_ventas, 0) as numero_ventas,
          COALESCE(vdc.primera_venta_desde_compra, pc.primera_compra) as primera_venta_desde_compra,
          COALESCE(vdc.ultima_venta, pc.ultima_compra) as ultima_venta,
          COALESCE(vdc.precio_promedio_venta, pc.precio_venta) as precio_promedio_venta
        FROM productos_comprados pc
        LEFT JOIN stock_actual sa ON pc.id = sa."productId"
        LEFT JOIN ventas_desde_compra vdc ON pc.id = vdc."productId"
        ORDER BY COALESCE(vdc.vendido_desde_compra, 0) DESC, pc.nombre
      `;
      
      const resultados = await executeQuery(sede, queryAnalisis, params);
      
      // Procesar resultados y calcular métricas (similar a getAnalisisRecompraProveedor)
      const analisis = resultados.map(producto => {
        const fechaPrimeraCompra = new Date(producto.primera_compra);
        const fechaUltimaCompra = new Date(producto.ultima_compra);
        const fechaPrimeraVenta = new Date(producto.primera_venta_desde_compra);
        const fechaUltimaVenta = new Date(producto.ultima_venta);
        const hoy = new Date();
        
        // Calcular días transcurridos desde la primera compra hasta hoy
        const diasDesdePrimeraCompra = Math.max(1, Math.floor((hoy - fechaPrimeraCompra) / (1000 * 60 * 60 * 24)));
        
        // Calcular días desde la última compra
        const diasDesdeUltimaCompra = Math.max(1, Math.floor((hoy - fechaUltimaCompra) / (1000 * 60 * 60 * 24)));
        
        // Calcular días desde primera venta
        const diasDesdePrimeraVenta = Math.max(1, Math.floor((hoy - fechaPrimeraVenta) / (1000 * 60 * 60 * 24)));
        
        // Calcular frecuencia de venta diaria
        const frecuenciaVentaDiaria = diasDesdePrimeraCompra > 0 ? 
          producto.vendido_desde_compra / diasDesdePrimeraCompra : 0;
        
        // Calcular días de inventario restante
        const diasInventarioRestante = ignorarStock ? null : (frecuenciaVentaDiaria > 0 ? 
          Math.floor(producto.stock_actual / frecuenciaVentaDiaria) : 999);
        
        // Sugerir cantidad a comprar
        const proyeccionVentas30Dias = frecuenciaVentaDiaria * 30;
        const margenSeguridad = proyeccionVentas30Dias * 0.2;
        const sugeridoComprar = ignorarStock ? 
          Math.max(0, Math.ceil(proyeccionVentas30Dias + margenSeguridad)) :
          Math.max(0, Math.ceil(proyeccionVentas30Dias - producto.stock_actual + margenSeguridad));
        
        // Calcular margen de ganancia
        const margenGanancia = producto.precio_venta > 0 ? 
          ((producto.precio_venta - producto.costo) / producto.precio_venta) * 100 : 0;
        
        // Calcular margen mayorista
        const margenMayorista = producto.precio_mayorista > 0 ? 
          ((producto.precio_mayorista - producto.costo) / producto.precio_mayorista) * 100 : 0;

        return {
          id: producto.id,
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          sku: producto.sku,
          internal_code: producto.internal_code,
          costo: producto.costo,
          precio_venta: producto.precio_venta,
          precio_mayorista: producto.precio_mayorista,
          minimum_stock: producto.minimum_stock,
          nombre_proveedor: producto.nombre_proveedor,
          margen_ganancia: margenGanancia,
          margen_mayorista: margenMayorista,
          primera_compra: producto.primera_compra?.toISOString(),
          ultima_compra: producto.ultima_compra?.toISOString(),
          cantidad_total_comprada: producto.cantidad_total_comprada,
          numero_facturas_compra: producto.numero_facturas_compra,
          precio_promedio_compra: producto.precio_promedio_compra,
          numero_proveedores: producto.numero_proveedores,
          stock_actual: producto.stock_actual,
          vendido_desde_compra: producto.vendido_desde_compra,
          numero_ventas: producto.numero_ventas,
          primera_venta_desde_compra: producto.primera_venta_desde_compra?.toISOString(),
          ultima_venta: producto.ultima_venta?.toISOString(),
          precio_promedio_venta: producto.precio_promedio_venta,
          dias_desde_primera_compra: diasDesdePrimeraCompra,
          dias_desde_ultima_compra: diasDesdeUltimaCompra,
          dias_desde_primera_venta: diasDesdePrimeraVenta,
          frecuencia_venta_diaria: frecuenciaVentaDiaria,
          dias_inventario_restante: diasInventarioRestante,
          sugerido_comprar: sugeridoComprar,
          ignorar_stock: ignorarStock,
          sede: sede,
          provider_id: null
        };
      });

      return analisis;
    } catch (error) {
      console.error(`Error obteniendo análisis de todos los proveedores en ${sede}:`, error);
      throw error;
    }
  }

  // Función para obtener productos sin movimientos en los últimos X días
  async function getProductosSinMovimiento(sede, rangoDias = 30, fechaInicio = null, fechaFin = null, ignorarStock = false) {
    try {
      console.log(`[DEBUG] Productos sin movimiento:`, { sede, rangoDias, fechaInicio, fechaFin });
      
      // HeadquarterId correctos para cada base de datos
      const headquarterIds = sede === 'ladorada' ? [6, 3, 2, 5] : [3, 1, 2];
      
      // Calcular fechas del rango
      let fechaInicioAnalisis, fechaFinAnalisis;
      
      if (fechaInicio && fechaFin) {
        // Rango personalizado
        fechaInicioAnalisis = new Date(fechaInicio);
        fechaFinAnalisis = new Date(fechaFin);
      } else {
        // Rango predefinido
        fechaFinAnalisis = new Date();
        fechaInicioAnalisis = new Date();
        fechaInicioAnalisis.setDate(fechaFinAnalisis.getDate() - rangoDias);
      }
      
      console.log(`[DEBUG] Fechas calculadas:`, {
        fechaInicioAnalisis: fechaInicioAnalisis.toISOString(),
        fechaFinAnalisis: fechaFinAnalisis.toISOString(),
        rangoDias,
        modo: fechaInicio && fechaFin ? 'personalizado' : 'predefinido'
      });
      
      // Query principal para productos sin movimientos
      // Filtra productos con última actividad desde 2024 en adelante para evitar productos históricos
      const queryProductosSinMovimiento = `
        WITH productos_con_stock AS (
          -- Productos que tienen stock actual
          SELECT DISTINCT
            p.id,
            p.name as nombre,
            p.description as descripcion,
            p.cost as costo,
            p.retail_price as precio_venta,
            p.sku,
            p.internal_code,
            p.minimum_stock,
            SUM(s.quantity) as stock_actual
          FROM product p
          JOIN stock s ON p.id = s."productId"
          WHERE s."headquarterId" = ANY($1)
            AND p.deleted_at IS NULL
            AND s.quantity > 0
          GROUP BY p.id, p.name, p.description, p.cost, p.retail_price, p.sku, p.internal_code, p.minimum_stock
        ),
        ultima_venta AS (
          -- Última venta de cada producto
          SELECT 
            ps."productId",
            MAX(s.created_at) as ultima_venta_fecha
          FROM product_sell ps
          JOIN sell s ON ps."sellId" = s.id
          WHERE s."headquarterId" = ANY($1)
            AND s.deleted_at IS NULL
          GROUP BY ps."productId"
        ),
        ultimo_movimiento AS (
          -- Último movimiento entre sedes de cada producto
          SELECT 
            m."productId",
            MAX(m.created_at) as ultimo_movimiento_fecha
          FROM movement m
          WHERE (m."sourceId" = ANY($1) OR m."recieverId" = ANY($1))
            AND m.deleted_at IS NULL
          GROUP BY m."productId"
        ),
        ultima_compra AS (
          -- Última compra de cada producto
          SELECT 
            pp."productId",
            MAX(pur.created_at) as ultima_compra_fecha
          FROM product_purchase pp
          JOIN purchase pur ON pp."purchaseId" = pur.id
          WHERE pur."headquarterId" = ANY($1)
            AND pur.deleted_at IS NULL
          GROUP BY pp."productId"
        )
        SELECT DISTINCT
          pcs.id,
          pcs.nombre,
          pcs.descripcion,
          pcs.costo,
          pcs.precio_venta,
          pcs.sku,
          pcs.internal_code,
          pcs.minimum_stock,
          pcs.stock_actual,
          uv.ultima_venta_fecha,
          um.ultimo_movimiento_fecha,
          uc.ultima_compra_fecha,
          COALESCE(uv.ultima_venta_fecha, '1900-01-01'::timestamp) as ultima_actividad_venta,
          COALESCE(um.ultimo_movimiento_fecha, '1900-01-01'::timestamp) as ultima_actividad_movimiento,
          COALESCE(uc.ultima_compra_fecha, '1900-01-01'::timestamp) as ultima_actividad_compra,
          GREATEST(
            COALESCE(uv.ultima_venta_fecha, '1900-01-01'::timestamp),
            COALESCE(um.ultimo_movimiento_fecha, '1900-01-01'::timestamp),
            COALESCE(uc.ultima_compra_fecha, '1900-01-01'::timestamp)
          ) as ultima_actividad_general
        FROM productos_con_stock pcs
        LEFT JOIN ultima_venta uv ON pcs.id = uv."productId"
        LEFT JOIN ultimo_movimiento um ON pcs.id = um."productId"
        LEFT JOIN ultima_compra uc ON pcs.id = uc."productId"
        WHERE GREATEST(
          COALESCE(uv.ultima_venta_fecha, '1900-01-01'::timestamp),
          COALESCE(um.ultimo_movimiento_fecha, '1900-01-01'::timestamp),
          COALESCE(uc.ultima_compra_fecha, '1900-01-01'::timestamp)
        ) < $2
        AND GREATEST(
          COALESCE(uv.ultima_venta_fecha, '1900-01-01'::timestamp),
          COALESCE(um.ultimo_movimiento_fecha, '1900-01-01'::timestamp),
          COALESCE(uc.ultima_compra_fecha, '1900-01-01'::timestamp)
        ) >= '2024-01-01'::timestamp
        ORDER BY pcs.stock_actual DESC, pcs.nombre
      `;

      const resultados = await executeQuery(sede, queryProductosSinMovimiento, [
        headquarterIds,
        fechaInicioAnalisis.toISOString()
      ]);

      console.log(`[DEBUG] Productos sin movimiento para ${sede}:`, {
        headquarterIds,
        fechaInicioAnalisis: fechaInicioAnalisis.toISOString(),
        totalResultados: resultados.length,
        muestraResultados: resultados.slice(0, 2).map(r => ({
          nombre: r.nombre,
          stock_actual: r.stock_actual,
          ultima_actividad: r.ultima_actividad_general
        }))
      });

      // Procesar resultados y calcular métricas
      const productosSinMovimiento = resultados.map(producto => {
        const hoy = new Date();
        const ultimaActividad = new Date(producto.ultima_actividad_general);
        const ultimaVenta = producto.ultima_venta_fecha ? new Date(producto.ultima_venta_fecha) : null;
        const ultimoMovimiento = producto.ultimo_movimiento_fecha ? new Date(producto.ultimo_movimiento_fecha) : null;
        const ultimaCompra = producto.ultima_compra_fecha ? new Date(producto.ultima_compra_fecha) : null;
        
        // Calcular días sin actividad
        const diasSinActividad = Math.floor((hoy - ultimaActividad) / (1000 * 60 * 60 * 24));
        
        // Calcular días sin ventas
        const diasSinVentas = ultimaVenta ? Math.floor((hoy - ultimaVenta) / (1000 * 60 * 60 * 24)) : null;
        
        // Calcular días sin movimientos
        const diasSinMovimientos = ultimoMovimiento ? Math.floor((hoy - ultimoMovimiento) / (1000 * 60 * 60 * 24)) : null;
        
        // Calcular días sin compras
        const diasSinCompras = ultimaCompra ? Math.floor((hoy - ultimaCompra) / (1000 * 60 * 60 * 24)) : null;
        
        // Calcular valor del stock obsoleto
        const valorStockObsoleto = producto.stock_actual * producto.costo;
        
        // Determinar tipo de inactividad
        let tipoInactividad = [];
        if (!ultimaVenta || diasSinVentas > rangoDias) tipoInactividad.push('Sin ventas');
        if (!ultimoMovimiento || diasSinMovimientos > rangoDias) tipoInactividad.push('Sin movimientos');
        if (!ultimaCompra || diasSinCompras > rangoDias) tipoInactividad.push('Sin compras');
        
        // Calcular margen de ganancia
        const margenGanancia = producto.precio_venta > 0 ? 
          ((producto.precio_venta - producto.costo) / producto.precio_venta) * 100 : 0;

        return {
          id: producto.id,
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          sku: producto.sku,
          internal_code: producto.internal_code,
          costo: producto.costo,
          precio_venta: producto.precio_venta,
          minimum_stock: producto.minimum_stock,
          stock_actual: producto.stock_actual,
          margen_ganancia: margenGanancia,
          valor_stock_obsoleto: valorStockObsoleto,
          ultima_venta_fecha: producto.ultima_venta_fecha ? producto.ultima_venta_fecha.toISOString() : null,
          ultimo_movimiento_fecha: producto.ultimo_movimiento_fecha ? producto.ultimo_movimiento_fecha.toISOString() : null,
          ultima_compra_fecha: producto.ultima_compra_fecha ? producto.ultima_compra_fecha.toISOString() : null,
          ultima_actividad_general: producto.ultima_actividad_general ? producto.ultima_actividad_general.toISOString() : null,
          dias_sin_actividad: diasSinActividad,
          dias_sin_ventas: diasSinVentas,
          dias_sin_movimientos: diasSinMovimientos,
          dias_sin_compras: diasSinCompras,
          tipo_inactividad: tipoInactividad,
          sede: sede,
          rango_analisis: rangoDias,
          fecha_inicio_analisis: fechaInicioAnalisis.toISOString(),
          fecha_fin_analisis: fechaFinAnalisis.toISOString()
        };
      });

      return productosSinMovimiento;
    } catch (error) {
      console.error(`Error obteniendo productos sin movimiento en ${sede}:`, error);
      throw error;
    }
  }

  // Función para obtener productos más vendidos por cantidad o valor
  async function getProductosMasVendidos(sede, rangoDias = 30, fechaInicio = null, fechaFin = null, tipoAnalisis = 'cantidad', ignorarStock = false) {
    try {
      console.log(`[DEBUG] Productos más vendidos:`, { sede, rangoDias, fechaInicio, fechaFin, tipoAnalisis });
      
      // HeadquarterId correctos para cada base de datos
      const headquarterIds = sede === 'ladorada' ? [6, 3, 2, 5] : [3, 1, 2];
      
      // Calcular fechas del rango
      let fechaInicioAnalisis, fechaFinAnalisis;
      
      if (fechaInicio && fechaFin) {
        // Rango personalizado
        fechaInicioAnalisis = new Date(fechaInicio);
        fechaFinAnalisis = new Date(fechaFin);
      } else {
        // Rango predefinido
        fechaFinAnalisis = new Date();
        fechaInicioAnalisis = new Date();
        fechaInicioAnalisis.setDate(fechaFinAnalisis.getDate() - rangoDias);
      }
      
      console.log(`[DEBUG] Fechas calculadas:`, {
        fechaInicioAnalisis: fechaInicioAnalisis.toISOString(),
        fechaFinAnalisis: fechaFinAnalisis.toISOString(),
        rangoDias,
        modo: fechaInicio && fechaFin ? 'personalizado' : 'predefinido'
      });
      
      // Query principal para productos más vendidos
      // Usando la estructura correcta de product_sell y optimizando para rendimiento
      const queryMasVendidos = `
        WITH ventas_en_rango AS (
          -- Ventas realizadas en el rango de análisis
          SELECT 
            ps."productId",
            p.name as nombre,
            p.description as descripcion,
            p.cost as costo,
            p.retail_price as precio_venta,
            p.sku,
            p.internal_code,
            p.minimum_stock,
            SUM(ps.quantity) as cantidad_vendida,
            SUM(ps.total_price) as valor_vendido,
            COUNT(DISTINCT s.id) as numero_ventas,
            MIN(s.created_at) as primera_venta_en_rango,
            MAX(s.created_at) as ultima_venta_en_rango,
            -- Calcular precio promedio usando total_price / quantity para mayor precisión
            CASE 
              WHEN SUM(ps.quantity) > 0 THEN SUM(ps.total_price) / SUM(ps.quantity)
              ELSE 0 
            END as precio_promedio_venta
          FROM product_sell ps
          JOIN sell s ON ps."sellId" = s.id
          JOIN product p ON ps."productId" = p.id
          WHERE s."headquarterId" = ANY($1)
            AND ps.deleted_at IS NULL
            AND s.deleted_at IS NULL
            AND p.deleted_at IS NULL
            AND s.created_at >= $2
            AND s.created_at <= $3
          GROUP BY ps."productId", p.name, p.description, p.cost, p.retail_price, p.sku, p.internal_code, p.minimum_stock
        ),
        stock_actual AS (
          -- Stock actual por producto
          SELECT 
            "productId",
            SUM(quantity) as stock_actual
          FROM stock 
          WHERE "headquarterId" = ANY($1)
          GROUP BY "productId"
        ),
        ultima_compra AS (
          -- Última compra de cada producto
          SELECT 
            pp."productId",
            MAX(pur.created_at) as ultima_compra_fecha,
            AVG(pp.unit_price) as precio_promedio_compra
          FROM product_purchase pp
          JOIN purchase pur ON pp."purchaseId" = pur.id
          WHERE pur."headquarterId" = ANY($1)
            AND pur.deleted_at IS NULL
          GROUP BY pp."productId"
        )
        SELECT DISTINCT
          vr."productId" as id,
          vr.nombre,
          vr.descripcion,
          vr.costo,
          vr.precio_venta,
          vr.sku,
          vr.internal_code,
          vr.minimum_stock,
          vr.cantidad_vendida,
          vr.valor_vendido,
          vr.numero_ventas,
          vr.primera_venta_en_rango,
          vr.ultima_venta_en_rango,
          vr.precio_promedio_venta,
          COALESCE(sa.stock_actual, 0) as stock_actual,
          uc.ultima_compra_fecha,
          uc.precio_promedio_compra
        FROM ventas_en_rango vr
        LEFT JOIN stock_actual sa ON vr."productId" = sa."productId"
        LEFT JOIN ultima_compra uc ON vr."productId" = uc."productId"
        WHERE vr.cantidad_vendida > 0
        ORDER BY ${tipoAnalisis === 'valor' ? 'vr.valor_vendido' : 'vr.cantidad_vendida'} DESC
        LIMIT 100
      `;

      const resultados = await executeQuery(sede, queryMasVendidos, [
        headquarterIds,
        fechaInicioAnalisis.toISOString(),
        fechaFinAnalisis.toISOString()
      ]);

      console.log(`[DEBUG] Productos más vendidos para ${sede}:`, {
        headquarterIds,
        fechaInicioAnalisis: fechaInicioAnalisis.toISOString(),
        fechaFinAnalisis: fechaFinAnalisis.toISOString(),
        tipoAnalisis,
        totalResultados: resultados.length,
        muestraResultados: resultados.slice(0, 2).map(r => ({
          nombre: r.nombre,
          cantidad_vendida: r.cantidad_vendida,
          valor_vendido: r.valor_vendido
        }))
      });

      // Procesar resultados y calcular métricas
      const productosMasVendidos = resultados.map(producto => {
        const hoy = new Date();
        const primeraVenta = new Date(producto.primera_venta_en_rango);
        const ultimaVenta = new Date(producto.ultima_venta_en_rango);
        const ultimaCompra = producto.ultima_compra_fecha ? new Date(producto.ultima_compra_fecha) : null;
        
        // Calcular días del rango de análisis
        const diasRango = Math.max(1, Math.floor((ultimaVenta - primeraVenta) / (1000 * 60 * 60 * 24)) + 1);
        
        // Calcular frecuencia de venta diaria
        const frecuenciaVentaDiaria = diasRango > 0 ? producto.cantidad_vendida / diasRango : 0;
        
        // Calcular días de inventario restante basado en la frecuencia de venta
        const diasInventarioRestante = frecuenciaVentaDiaria > 0 ? 
          Math.floor(producto.stock_actual / frecuenciaVentaDiaria) : 999;
        
        // Calcular margen de ganancia
        const margenGanancia = producto.precio_venta > 0 ? 
          ((producto.precio_venta - producto.costo) / producto.precio_venta) * 100 : 0;
        
        // Calcular margen real (precio promedio de venta vs costo)
        const margenReal = producto.precio_promedio_venta > 0 ? 
          ((producto.precio_promedio_venta - producto.costo) / producto.precio_promedio_venta) * 100 : 0;

        return {
          id: producto.id,
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          sku: producto.sku,
          internal_code: producto.internal_code,
          costo: producto.costo,
          precio_venta: producto.precio_venta,
          minimum_stock: producto.minimum_stock,
          stock_actual: producto.stock_actual,
          cantidad_vendida: producto.cantidad_vendida,
          valor_vendido: producto.valor_vendido,
          numero_ventas: producto.numero_ventas,
          margen_ganancia: margenGanancia,
          margen_real: margenReal,
          precio_promedio_venta: producto.precio_promedio_venta,
          precio_promedio_compra: producto.precio_promedio_compra,
          primera_venta_en_rango: producto.primera_venta_en_rango ? producto.primera_venta_en_rango.toISOString() : null,
          ultima_venta_en_rango: producto.ultima_venta_en_rango ? producto.ultima_venta_en_rango.toISOString() : null,
          ultima_compra_fecha: producto.ultima_compra_fecha ? producto.ultima_compra_fecha.toISOString() : null,
          dias_rango_analisis: diasRango,
          frecuencia_venta_diaria: frecuenciaVentaDiaria,
          dias_inventario_restante: diasInventarioRestante,
          sede: sede,
          rango_analisis: rangoDias,
          tipo_analisis: tipoAnalisis,
          fecha_inicio_analisis: fechaInicioAnalisis.toISOString(),
          fecha_fin_analisis: fechaFinAnalisis.toISOString()
        };
      });

      return productosMasVendidos;
    } catch (error) {
      console.error(`Error obteniendo productos más vendidos en ${sede}:`, error);
      throw error;
    }
  }

  // Función para buscar productos por código o nombre
  async function buscarProductos(sede, busqueda) {
    try {
      console.log(`[DEBUG] Búsqueda de productos en ${sede}:`, { busqueda });
      
      // HeadquarterId correctos para cada base de datos
      const headquarterIds = sede === 'ladorada' ? [6, 3, 2, 5] : [3, 1, 2];
      
      // Query para buscar productos por SKU, código interno o nombre
      const queryBusqueda = `
        SELECT DISTINCT
          p.id,
          p.name as nombre,
          p.description as descripcion,
          p.cost as costo,
          p.retail_price as precio_venta,
          p.sku,
          p.internal_code,
          p.minimum_stock,
          COALESCE(s.stock_actual, 0) as stock_actual
        FROM product p
        LEFT JOIN (
          SELECT 
            "productId",
            SUM(quantity) as stock_actual
          FROM stock 
          WHERE "headquarterId" = ANY($1)
          GROUP BY "productId"
        ) s ON p.id = s."productId"
        WHERE p.deleted_at IS NULL
          AND (
            LOWER(p.sku) LIKE LOWER($2) OR
            LOWER(p.internal_code) LIKE LOWER($2) OR
            LOWER(p.name) LIKE LOWER($2)
          )
        ORDER BY p.name
        LIMIT 50
      `;
      
      const terminoBusqueda = `%${busqueda}%`;
      const resultados = await executeQuery(sede, queryBusqueda, [headquarterIds, terminoBusqueda]);
      
      console.log(`[DEBUG] Productos encontrados en ${sede}:`, {
        busqueda,
        totalResultados: resultados.length,
        muestraResultados: resultados.slice(0, 3).map(r => ({
          id: r.id,
          nombre: r.nombre,
          sku: r.sku,
          internal_code: r.internal_code
        }))
      });
      
      return resultados;
    } catch (error) {
      console.error(`Error buscando productos en ${sede}:`, error);
      throw error;
    }
  }

  // Función para analizar un producto individual
  async function analizarProductoIndividual(sede, productId, ignorarStock = false) {
    try {
      console.log(`[DEBUG] Análisis individual de producto en ${sede}:`, { productId, ignorarStock });
      
      // HeadquarterId correctos para cada base de datos
      const headquarterIds = sede === 'ladorada' ? [6, 3, 2, 5] : [3, 1, 2];
      
      // Query para obtener información completa del producto
      const queryAnalisis = `
        WITH compras_producto AS (
          -- Compras del producto específico
          SELECT 
            SUM(pp.quantity) as cantidad_comprada,
            COUNT(DISTINCT pur.id) as numero_compras,
            MIN(pur.created_at) as primera_compra,
            MAX(pur.created_at) as ultima_compra,
            AVG(pp.unit_price) as precio_promedio_compra
          FROM product_purchase pp
          JOIN purchase pur ON pp."purchaseId" = pur.id
          WHERE pp."productId" = $1
            AND pur."headquarterId" = ANY($2)
            AND pur.deleted_at IS NULL
        ),
        ventas_producto AS (
          -- Ventas del producto específico
          SELECT 
            SUM(ps.quantity) as cantidad_vendida,
            COUNT(DISTINCT s.id) as numero_ventas,
            MIN(s.created_at) as primera_venta,
            MAX(s.created_at) as ultima_venta,
            AVG(ps.total_price / ps.quantity) as precio_promedio_venta
          FROM product_sell ps
          JOIN sell s ON ps."sellId" = s.id
          WHERE ps."productId" = $1
            AND s."headquarterId" = ANY($2)
            AND s.deleted_at IS NULL
        ),
        stock_producto AS (
          -- Stock actual del producto
          SELECT 
            SUM(quantity) as stock_actual
          FROM stock 
          WHERE "productId" = $1
            AND "headquarterId" = ANY($2)
        )
        SELECT 
          p.id,
          p.name as nombre,
          p.description as descripcion,
          p.cost as costo,
          p.retail_price as precio_venta,
          p.sku,
          p.internal_code,
          p.minimum_stock,
          COALESCE(sp.stock_actual, 0) as stock_actual,
          COALESCE(cp.cantidad_comprada, 0) as cantidad_comprada,
          COALESCE(cp.numero_compras, 0) as numero_compras,
          COALESCE(cp.primera_compra, '1900-01-01'::timestamp) as primera_compra,
          COALESCE(cp.ultima_compra, '1900-01-01'::timestamp) as ultima_compra,
          COALESCE(cp.precio_promedio_compra, 0) as precio_promedio_compra,
          COALESCE(vp.cantidad_vendida, 0) as cantidad_vendida,
          COALESCE(vp.numero_ventas, 0) as numero_ventas,
          COALESCE(vp.primera_venta, '1900-01-01'::timestamp) as primera_venta,
          COALESCE(vp.ultima_venta, '1900-01-01'::timestamp) as ultima_venta,
          COALESCE(vp.precio_promedio_venta, 0) as precio_promedio_venta
        FROM product p
        LEFT JOIN compras_producto cp ON true
        LEFT JOIN ventas_producto vp ON true
        LEFT JOIN stock_producto sp ON true
        WHERE p.id = $1
          AND p.deleted_at IS NULL
      `;
      
      const resultados = await executeQuery(sede, queryAnalisis, [productId, headquarterIds]);
      
      if (resultados.length === 0) {
        throw new Error('Producto no encontrado');
      }
      
      const producto = resultados[0];
      
      // Calcular métricas adicionales
      const hoy = new Date();
      const primeraCompra = new Date(producto.primera_compra);
      const ultimaVenta = new Date(producto.ultima_venta);
      
      // Calcular días transcurridos desde la primera compra
      const diasDesdePrimeraCompra = Math.max(1, Math.floor((hoy - primeraCompra) / (1000 * 60 * 60 * 24)));
      
      // Calcular frecuencia diaria de venta
      const frecuenciaDiaria = diasDesdePrimeraCompra > 0 ? producto.cantidad_vendida / diasDesdePrimeraCompra : 0;
      
      // Calcular días sin venta
      const diasSinVenta = Math.floor((hoy - ultimaVenta) / (1000 * 60 * 60 * 24));
      
      // Calcular días de inventario restante
      const diasInventarioRestante = ignorarStock ? null : (frecuenciaDiaria > 0 ? 
        Math.floor(producto.stock_actual / frecuenciaDiaria) : 999);
      
      // Calcular sugerencia de compra
      const proyeccionVentas30Dias = frecuenciaDiaria * 30;
      const margenSeguridad = proyeccionVentas30Dias * 0.2;
      const sugerenciaCompra = ignorarStock ? 
        Math.max(0, Math.ceil(proyeccionVentas30Dias + margenSeguridad)) :
        Math.max(0, Math.ceil(proyeccionVentas30Dias - producto.stock_actual + margenSeguridad));
      
      // Calcular margen real
      const margenReal = producto.precio_promedio_venta > 0 ? 
        ((producto.precio_promedio_venta - producto.costo) / producto.precio_promedio_venta) * 100 : 0;
      
      // Determinar estado
      let estado = 'HISTÓRICO';
      if (diasInventarioRestante !== null) {
        if (diasInventarioRestante <= 7) estado = 'CRÍTICO';
        else if (diasInventarioRestante <= 14) estado = 'URGENTE';
        else if (diasInventarioRestante <= 30) estado = 'ATENCIÓN';
        else estado = 'OK';
      }
      
      const analisis = {
        id: producto.id,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        sku: producto.sku,
        internal_code: producto.internal_code,
        costo: producto.costo,
        precio_venta: producto.precio_venta,
        minimum_stock: producto.minimum_stock,
        stock_actual: producto.stock_actual,
        cantidad_comprada: producto.cantidad_comprada,
        numero_compras: producto.numero_compras,
        cantidad_vendida: producto.cantidad_vendida,
        numero_ventas: producto.numero_ventas,
        precio_promedio_compra: producto.precio_promedio_compra,
        precio_promedio_venta: producto.precio_promedio_venta,
        primera_compra: producto.primera_compra !== '1900-01-01T00:00:00.000Z' ? producto.primera_compra.toISOString() : null,
        ultima_compra: producto.ultima_compra !== '1900-01-01T00:00:00.000Z' ? producto.ultima_compra.toISOString() : null,
        primera_venta: producto.primera_venta !== '1900-01-01T00:00:00.000Z' ? producto.primera_venta.toISOString() : null,
        ultima_venta: producto.ultima_venta !== '1900-01-01T00:00:00.000Z' ? producto.ultima_venta.toISOString() : null,
        dias_desde_primera_compra: diasDesdePrimeraCompra,
        frecuencia_diaria: frecuenciaDiaria,
        dias_sin_venta: diasSinVenta,
        dias_inventario_restante: diasInventarioRestante,
        sugerido_comprar: sugerenciaCompra,
        margen_ganancia: margenReal,
        estado: estado,
        sede: sede,
        ignorar_stock: ignorarStock
      };
      
      console.log(`[DEBUG] Análisis completado para producto ${productId} en ${sede}:`, {
        nombre: analisis.nombre,
        frecuencia_diaria: analisis.frecuencia_diaria,
        dias_inventario_restante: analisis.dias_inventario_restante,
        sugerido_comprar: analisis.sugerido_comprar,
        estado: analisis.estado
      });
      
      return analisis;
    } catch (error) {
      console.error(`Error analizando producto individual en ${sede}:`, error);
      throw error;
    }
  }

 export {
   createConnection,
   executeQuery,
   getProductosAmbasSedes,
   getProyeccionCompras,
   getProductosSinMovimiento,
   getProductosMasVendidos,
   getProveedores,
   getFacturasProveedor,
   getTodasLasFacturas,
   getAnalisisRecompraProveedor,
   getAnalisisTodosProveedores,
   debugProviderTable,
   verificarPermisosDB,
   testVentas,
   testCompras,
   buscarProductos,
   analizarProductoIndividual,
   dbConfigs
 };
