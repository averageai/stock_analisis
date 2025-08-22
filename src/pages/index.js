import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import FilterPanel from '../components/FilterPanel';

export default function Dashboard({ productosIniciales, error: serverError }) {
  const [productos, setProductos] = useState(() => {
    // Asegurar que siempre tengamos un objeto válido
    if (productosIniciales && productosIniciales.ladorada && productosIniciales.manizales) {
      return productosIniciales;
    }
    return { ladorada: [], manizales: [] };
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(serverError || null);
  const [filtros, setFiltros] = useState({
    sede: 'ambas',
    categoria: 'todas',
    fechaInicio: '',
    fechaFin: '',
    stockMinimo: 0
  });

  const handleFilterChange = (nuevosFiltros) => {
    setFiltros(nuevosFiltros);
    // Aquí se implementaría la lógica de filtrado
  };

  const getStockStatus = (stock) => {
    if (stock <= 10) return { class: 'stock-bajo', text: 'Bajo', badge: 'badge-danger' };
    if (stock <= 50) return { class: 'stock-medio', text: 'Medio', badge: 'badge-warning' };
    return { class: 'stock-alto', text: 'Alto', badge: 'badge-success' };
  };

  const getSedeBadge = (sede) => {
    return sede === 'ladorada' ? 'sede-ladorada' : 'sede-manizales';
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return 'N/A';
    return `$${price.toFixed(2)}`;
  };

  return (
    <Layout title="Dashboard - Sistema de Análisis de Inventario">
      <div className="space-y-6">
        {/* Header Corporativo */}
        <div className="card">
          <div className="card-header">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <svg className="w-8 h-8 mr-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              Dashboard de Análisis de Inventario
            </h1>
            <p className="text-gray-300">
              Sistema de análisis multi-sede para La Dorada y Manizales
            </p>
          </div>
        </div>

        {/* Filtros */}
        <FilterPanel onFilterChange={handleFilterChange} />

        {/* Estado de Conexión */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <span className={`w-3 h-3 rounded-full mr-2 ${productos.ladorada && productos.ladorada.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Conexión La Dorada
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Base de datos:</span>
                <span className="text-white font-mono text-sm">cristaleriaprod_complete</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Servidor:</span>
                <span className="text-white font-mono text-sm">5.161.103.230:7717</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Productos cargados:</span>
                <span className="text-white font-bold">{productos.ladorada?.length || 0}</span>
              </div>
              <div className="mt-4">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${productos.ladorada && productos.ladorada.length > 0 ? 'badge-success' : 'badge-danger'}`}>
                  {productos.ladorada && productos.ladorada.length > 0 ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <span className={`w-3 h-3 rounded-full mr-2 ${productos.manizales && productos.manizales.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <svg className="w-5 h-5 mr-2 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Conexión Manizales
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Base de datos:</span>
                <span className="text-white font-mono text-sm">crsitaleriamanizales_complete</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Servidor:</span>
                <span className="text-white font-mono text-sm">5.161.103.230:7717</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Productos cargados:</span>
                <span className="text-white font-bold">{productos.manizales?.length || 0}</span>
              </div>
              <div className="mt-4">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${productos.manizales && productos.manizales.length > 0 ? 'badge-success' : 'badge-danger'}`}>
                  {productos.manizales && productos.manizales.length > 0 ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
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

        {/* Productos de Prueba */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Productos La Dorada */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                </svg>
                Productos - La Dorada
              </h3>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="loading-spinner mr-3"></div>
                <p className="text-gray-300">Cargando productos...</p>
              </div>
            ) : error ? (
              <p className="text-red-400">Error: {error}</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Precio</th>
                      <th>Stock</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.ladorada && productos.ladorada.length > 0 ? (
                      productos.ladorada.slice(0, 5).map((producto) => {
                        const stockStatus = getStockStatus(producto.stock);
                        return (
                          <tr key={producto.id}>
                            <td className="font-mono text-sm">{producto.id}</td>
                            <td className="font-medium">{producto.nombre || 'Sin nombre'}</td>
                            <td className="font-mono">{formatPrice(producto.precio)}</td>
                            <td className="font-bold">{producto.stock || 'N/A'}</td>
                            <td>
                              <span className={stockStatus.badge}>
                                {stockStatus.text}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center text-gray-400 py-8">
                          <svg className="w-12 h-12 mx-auto mb-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          No hay productos disponibles
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Productos Manizales */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <svg className="w-5 h-5 mr-2 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                </svg>
                Productos - Manizales
              </h3>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="loading-spinner mr-3"></div>
                <p className="text-gray-300">Cargando productos...</p>
              </div>
            ) : error ? (
              <p className="text-red-400">Error: {error}</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Precio</th>
                      <th>Stock</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.manizales && productos.manizales.length > 0 ? (
                      productos.manizales.slice(0, 5).map((producto) => {
                        const stockStatus = getStockStatus(producto.stock);
                        return (
                          <tr key={producto.id}>
                            <td className="font-mono text-sm">{producto.id}</td>
                            <td className="font-medium">{producto.nombre || 'Sin nombre'}</td>
                            <td className="font-mono">{formatPrice(producto.precio)}</td>
                            <td className="font-bold">{producto.stock || 'N/A'}</td>
                            <td>
                              <span className={stockStatus.badge}>
                                {stockStatus.text}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center text-gray-400 py-8">
                          <svg className="w-12 h-12 mx-auto mb-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          No hay productos disponibles
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Resumen de Conectividad */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
              </svg>
              Estado de Conectividad
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-900/20 rounded-lg border border-blue-700/30">
              <div className="text-2xl font-bold text-blue-400">
                {productos.ladorada?.length || 0}
              </div>
              <div className="text-sm text-gray-300">Productos La Dorada</div>
            </div>
            <div className="text-center p-4 bg-yellow-900/20 rounded-lg border border-yellow-700/30">
              <div className="text-2xl font-bold text-yellow-400">
                {productos.manizales?.length || 0}
              </div>
              <div className="text-sm text-gray-300">Productos Manizales</div>
            </div>
            <div className="text-center p-4 bg-green-900/20 rounded-lg border border-green-700/30">
              <div className="text-2xl font-bold text-green-400">
                {(productos.ladorada?.length || 0) + (productos.manizales?.length || 0)}
              </div>
              <div className="text-sm text-gray-300">Total Productos</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Función para obtener datos del servidor
export async function getServerSideProps() {
  try {
    const { getProductosAmbasSedes } = require('../lib/database');
    
    const productos = await getProductosAmbasSedes();
    
    return {
      props: {
        productosIniciales: productos
      }
    };
  } catch (error) {
    console.error('Error en getServerSideProps:', error);
    
    return {
      props: {
        productosIniciales: {
          ladorada: [],
          manizales: []
        },
        error: error.message
      }
    };
  }
}
