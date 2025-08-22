import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import * as XLSX from 'xlsx';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ValidacionProducto() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sede, setSede] = useState('ladorada');
  const [busqueda, setBusqueda] = useState('');
  const [productosEncontrados, setProductosEncontrados] = useState([]);
  const [productosAnalizados, setProductosAnalizados] = useState([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [ordenarPor, setOrdenarPor] = useState('vendido');
  const [ordenDireccion, setOrdenDireccion] = useState('desc');
  const [ignorarStock, setIgnorarStock] = useState(false);

  // Función para buscar productos
  const buscarProductos = async () => {
    if (!busqueda.trim()) {
      setError('Ingrese un código o nombre de producto');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/validacion-producto?sede=${sede}&action=buscar&busqueda=${encodeURIComponent(busqueda.trim())}`);
      const data = await response.json();
      
      if (data.success) {
        // Agregar nuevos productos a la lista existente, evitando duplicados
        setProductosEncontrados(prev => {
          const nuevosProductos = data.productos.filter(nuevo => 
            !prev.find(existente => existente.id === nuevo.id)
          );
          return [...prev, ...nuevosProductos];
        });
        setError(null);
        // Limpiar el campo de búsqueda después de agregar
        setBusqueda('');
      } else {
        setError(data.error || 'Error al buscar productos');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // Función para limpiar la lista de productos encontrados
  const limpiarProductosEncontrados = () => {
    setProductosEncontrados([]);
    setProductosSeleccionados([]);
  };

  // Función para eliminar un producto específico de la lista de productos encontrados
  const eliminarProductoEncontrado = (productId) => {
    setProductosEncontrados(prev => prev.filter(p => p.id !== productId));
    setProductosSeleccionados(prev => prev.filter(p => p.id !== productId));
  };

  // Función para seleccionar/deseleccionar un producto
  const toggleProductoSeleccionado = (producto) => {
    const existe = productosSeleccionados.find(p => p.id === producto.id);
    if (existe) {
      setProductosSeleccionados(prev => prev.filter(p => p.id !== producto.id));
    } else {
      setProductosSeleccionados(prev => [...prev, producto]);
    }
  };

  // Función para seleccionar todos los productos encontrados
  const seleccionarTodos = () => {
    setProductosSeleccionados(productosEncontrados);
  };

  // Función para deseleccionar todos
  const deseleccionarTodos = () => {
    setProductosSeleccionados([]);
  };

  // Función para analizar productos seleccionados
  const analizarProductosSeleccionados = async () => {
    if (productosSeleccionados.length === 0) {
      setError('No hay productos seleccionados para analizar');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const analisisPromises = productosSeleccionados.map(async (producto) => {
        const params = new URLSearchParams({
          sede: sede,
          productId: producto.id,
          ignorarStock: ignorarStock ? 'true' : 'false'
        });
        
        const response = await fetch(`/api/validacion-producto?${params}`);
        const data = await response.json();
        
        if (data.success) {
          return data.analisis;
        } else {
          throw new Error(`Error analizando ${producto.nombre}: ${data.error}`);
        }
      });

      const resultados = await Promise.all(analisisPromises);
      
      // Agregar nuevos productos analizados a la lista existente
      setProductosAnalizados(prev => {
        const nuevosProductos = resultados.filter(nuevo => 
          !prev.find(existente => existente.id === nuevo.id)
        );
        return [...prev, ...nuevosProductos];
      });
      
      // Limpiar productos seleccionados
      setProductosSeleccionados([]);
      setError(null);
    } catch (err) {
      setError(err.message || 'Error al analizar productos');
    } finally {
      setLoading(false);
    }
  };

  // Función para analizar un producto específico
  const analizarProducto = async (producto) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        sede: sede,
        productId: producto.id,
        ignorarStock: ignorarStock ? 'true' : 'false'
      });
      
      const response = await fetch(`/api/validacion-producto?${params}`);
      const data = await response.json();
      
      if (data.success) {
        // Verificar si el producto ya está en la lista
        const existe = productosAnalizados.find(p => p.id === producto.id);
        if (!existe) {
          setProductosAnalizados(prev => [...prev, data.analisis]);
        } else {
          // Actualizar el análisis existente
          setProductosAnalizados(prev => 
            prev.map(p => p.id === producto.id ? data.analisis : p)
          );
        }
        setError(null);
      } else {
        setError(data.error || 'Error al analizar producto');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar producto de la lista
  const eliminarProducto = (productId) => {
    setProductosAnalizados(prev => prev.filter(p => p.id !== productId));
  };

  // Función para limpiar toda la lista
  const limpiarLista = () => {
    setProductosAnalizados([]);
  };

  // Función para exportar a Excel
  const exportarExcel = () => {
    if (productosAnalizados.length === 0) {
      setError('No hay productos para exportar');
      return;
    }

    try {
      const datosExportar = productosAnalizados.map(item => ({
        'ID': item.id,
        'Nombre': item.nombre,
        'SKU': item.sku,
        'Código Interno': item.internal_code,
        'Costo': item.costo,
        'Precio Venta': item.precio_venta,
        'Stock Actual': item.stock_actual,
        'Stock Mínimo': item.minimum_stock,
        'Cantidad Comprada': item.cantidad_comprada,
        'Cantidad Vendida': item.cantidad_vendida,
        'Frecuencia Diaria': item.frecuencia_diaria,
        'Días Sin Venta': item.dias_sin_venta,
        'Días Inventario Restante': item.dias_inventario_restante,
        'Sugerencia Compra': item.sugerido_comprar,
        'Estado': item.estado,
        'Margen Ganancia (%)': item.margen_ganancia,
        'Última Venta': item.ultima_venta ? new Date(item.ultima_venta).toLocaleDateString('es-ES') : 'N/A',
        'Última Compra': item.ultima_compra ? new Date(item.ultima_compra).toLocaleDateString('es-ES') : 'N/A'
      }));

      const ws = XLSX.utils.json_to_sheet(datosExportar);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Validación Productos');
      
      const fileName = `validacion_productos_${sede}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      setError(null);
    } catch (err) {
      setError('Error al exportar archivo');
    }
  };

  // Filtrar y ordenar productos analizados
  let productosFiltrados = [...productosAnalizados];
  
  // Aplicar ordenamiento
  productosFiltrados.sort((a, b) => {
    let valorA, valorB;
    
    switch (ordenarPor) {
      case 'nombre':
        valorA = a.nombre.toLowerCase();
        valorB = b.nombre.toLowerCase();
        break;
      case 'vendido':
        valorA = a.cantidad_vendida || 0;
        valorB = b.cantidad_vendida || 0;
        break;
      case 'frecuencia':
        valorA = a.frecuencia_diaria || 0;
        valorB = b.frecuencia_diaria || 0;
        break;
      case 'stock':
        valorA = a.stock_actual || 0;
        valorB = b.stock_actual || 0;
        break;
      case 'dias_inventario':
        valorA = a.dias_inventario_restante || 999;
        valorB = b.dias_inventario_restante || 999;
        break;
      default:
        valorA = a.cantidad_vendida || 0;
        valorB = b.cantidad_vendida || 0;
    }
    
    if (ordenDireccion === 'asc') {
      return valorA > valorB ? 1 : -1;
    } else {
      return valorA < valorB ? 1 : -1;
    }
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return 'N/A';
    return `$${price.toFixed(2)}`;
  };

  const formatNumber = (num) => {
    if (!num && num !== 0) return 'N/A';
    return num.toLocaleString('es-ES');
  };

  const getUrgencyClass = (dias) => {
    if (dias === null) return 'text-gray-500';
    if (dias <= 7) return 'text-red-600 font-bold';
    if (dias <= 14) return 'text-orange-600 font-semibold';
    if (dias <= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getUrgencyText = (dias) => {
    if (dias === null) return 'HISTÓRICO';
    if (dias <= 7) return 'CRÍTICO';
    if (dias <= 14) return 'URGENTE';
    if (dias <= 30) return 'ATENCIÓN';
    return 'OK';
  };

  const isProductoSeleccionado = (producto) => {
    return productosSeleccionados.find(p => p.id === producto.id);
  };

  return (
    <Layout title="Validación Producto a Producto - Sistema de Análisis de Inventario">
      <div className="space-y-6">
        {/* Header */}
        <div className="card">
          <div className="card-header">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <svg className="w-8 h-8 mr-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              Validación Producto a Producto
            </h1>
            <p className="text-gray-300">
              Analiza productos específicos para validar su rendimiento y proyección de compras
            </p>
          </div>
        </div>

        {/* Controles de búsqueda */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              Búsqueda de Productos
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="label-corporate block mb-2">
                Sede:
              </label>
              <select
                value={sede}
                onChange={(e) => setSede(e.target.value)}
                className="select-corporate w-full"
              >
                <option value="ladorada">La Dorada</option>
                <option value="manizales">Manizales</option>
              </select>
            </div>
            
            <div>
              <label className="label-corporate block mb-2">
                Buscar por código o nombre:
              </label>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="SKU, código interno o nombre..."
                className="input-corporate w-full"
                onKeyPress={(e) => e.key === 'Enter' && buscarProductos()}
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={buscarProductos}
                disabled={loading || !busqueda.trim()}
                className="btn-primary w-full"
              >
                {loading ? 'Buscando...' : 'Buscar Productos'}
              </button>
            </div>
          </div>

          {/* Opción para ignorar stock */}
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={ignorarStock}
                onChange={(e) => setIgnorarStock(e.target.checked)}
                className="mr-2"
              />
              <span className="text-gray-300">Ignorar stock actual en análisis</span>
            </label>
          </div>
        </div>

        {/* Resultados de búsqueda */}
        {productosEncontrados.length > 0 && (
          <div className="card">
            <div className="card-header">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                  </svg>
                  Productos Encontrados ({productosEncontrados.length})
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={seleccionarTodos}
                    className="btn-secondary btn-sm"
                    disabled={productosEncontrados.length === 0}
                  >
                    Seleccionar Todos
                  </button>
                  <button
                    onClick={deseleccionarTodos}
                    className="btn-secondary btn-sm"
                    disabled={productosSeleccionados.length === 0}
                  >
                    Deseleccionar Todos
                  </button>
                  <button
                    onClick={analizarProductosSeleccionados}
                    className="btn-primary btn-sm"
                    disabled={loading || productosSeleccionados.length === 0}
                  >
                    {loading ? 'Analizando...' : `Analizar ${productosSeleccionados.length} Productos`}
                  </button>
                  <button
                    onClick={limpiarProductosEncontrados}
                    className="btn-danger btn-sm"
                    disabled={productosEncontrados.length === 0}
                  >
                    Limpiar Lista
                  </button>
                </div>
              </div>
            </div>
            
            <div className="table-container">
              <table className="table-corporate">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={productosSeleccionados.length === productosEncontrados.length && productosEncontrados.length > 0}
                        onChange={(e) => e.target.checked ? seleccionarTodos() : deseleccionarTodos()}
                        className="mr-2"
                      />
                    </th>
                    <th>Nombre</th>
                    <th>SKU</th>
                    <th>Código Interno</th>
                    <th>Stock Actual</th>
                    <th>Stock Mínimo</th>
                    <th>Analizar</th>
                    <th>Eliminar</th>
                  </tr>
                </thead>
                <tbody>
                  {productosEncontrados.map((producto) => (
                    <tr key={producto.id} className={isProductoSeleccionado(producto) ? 'bg-blue-900/20' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={isProductoSeleccionado(producto)}
                          onChange={() => toggleProductoSeleccionado(producto)}
                          className="mr-2"
                        />
                      </td>
                      <td className="font-medium">{producto.nombre}</td>
                      <td className="font-mono text-sm">{producto.sku}</td>
                      <td className="font-mono text-sm">{producto.internal_code}</td>
                      <td className={producto.stock_actual <= producto.minimum_stock ? 'text-red-500 font-semibold' : ''}>
                        {formatNumber(producto.stock_actual)}
                      </td>
                      <td>{formatNumber(producto.minimum_stock)}</td>
                      <td>
                        <button
                          onClick={() => analizarProducto(producto)}
                          disabled={loading}
                          className="btn-secondary btn-sm"
                        >
                          {loading ? 'Analizando...' : 'Analizar'}
                        </button>
                      </td>
                      <td>
                        <button
                          onClick={() => eliminarProductoEncontrado(producto.id)}
                          className="btn-danger btn-sm"
                          title="Eliminar de la lista"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Productos analizados */}
        {productosAnalizados.length > 0 && (
          <div className="card">
            <div className="card-header">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                  </svg>
                  Productos Analizados ({productosAnalizados.length})
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={exportarExcel}
                    className="btn-success btn-sm"
                  >
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Exportar Excel
                  </button>
                  <button
                    onClick={limpiarLista}
                    className="btn-danger btn-sm"
                  >
                    Limpiar Lista
                  </button>
                </div>
              </div>
            </div>

            {/* Controles de ordenamiento */}
            <div className="mb-4 flex flex-wrap gap-4">
              <div>
                <label className="label-corporate block mb-1">Ordenar por:</label>
                <select
                  value={ordenarPor}
                  onChange={(e) => setOrdenarPor(e.target.value)}
                  className="select-corporate"
                >
                  <option value="vendido">Cantidad Vendida</option>
                  <option value="frecuencia">Frecuencia Diaria</option>
                  <option value="stock">Stock Actual</option>
                  <option value="dias_inventario">Días Inventario</option>
                  <option value="nombre">Nombre</option>
                </select>
              </div>
              <div>
                <label className="label-corporate block mb-1">Dirección:</label>
                <select
                  value={ordenDireccion}
                  onChange={(e) => setOrdenDireccion(e.target.value)}
                  className="select-corporate"
                >
                  <option value="desc">Descendente</option>
                  <option value="asc">Ascendente</option>
                </select>
              </div>
            </div>
            
            <div className="table-container">
              <table className="table-corporate">
                <thead>
                  <tr>
                    <th>Acción</th>
                    <th>Nombre</th>
                    <th>SKU</th>
                    <th>Stock</th>
                    <th>Vendido</th>
                    <th>Frecuencia</th>
                    <th>Días Sin Venta</th>
                    <th>Días Inventario</th>
                    <th>Sugerencia</th>
                    <th>Estado</th>
                    <th>Margen (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {productosFiltrados.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <button
                          onClick={() => eliminarProducto(item.id)}
                          className="btn-danger btn-sm"
                          title="Eliminar de la lista"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </td>
                      <td className="font-medium">{item.nombre}</td>
                      <td className="font-mono text-sm">{item.sku}</td>
                      <td className={item.stock_actual <= item.minimum_stock ? 'text-red-500 font-semibold' : ''}>
                        {formatNumber(item.stock_actual)}
                      </td>
                      <td>{formatNumber(item.cantidad_vendida)}</td>
                      <td>{formatNumber(item.frecuencia_diaria)}</td>
                      <td>{formatNumber(item.dias_sin_venta)}</td>
                      <td className={getUrgencyClass(item.dias_inventario_restante)}>
                        {item.dias_inventario_restante !== null ? formatNumber(item.dias_inventario_restante) : 'HISTÓRICO'}
                      </td>
                                              <td>{formatNumber(item.sugerido_comprar)}</td>
                      <td>
                        {item.dias_inventario_restante !== null ? (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUrgencyClass(item.dias_inventario_restante).replace('text-', 'bg-').replace('font-bold', '').replace('font-semibold', '')} bg-opacity-10`}>
                            {getUrgencyText(item.dias_inventario_restante)}
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-500 bg-opacity-10 text-gray-500">
                            HISTÓRICO
                          </span>
                        )}
                      </td>
                                              <td>{formatNumber(item.margen_ganancia)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Resumen */}
        {productosAnalizados.length > 0 && (
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-number metric-total">
                {productosAnalizados.length}
              </div>
              <div className="metric-label">Total Productos</div>
            </div>
            <div className="metric-card">
              <div className="metric-number metric-critical">
                {productosAnalizados.filter(item => item.dias_inventario_restante !== null && item.dias_inventario_restante <= 7).length}
              </div>
              <div className="metric-label">Críticos (≤7 días)</div>
            </div>
            <div className="metric-card">
              <div className="metric-number metric-urgent">
                {productosAnalizados.filter(item => item.dias_inventario_restante !== null && item.dias_inventario_restante > 7 && item.dias_inventario_restante <= 14).length}
              </div>
              <div className="metric-label">Urgentes (8-14 días)</div>
            </div>
            <div className="metric-card">
              <div className="metric-number metric-ok">
                {productosAnalizados.filter(item => item.dias_inventario_restante !== null && item.dias_inventario_restante > 30).length}
              </div>
              <div className="metric-label">OK (&gt;30 días)</div>
            </div>
            <div className="metric-card">
              <div className="metric-number metric-historical">
                {productosAnalizados.filter(item => item.dias_inventario_restante === null).length}
              </div>
              <div className="metric-label">Histórico</div>
            </div>
          </div>
        )}

        {/* Explicación de la Lógica */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
              </svg>
              Lógica de Validación Producto a Producto
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold mb-2 text-blue-400">🎯 Objetivo:</h4>
              <p className="mb-2 text-gray-300">Analizar productos específicos para validar su rendimiento y proyectar necesidades de compra individuales.</p>
              
              <h4 className="font-semibold mb-2 text-blue-400">📈 Cálculo de Frecuencia:</h4>
              <p className="mb-2 text-gray-300">Frecuencia diaria = Total vendido desde primera compra ÷ Días transcurridos desde primera compra</p>
              
              <h4 className="font-semibold mb-2 text-blue-400">🛒 Sugerencia de Compra:</h4>
              <p className="mb-2 text-gray-300">Proyección 30 días + 20% margen de seguridad - Stock actual</p>
              
              <h4 className="font-semibold mb-2 text-blue-400">📊 Modo Ignorar Stock (La Dorada):</h4>
              <p className="text-gray-300">Cuando está habilitado, el análisis se basa únicamente en cantidades compradas y vendidas, sin considerar inventario actual.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-blue-400">🔍 Funcionalidades:</h4>
              <ul className="space-y-1 text-gray-300">
                <li>• <strong>Búsqueda flexible:</strong> Por SKU, código interno o nombre</li>
                <li>• <strong>Selección múltiple:</strong> Seleccionar varios productos para análisis masivo</li>
                <li>• <strong>Análisis individual:</strong> Cada producto se analiza por separado</li>
                <li>• <strong>Lista personalizada:</strong> Agregar/eliminar productos según necesidad</li>
                <li>• <strong>Exportación:</strong> Generar reportes Excel detallados</li>
                <li>• <strong>Ordenamiento:</strong> Múltiples criterios de ordenamiento</li>
              </ul>
              
              <h4 className="font-semibold mb-2 mt-4 text-blue-400">💰 Métricas Incluidas:</h4>
              <ul className="space-y-1 text-gray-300">
                <li>• Margen de ganancia real</li>
                <li>• Historial de compras y ventas</li>
                <li>• Proyección de demanda individual</li>
                <li>• Estado de urgencia por producto</li>
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
              Error
            </h3>
            <p>{error}</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
