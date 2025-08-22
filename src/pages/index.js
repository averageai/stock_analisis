import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

export default function Dashboard({ testData, error: serverError }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(serverError || null);
  const [connectionStatus, setConnectionStatus] = useState({
    ladorada: { connected: false, data: null },
    manizales: { connected: false, data: null }
  });

  useEffect(() => {
    if (testData) {
      setConnectionStatus({
        ladorada: { 
          connected: testData.ladorada && testData.ladorada.total_ventas > 0, 
          data: testData.ladorada 
        },
        manizales: { 
          connected: testData.manizales && testData.manizales.total_ventas > 0, 
          data: testData.manizales 
        }
      });
    }
  }, [testData]);

  const formatNumber = (num) => {
    if (!num && num !== 0) return 'N/A';
    return num.toLocaleString('es-ES');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  return (
    <Layout title="Sistema de Análisis de Inventario - Landing Page">
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="card bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-500/30">
          <div className="card-header text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 flex items-center justify-center">
              <svg className="w-12 h-12 mr-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              Stock Análisis
            </h1>
            <p className="text-xl text-gray-300 mb-6">
              Sistema Inteligente de Análisis de Inventario Multi-Sede
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center space-x-2 bg-green-900/20 px-4 py-2 rounded-lg border border-green-700/30">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-300 font-medium">v1.0 Stable</span>
              </div>
              <div className="flex items-center space-x-2 bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-700/30">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-blue-300 font-medium">Multi-Sede</span>
              </div>
              <div className="flex items-center space-x-2 bg-purple-900/20 px-4 py-2 rounded-lg border border-purple-700/30">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-purple-300 font-medium">Actualización 24h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Estado de Conexión a Bases de Datos */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center">
              <svg className="w-6 h-6 mr-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Estado de Conexión
            </h2>
            <p className="text-gray-300">Monitoreo de las conexiones a las bases de datos con actualización diaria</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Conexión La Dorada */}
            <div className="bg-gray-800/30 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <span className={`w-3 h-3 rounded-full mr-2 ${connectionStatus.ladorada.connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  La Dorada
                </h3>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${connectionStatus.ladorada.connected ? 'bg-green-900/30 text-green-300 border border-green-700/30' : 'bg-red-900/30 text-red-300 border border-red-700/30'}`}>
                  {connectionStatus.ladorada.connected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Servidor:</span>
                  <span className="text-white font-mono">average.lat</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Base de datos:</span>
                  <span className="text-white font-mono">cristaleriaprod_complete</span>
                </div>
                {connectionStatus.ladorada.data && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total ventas:</span>
                      <span className="text-white font-bold">{formatNumber(connectionStatus.ladorada.data.total_ventas)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Productos vendidos:</span>
                      <span className="text-white font-bold">{formatNumber(connectionStatus.ladorada.data.productos_vendidos)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Última venta:</span>
                      <span className="text-white">{formatDate(connectionStatus.ladorada.data.ultima_venta)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Conexión Manizales */}
            <div className="bg-gray-800/30 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <span className={`w-3 h-3 rounded-full mr-2 ${connectionStatus.manizales.connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <svg className="w-5 h-5 mr-2 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  Manizales
                </h3>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${connectionStatus.manizales.connected ? 'bg-green-900/30 text-green-300 border border-green-700/30' : 'bg-red-900/30 text-red-300 border border-red-700/30'}`}>
                  {connectionStatus.manizales.connected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Servidor:</span>
                  <span className="text-white font-mono">average.lat</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Base de datos:</span>
                  <span className="text-white font-mono">crsitaleriamanizales_complete</span>
                </div>
                {connectionStatus.manizales.data && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total ventas:</span>
                      <span className="text-white font-bold">{formatNumber(connectionStatus.manizales.data.total_ventas)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Productos vendidos:</span>
                      <span className="text-white font-bold">{formatNumber(connectionStatus.manizales.data.productos_vendidos)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Última venta:</span>
                      <span className="text-white">{formatDate(connectionStatus.manizales.data.ultima_venta)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Funcionalidades del Sistema */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center">
              <svg className="w-6 h-6 mr-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Funcionalidades del Sistema
            </h2>
            <p className="text-gray-300">Herramientas avanzadas para el análisis y gestión de inventario</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Proyección de Compras */}
            <div className="bg-blue-900/20 p-6 rounded-lg border border-blue-700/30 hover:border-blue-500/50 transition-colors">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Proyección</h3>
              </div>
              <p className="text-gray-300 text-sm mb-4">
                Análisis predictivo de compras basado en historial de ventas y stock actual
              </p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Proyección de demanda</li>
                <li>• Sugerencias de compra</li>
                <li>• Análisis de rotación</li>
                <li>• Modo ignorar stock</li>
              </ul>
            </div>

            {/* Recompra Proveedor */}
            <div className="bg-green-900/20 p-6 rounded-lg border border-green-700/30 hover:border-green-500/50 transition-colors">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                    <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Recompra</h3>
              </div>
              <p className="text-gray-300 text-sm mb-4">
                Análisis de proveedores y recomendaciones de recompra inteligente
              </p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Análisis por proveedor</li>
                <li>• Historial de compras</li>
                <li>• Sugerencias automáticas</li>
                <li>• Exportación Excel</li>
              </ul>
            </div>

            {/* Productos Sin Movimiento */}
            <div className="bg-orange-900/20 p-6 rounded-lg border border-orange-700/30 hover:border-orange-500/50 transition-colors">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Sin Movimiento</h3>
              </div>
              <p className="text-gray-300 text-sm mb-4">
                Identificación de productos obsoletos y sin actividad reciente
              </p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Detección de obsolescencia</li>
                <li>• Análisis de inactividad</li>
                <li>• Valor de stock obsoleto</li>
                <li>• Filtros por período</li>
              </ul>
            </div>

            {/* Más Vendidos */}
            <div className="bg-purple-900/20 p-6 rounded-lg border border-purple-700/30 hover:border-purple-500/50 transition-colors">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Más Vendidos</h3>
              </div>
              <p className="text-gray-300 text-sm mb-4">
                Ranking de productos con mayor demanda y rendimiento de ventas
              </p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Ranking por cantidad</li>
                <li>• Análisis por valor</li>
                <li>• Frecuencia de venta</li>
                <li>• Gráficos dinámicos</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Guía de Interpretación */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center">
              <svg className="w-6 h-6 mr-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Guía de Interpretación de Reportes
            </h2>
            <p className="text-gray-300">Cómo leer y utilizar los análisis del sistema</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Estados y Colores */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Estados y Colores
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="text-gray-300">Verde: Estado óptimo, stock adecuado</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-300">Amarillo: Atención requerida, stock medio</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                  <span className="text-gray-300">Naranja: Crítico, stock bajo</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span className="text-gray-300">Rojo: Urgente, sin stock</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-300">Púrpura: Histórico, modo ignorar stock</span>
                </div>
              </div>
            </div>

            {/* Métricas Clave */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Métricas Clave
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-blue-400 font-medium">Días de Inventario:</span>
                  <span className="text-gray-300 ml-2">Tiempo estimado hasta agotar stock</span>
                </div>
                <div>
                  <span className="text-blue-400 font-medium">Frecuencia de Venta:</span>
                  <span className="text-gray-300 ml-2">Unidades vendidas por día</span>
                </div>
                <div>
                  <span className="text-blue-400 font-medium">Margen Real:</span>
                  <span className="text-gray-300 ml-2">Ganancia promedio vs costo</span>
                </div>
                <div>
                  <span className="text-blue-400 font-medium">Valor Obsoleto:</span>
                  <span className="text-gray-300 ml-2">Capital inmovilizado en productos sin movimiento</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recomendaciones */}
          <div className="mt-6 p-6 bg-blue-900/20 rounded-lg border border-blue-700/30">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Recomendaciones de Uso
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <ul className="space-y-2 text-gray-300">
                <li>• <strong>Proyección:</strong> Revisar semanalmente para planificar compras</li>
                <li>• <strong>Recompra:</strong> Analizar antes de hacer pedidos a proveedores</li>
                <li>• <strong>Sin Movimiento:</strong> Revisar mensualmente para limpiar inventario</li>
              </ul>
              <ul className="space-y-2 text-gray-300">
                <li>• <strong>Más Vendidos:</strong> Usar para identificar tendencias de demanda</li>
                <li>• <strong>Filtros:</strong> Ajustar rangos según necesidades específicas</li>
                <li>• <strong>Exportar:</strong> Generar reportes para análisis detallado</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Mostrar error si existe */}
        {error && (
          <div className="status-bar status-bar-danger">
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Error de Conexión
            </h3>
            <p>{error}</p>
          </div>
        )}
      </div>
    </Layout>
  );
}

// Función para obtener datos del servidor
export async function getServerSideProps() {
  try {
    const { testVentas } = require('../lib/database');
    
    // Obtener datos de test para ambas sedes
    const [testLadorada, testManizales] = await Promise.all([
      testVentas('ladorada'),
      testVentas('manizales')
    ]);
    
    return {
      props: {
        testData: {
          ladorada: testLadorada,
          manizales: testManizales
        }
      }
    };
  } catch (error) {
    console.error('Error en getServerSideProps:', error);
    
    return {
      props: {
        testData: {
          ladorada: null,
          manizales: null
        },
        error: error.message
      }
    };
  }
}
