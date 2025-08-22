import { getProveedores, getFacturasProveedor, getTodasLasFacturas, getAnalisisRecompraProveedor, getAnalisisTodosProveedores } from '../../lib/database';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  try {
    const { sede, action, providerId, facturaIds, ignorarStock, filtroDias } = req.query;

    // Validar parámetros requeridos
    if (!sede || !['ladorada', 'manizales'].includes(sede)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Sede requerida: ladorada o manizales' 
      });
    }

    // Manejar diferentes acciones
    switch (action) {
      case 'proveedores':
        // Obtener lista de proveedores
        const proveedores = await getProveedores(sede);
        return res.status(200).json({
          success: true,
          proveedores
        });

             case 'facturas':
         // Obtener facturas de un proveedor específico
         if (!providerId) {
           return res.status(400).json({ 
             success: false, 
             error: 'ProviderId requerido para obtener facturas' 
           });
         }
         const facturas = await getFacturasProveedor(sede, parseInt(providerId));
         return res.status(200).json({
           success: true,
           facturas
         });

       case 'todas-facturas':
         // Obtener todas las facturas de todos los proveedores
         const todasFacturas = await getTodasLasFacturas(sede);
         return res.status(200).json({
           success: true,
           facturas: todasFacturas
         });

             case 'analisis':
         // Obtener análisis de recompra
         const todosProveedores = req.query.todosProveedores === 'true';
         
         if (!providerId && !todosProveedores) {
           return res.status(400).json({ 
             success: false, 
             error: 'ProviderId requerido para análisis o seleccionar todos los proveedores' 
           });
         }
        
        // Procesar facturaIds si se proporcionan
        let facturaIdsArray = null;
        if (facturaIds) {
          try {
            facturaIdsArray = JSON.parse(facturaIds);
            if (!Array.isArray(facturaIdsArray)) {
              facturaIdsArray = [facturaIdsArray];
            }
          } catch (error) {
            return res.status(400).json({ 
              success: false, 
              error: 'Formato inválido para facturaIds' 
            });
          }
        }

                 const analisis = todosProveedores ? 
           await getAnalisisTodosProveedores(sede, facturaIdsArray, ignorarStock === 'true', filtroDias) :
           await getAnalisisRecompraProveedor(sede, parseInt(providerId), facturaIdsArray, ignorarStock === 'true', filtroDias);
        return res.status(200).json({
          success: true,
          analisis,
          filtros: {
            sede,
            providerId: parseInt(providerId),
            facturaIds: facturaIdsArray
          }
        });



      default:
        return res.status(400).json({ 
          success: false, 
          error: 'Acción requerida: proveedores, facturas, o analisis' 
        });
    }

  } catch (error) {
    console.error('Error en API recompra-proveedor:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    });
  }
}
