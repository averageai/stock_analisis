import { useState } from 'react';
import Layout from '../components/Layout';

export default function TestVentas({ ventasData, comprasData, error: serverError }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(serverError || null);
  const [ventas, setVentas] = useState(ventasData || {});
  const [compras, setCompras] = useState(comprasData || {});

  const testVentas = async (sede) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/test-ventas?sede=${sede}`);
      const data = await response.json();
      
      if (data.success) {
        setVentas(prev => ({ ...prev, [sede]: data.ventas }));
        setError(null);
      } else {
        setError(data.error || 'Error al cargar datos');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const testCompras = async (sede) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/test-compras?sede=${sede}`);
      const data = await response.json();
      
      if (data.success) {
        setCompras(prev => ({ ...prev, [sede]: data.compras }));
        setError(null);
      } else {
        setError(data.error || 'Error al cargar datos');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Test Ventas - Sistema de Análisis de Inventario">
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Test de Ventas
          </h1>
          <p className="text-gray-600">
            Página temporal para verificar datos de ventas
          </p>
        </div>

                 <div className="bg-white p-6 rounded-lg shadow-md">
           <h3 className="text-lg font-semibold mb-4">Probar Datos</h3>
                       <div className="space-x-4 mb-4">
              <button
                onClick={() => testVentas('ladorada')}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Probando...' : 'Test Ventas La Dorada'}
              </button>
              <button
                onClick={() => testVentas('manizales')}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Probando...' : 'Test Ventas Manizales'}
              </button>
            </div>
            <div className="space-x-4">
              <button
                onClick={() => testCompras('ladorada')}
                disabled={loading}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'Probando...' : 'Test Compras La Dorada'}
              </button>
              <button
                onClick={() => testCompras('manizales')}
                disabled={loading}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
              >
                {loading ? 'Probando...' : 'Test Compras Manizales'}
              </button>
            </div>
         </div>

        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 text-red-800">Error</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-white p-6 rounded-lg shadow-md">
             <h3 className="text-lg font-semibold mb-4">La Dorada - Ventas</h3>
             {ventas.ladorada ? (
               <div className="space-y-2">
                 <p><strong>Total Ventas:</strong> {ventas.ladorada.total_ventas}</p>
                 <p><strong>Número Facturas:</strong> {ventas.ladorada.numero_facturas}</p>
                 <p><strong>Productos Vendidos:</strong> {ventas.ladorada.productos_vendidos}</p>
                 <p><strong>Cantidad Total:</strong> {ventas.ladorada.cantidad_total_vendida}</p>
                 <p><strong>Primera Venta:</strong> {ventas.ladorada.primera_venta}</p>
                 <p><strong>Última Venta:</strong> {ventas.ladorada.ultima_venta}</p>
               </div>
             ) : (
               <p className="text-gray-500">No hay datos</p>
             )}
           </div>

           <div className="bg-white p-6 rounded-lg shadow-md">
             <h3 className="text-lg font-semibold mb-4">Manizales - Ventas</h3>
             {ventas.manizales ? (
               <div className="space-y-2">
                 <p><strong>Total Ventas:</strong> {ventas.manizales.total_ventas}</p>
                 <p><strong>Número Facturas:</strong> {ventas.manizales.numero_facturas}</p>
                 <p><strong>Productos Vendidos:</strong> {ventas.manizales.productos_vendidos}</p>
                 <p><strong>Cantidad Total:</strong> {ventas.manizales.cantidad_total_vendida}</p>
                 <p><strong>Primera Venta:</strong> {ventas.manizales.primera_venta}</p>
                 <p><strong>Última Venta:</strong> {ventas.manizales.ultima_venta}</p>
               </div>
             ) : (
               <p className="text-gray-500">No hay datos</p>
             )}
           </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-white p-6 rounded-lg shadow-md">
             <h3 className="text-lg font-semibold mb-4">La Dorada - Compras</h3>
             {compras.ladorada ? (
               <div className="space-y-2">
                 <p><strong>Total Compras:</strong> {compras.ladorada.total_compras}</p>
                 <p><strong>Número Facturas:</strong> {compras.ladorada.numero_facturas_compra}</p>
                 <p><strong>Productos Comprados:</strong> {compras.ladorada.productos_comprados}</p>
                 <p><strong>Cantidad Total:</strong> {compras.ladorada.cantidad_total_comprada}</p>
                 <p><strong>Primera Compra:</strong> {compras.ladorada.primera_compra}</p>
                 <p><strong>Última Compra:</strong> {compras.ladorada.ultima_compra}</p>
               </div>
             ) : (
               <p className="text-gray-500">No hay datos</p>
             )}
           </div>

           <div className="bg-white p-6 rounded-lg shadow-md">
             <h3 className="text-lg font-semibold mb-4">Manizales - Compras</h3>
             {compras.manizales ? (
               <div className="space-y-2">
                 <p><strong>Total Compras:</strong> {compras.manizales.total_compras}</p>
                 <p><strong>Número Facturas:</strong> {compras.manizales.numero_facturas_compra}</p>
                 <p><strong>Productos Comprados:</strong> {compras.manizales.productos_comprados}</p>
                 <p><strong>Cantidad Total:</strong> {compras.manizales.cantidad_total_comprada}</p>
                 <p><strong>Primera Compra:</strong> {compras.manizales.primera_compra}</p>
                 <p><strong>Última Compra:</strong> {compras.manizales.ultima_compra}</p>
               </div>
             ) : (
               <p className="text-gray-500">No hay datos</p>
             )}
           </div>
         </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps() {
  try {
    const { testVentas, testCompras } = require('../lib/database');
    
    const [ventasLadorada, ventasManizales, comprasLadorada, comprasManizales] = await Promise.all([
      testVentas('ladorada'),
      testVentas('manizales'),
      testCompras('ladorada'),
      testCompras('manizales')
    ]);
    
    return {
      props: {
        ventasData: {
          ladorada: ventasLadorada,
          manizales: ventasManizales
        },
        comprasData: {
          ladorada: comprasLadorada,
          manizales: comprasManizales
        }
      }
    };
  } catch (error) {
    console.error('Error en getServerSideProps:', error);
    
    return {
      props: {
        ventasData: {},
        comprasData: {},
        error: error.message
      }
    };
  }
}
