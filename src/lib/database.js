const { Pool } = require('pg');

// Configuración de bases de datos - Solo sedes en producción
const dbConfigs = {
  manizales: {
    host: '5.161.103.230', 
    port: 7717,
    user: 'vercel_user',
    password: 'non@ver@ge',
    database: 'crsitaleriamanizales_complete',
    ssl: {
      rejectUnauthorized: false
    }
  },
  ladorada: {
    host: '5.161.103.230',
    port: 7717,
    user: 'vercel_user',
    password: 'non@ver@ge',
    database: 'cristaleriaProd_complete',
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
  async function getProyeccionCompras(sede, rangoDias = 30, fechaInicio = null, fechaFin = null) {
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
          const diasInventarioRestante = frecuenciaVentaDiaria > 0 ? 
            Math.floor(producto.stock_actual / frecuenciaVentaDiaria) : 999;
          
          // Sugerir cantidad a comprar basado en:
          // 1. Proyección de ventas para 30 días (frecuencia * 30)
          // 2. Menos el stock actual
          // 3. Más un margen de seguridad del 20%
          const proyeccionVentas30Dias = frecuenciaVentaDiaria * 30;
          const margenSeguridad = proyeccionVentas30Dias * 0.2;
          const sugeridoComprar = Math.max(0, Math.ceil(proyeccionVentas30Dias - producto.stock_actual + margenSeguridad));
         
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

  // Función para obtener proveedores disponibles
  async function getProveedores(sede) {
    try {
      // Cargar proveedores directamente
      
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

 export {
   createConnection,
   executeQuery,
   getProductosAmbasSedes,
   getProyeccionCompras,
   getProveedores,
   getFacturasProveedor,
   getTodasLasFacturas,
   getAnalisisRecompraProveedor,
   getAnalisisTodosProveedores,

   testVentas,
   testCompras,
   dbConfigs
 };
