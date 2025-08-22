import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import * as XLSX from 'xlsx';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function MasVendidos() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroSede, setFiltroSede] = useState('ladorada');
  const [rangoAnalisis, setRangoAnalisis] = useState(30);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [modoRango, setModoRango] = useState('predefinido');
  const [tipoAnalisis, setTipoAnalisis] = useState('cantidad');
  const [ordenarPor, setOrdenarPor] = useState('cantidad_vendida');
  const [ordenDireccion, setOrdenDireccion] = useState('desc');
  const [ignorarStock, setIgnorarStock] = useState(false);

  // Efecto para cargar datos iniciales
  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  // Efecto para recargar datos cuando cambien los filtros
  useEffect(() => {
    if (productos.length > 0) {
      recargarDatos();
    }
  }, [rangoAnalisis, modoRango, fechaInicio, fechaFin, filtroSede, tipoAnalisis, ignorarStock]);

  // Función para cargar datos iniciales
  const cargarDatosIniciales = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sede: filtroSede,
        rango: rangoAnalisis,
        modo: modoRango,
        fechaInicio: fechaInicio,
        fechaFin: fechaFin,
        tipoAnalisis: tipoAnalisis,
        ignorarStock: ignorarStock ? 'true' : 'false'
      });
      
      const response = await fetch(`/api/mas-vendidos?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setProductos(data.productosMasVendidos);
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

  // Función para recargar datos con nuevos filtros
  const recargarDatos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sede: filtroSede,
        rango: rangoAnalisis,
        modo: modoRango,
        fechaInicio: fechaInicio,
        fechaFin: fechaFin,
        tipoAnalisis: tipoAnalisis,
        ignorarStock: ignorarStock ? 'true' : 'false'
      });
      
      const response = await fetch(`/api/mas-vendidos?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setProductos(data.productosMasVendidos);
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return 'N/A';
    return `$${price.toLocaleString('es-ES')}`;
  };

  const formatNumber = (num) => {
    if (!num && num !== 0) return 'N/A';
    return num.toLocaleString('es-ES');
  };

  const getStockClass = (stock, minimum) => {
    if (stock <= 0) return 'text-red-600 font-bold';
    if (stock <= minimum) return 'text-orange-600 font-semibold';
    if (stock <= minimum * 2) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStockText = (stock, minimum) => {
    if (stock <= 0) return 'SIN STOCK';
    if (stock <= minimum) return 'BAJO';
    if (stock <= minimum * 2) return 'MEDIO';
    return 'OK';
  };

  // Filtrar datos según sede seleccionada
  let datosFiltrados = productos.filter(item => item.sede === filtroSede);
  
  // Aplicar ordenamiento
  datosFiltrados.sort((a, b) => {
    let valorA, valorB;
    
    switch (ordenarPor) {
      case 'nombre':
        valorA = a.nombre.toLowerCase();
        valorB = b.nombre.toLowerCase();
        break;
      case 'valor_vendido':
        valorA = a.valor_vendido;
        valorB = b.valor_vendido;
        break;
      case 'numero_ventas':
        valorA = a.numero_ventas;
        valorB = b.numero_ventas;
        break;
      case 'frecuencia_venta_diaria':
        valorA = a.frecuencia_venta_diaria;
        valorB = b.frecuencia_venta_diaria;
        break;
      case 'cantidad_vendida':
      default:
        valorA = a.cantidad_vendida;
        valorB = b.cantidad_vendida;
        break;
    }
    
    if (ordenDireccion === 'asc') {
      return valorA > valorB ? 1 : -1;
    } else {
      return valorA < valorB ? 1 : -1;
    }
  });

  // Top 10 productos más vendidos para el gráfico
  const top10Vendidos = datosFiltrados.slice(0, 10);

  // Datos para el gráfico
  const chartData = {
    labels: top10Vendidos.map(item => item.nombre.substring(0, 20) + '...'),
    datasets: [
      {
        label: tipoAnalisis === 'valor' ? 'Valor Vendido ($)' : 'Cantidad Vendida',
        data: top10Vendidos.map(item => tipoAnalisis === 'valor' ? item.valor_vendido : item.cantidad_vendida),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#ffffff',
          font: {
            size: 12,
            weight: '500'
          },
          padding: 20
        }
      },
      title: {
        display: true,
        text: `Top 10 Productos Más Vendidos por ${tipoAnalisis === 'valor' ? 'Valor' : 'Cantidad'}`,
        color: '#ffffff',
        font: {
          size: 16,
          weight: '600'
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#b8c2cc',
          font: {
            size: 11
          }
        },
        grid: {
          color: '#495057',
          drawBorder: false
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: tipoAnalisis === 'valor' ? 'Valor ($)' : 'Cantidad',
          color: '#ffffff',
          font: {
            size: 12,
            weight: '500'
          }
        },
        ticks: {
          color: '#b8c2cc',
          font: {
            size: 11
          }
        },
        grid: {
          color: '#495057',
          drawBorder: false
        }
      },
    },
  };

  return (
    <Layout title="Productos Más Vendidos - Sistema de Análisis de Inventario">
      <div className="space-y-6">
        {/* Header */}
        <div className="card">
          <div className="card-header">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <svg className="w-8 h-8 mr-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
              </svg>
              Productos Más Vendidos
            </h1>
            <p className="text-gray-300">
              Análisis de productos con mayor demanda y rendimiento de ventas
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
              Filtros de Análisis
            </h3>
          </div>
          
          {/* Configuración Principal */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Sede */}
            <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
              <label className="label-corporate block mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Sede
              </label>
              <select
                value={filtroSede}
                onChange={(e) => setFiltroSede(e.target.value)}
                className="select-corporate w-full"
              >
                <option value="ladorada">La Dorada</option>
                <option value="manizales">Manizales</option>
              </select>
            </div>

            {/* Tipo de Análisis */}
            <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
              <label className="label-corporate block mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                </svg>
                Tipo de Análisis
              </label>
              <select
                value={tipoAnalisis}
                onChange={(e) => setTipoAnalisis(e.target.value)}
                className="select-corporate w-full"
              >
                <option value="cantidad">Por Cantidad</option>
                <option value="valor">Por Valor</option>
              </select>
            </div>

            {/* Modo de Rango */}
            <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
              <label className="label-corporate block mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Tipo de Rango
              </label>
              <select
                value={modoRango}
                onChange={(e) => setModoRango(e.target.value)}
                className="select-corporate w-full"
              >
                <option value="predefinido">Predefinido</option>
                <option value="personalizado">Personalizado</option>
              </select>
            </div>

            {/* Rango Predefinido */}
            {modoRango === 'predefinido' && (
              <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
                <label className="label-corporate block mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Rango de Análisis
                </label>
                <select
                  value={rangoAnalisis}
                  onChange={(e) => setRangoAnalisis(parseInt(e.target.value))}
                  className="select-corporate w-full"
                >
                  <option value={15}>Últimos 15 días</option>
                  <option value={30}>Últimos 30 días</option>
                  <option value={60}>Últimos 60 días</option>
                  <option value={90}>Últimos 90 días</option>
                </select>
              </div>
            )}

            {/* Fechas Personalizadas */}
            {modoRango === 'personalizado' && (
              <>
                <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
                  <label className="label-corporate block mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="input-corporate w-full"
                  />
                </div>
                <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
                  <label className="label-corporate block mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="input-corporate w-full"
                  />
                </div>
              </>
            )}
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

          {/* Ordenamiento */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
              <label className="label-corporate block mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                </svg>
                Ordenamiento
              </label>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Ordenar por:</label>
                  <select
                    value={ordenarPor}
                    onChange={(e) => setOrdenarPor(e.target.value)}
                    className="select-corporate w-full"
                  >
                    <option value="cantidad_vendida">Cantidad Vendida</option>
                    <option value="valor_vendido">Valor Vendido</option>
                    <option value="numero_ventas">Número de Ventas</option>
                    <option value="frecuencia_venta_diaria">Frecuencia Diaria</option>
                    <option value="nombre">Nombre</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Dirección:</label>
                  <select
                    value={ordenDireccion}
                    onChange={(e) => setOrdenDireccion(e.target.value)}
                    className="select-corporate w-full"
                  >
                    <option value="desc">Descendente (Más vendido)</option>
                    <option value="asc">Ascendente (Menos vendido)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Botón de Actualizar */}
          <div className="flex justify-center mt-6">
            <button
              onClick={recargarDatos}
              disabled={loading}
              className="btn-primary px-8 py-3 text-lg font-semibold flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>Actualizando...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  <span>Actualizar Análisis</span>
                </>
              )}
            </button>
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

        {/* Gráfico */}
        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">
              <svg className="chart-icon" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
              </svg>
              Gráfico de Productos Más Vendidos
            </h3>
          </div>
          {top10Vendidos.length > 0 ? (
            <div className="chart-wrapper chart-dark-theme">
              <Bar data={chartData} options={chartOptions} />
            </div>
          ) : (
            <div className="chart-no-data">
              <svg className="chart-no-data-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="chart-no-data-text">
                No hay datos de ventas para mostrar
              </p>
            </div>
          )}
        </div>

        {/* Tabla de Productos Más Vendidos */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
              Ranking de Productos Más Vendidos
            </h3>
            <div className="label-corporate-secondary">
              {datosFiltrados.length} productos mostrados
              <span className="ml-2">
                • Análisis por: {tipoAnalisis === 'cantidad' ? 'Cantidad' : 'Valor'}
              </span>
              <span className="ml-2">
                • Ordenado por: {ordenarPor === 'cantidad_vendida' ? 'Cantidad' : 
                                ordenarPor === 'valor_vendido' ? 'Valor' : 
                                ordenarPor === 'numero_ventas' ? 'Número Ventas' :
                                ordenarPor === 'frecuencia_venta_diaria' ? 'Frecuencia' : 'Nombre'} 
                ({ordenDireccion === 'asc' ? 'A-Z' : 'Z-A'})
              </span>
            </div>
          </div>
          
          {loading ? (
            <div className="chart-loading">
              <p className="chart-loading-text">Cargando datos...</p>
            </div>
          ) : error ? (
            <div className="status-bar status-bar-danger">
              <p>Error: {error}</p>
            </div>
          ) : (
            <div className="table-container">
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-gray-300">
                  Mostrando {datosFiltrados.length} productos más vendidos
                </div>
                <button
                  onClick={() => {
                    const datosExcel = datosFiltrados.map((item, index) => ({
                      'Ranking': index + 1,
                      'Nombre': item.nombre,
                      'SKU': item.sku || 'N/A',
                      'Código': item.internal_code || 'N/A',
                      'Descripción': item.descripcion || 'N/A',
                      'Cantidad Vendida': item.cantidad_vendida,
                      'Valor Vendido': item.valor_vendido,
                      'Número de Ventas': item.numero_ventas,
                      'Frecuencia Diaria': item.frecuencia_venta_diaria.toFixed(2),
                      'Stock Actual': item.stock_actual,
                      'Stock Mínimo': item.minimum_stock,
                      'Margen Real (%)': item.margen_real.toFixed(1),
                      'Margen Teórico (%)': item.margen_ganancia.toFixed(1),
                      'Primera Venta': item.primera_venta_en_rango ? new Date(item.primera_venta_en_rango).toLocaleDateString('es-ES') : 'N/A',
                      'Última Venta': item.ultima_venta_en_rango ? new Date(item.ultima_venta_en_rango).toLocaleDateString('es-ES') : 'N/A',
                      'Estado Stock': item.stock_actual <= 0 ? 'SIN STOCK' :
                                    item.stock_actual <= item.minimum_stock ? 'BAJO' :
                                    item.stock_actual <= item.minimum_stock * 2 ? 'MEDIO' : 'OK'
                    }));
                    
                    const wb = XLSX.utils.book_new();
                    const ws = XLSX.utils.json_to_sheet(datosExcel);
                    XLSX.utils.book_append_sheet(wb, ws, 'Más Vendidos');
                    
                    const fecha = new Date().toISOString().split('T')[0];
                    const nombreArchivo = `Mas_Vendidos_${tipoAnalisis === 'valor' ? 'Por_Valor' : 'Por_Cantidad'}_${fecha}.xlsx`;
                    XLSX.writeFile(wb, nombreArchivo);
                  }}
                  className="btn-secondary px-4 py-2 text-sm flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Exportar Excel</span>
                </button>
              </div>
              
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Producto {ordenarPor === 'nombre' && (ordenDireccion === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Cantidad Vendida {ordenarPor === 'cantidad_vendida' && (ordenDireccion === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Valor Vendido {ordenarPor === 'valor_vendido' && (ordenDireccion === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Número Ventas {ordenarPor === 'numero_ventas' && (ordenDireccion === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Frecuencia/día {ordenarPor === 'frecuencia_venta_diaria' && (ordenDireccion === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Stock Actual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Margen %
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Estado Stock
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {datosFiltrados.length > 0 ? (
                    datosFiltrados.slice(0, 100).map((item, index) => (
                      <tr key={`${item.id}-${item.sede}`} className={index < 3 ? 'bg-yellow-900/10' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-white flex items-center">
                              {index < 3 && (
                                <span className="mr-2 text-yellow-400 font-bold">#{index + 1}</span>
                              )}
                              {item.nombre}
                            </div>
                            <div className="text-sm text-gray-300">
                              SKU: {item.sku || 'N/A'} | Código: {item.internal_code || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-400">
                              {item.descripcion}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          <div className="font-medium">{formatNumber(item.cantidad_vendida)}</div>
                          <div className="text-xs text-gray-300">
                            {formatDate(item.primera_venta_en_rango)} - {formatDate(item.ultima_venta_en_rango)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          <div className="font-medium">{formatPrice(item.valor_vendido)}</div>
                          <div className="text-xs text-gray-300">
                            Promedio: {formatPrice(item.precio_promedio_venta)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {formatNumber(item.numero_ventas)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {item.frecuencia_venta_diaria.toFixed(2)}/día
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          <div>
                            <div className="font-medium">{formatNumber(item.stock_actual)}</div>
                            <div className="text-xs text-gray-300">
                              Mínimo: {formatNumber(item.minimum_stock)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          <div>
                            <div className="text-green-600 font-medium">
                              {item.margen_real.toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-300">
                              Teórico: {item.margen_ganancia.toFixed(1)}%
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStockClass(item.stock_actual, item.minimum_stock).replace('text-', 'bg-').replace('font-bold', '').replace('font-semibold', '')} bg-opacity-10`}>
                            {getStockText(item.stock_actual, item.minimum_stock)}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-6 py-4 text-center text-gray-300">
                        No hay datos de ventas disponibles
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Explicación de la Lógica */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
              </svg>
              Lógica de Productos Más Vendidos
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold mb-2 text-blue-400">🎯 Objetivo:</h4>
              <p className="mb-2 text-gray-300">Identificar los productos con mayor demanda y rendimiento de ventas para optimizar el inventario y estrategias comerciales.</p>
              
              <h4 className="font-semibold mb-2 text-blue-400">📊 Tipos de Análisis:</h4>
              <ul className="space-y-1 text-gray-300">
                <li>• <strong>Por Cantidad:</strong> Productos con mayor volumen de unidades vendidas</li>
                <li>• <strong>Por Valor:</strong> Productos con mayor facturación total</li>
              </ul>
              
              <h4 className="font-semibold mb-2 text-blue-400">📈 Métricas Calculadas:</h4>
              <ul className="space-y-1 text-gray-300">
                <li>• <strong>Frecuencia diaria:</strong> Cantidad vendida ÷ Días del rango</li>
                <li>• <strong>Margen real:</strong> (Precio promedio venta - Costo) ÷ Precio promedio venta</li>
                <li>• <strong>Estado de stock:</strong> Comparación con stock mínimo</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-blue-400">🏆 Ranking y Destacados:</h4>
              <ul className="space-y-1 text-gray-300">
                <li>• <strong>Top 3:</strong> Productos destacados con fondo especial</li>
                <li>• <strong>Límite:</strong> Máximo 100 productos para rendimiento</li>
                <li>• <strong>Filtro automático:</strong> Solo productos con ventas desde 2024</li>
              </ul>
              
              <h4 className="font-semibold mb-2 mt-4 text-blue-400">🔍 Filtros Disponibles:</h4>
              <ul className="space-y-1 text-gray-300">
                <li>• <strong>Rango de tiempo:</strong> 15, 30, 60 o 90 días</li>
                <li>• <strong>Tipo de análisis:</strong> Cantidad o valor</li>
                <li>• <strong>Ordenamiento:</strong> Múltiples criterios disponibles</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Resumen */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-number metric-total">
              {datosFiltrados.length}
            </div>
            <div className="metric-label">Total Productos</div>
          </div>
          <div className="metric-card">
            <div className="metric-number metric-critical">
              {formatNumber(datosFiltrados.reduce((sum, item) => sum + item.cantidad_vendida, 0))}
            </div>
            <div className="metric-label">Total Cantidad Vendida</div>
          </div>
          <div className="metric-card">
            <div className="metric-number metric-urgent">
              {formatPrice(datosFiltrados.reduce((sum, item) => sum + item.valor_vendido, 0))}
            </div>
            <div className="metric-label">Total Valor Vendido</div>
          </div>
          <div className="metric-card">
            <div className="metric-number metric-ok">
              {formatNumber(datosFiltrados.reduce((sum, item) => sum + item.numero_ventas, 0))}
            </div>
            <div className="metric-label">Total Transacciones</div>
          </div>
          <div className="metric-card">
            <div className="metric-number metric-historical">
              {formatPrice(datosFiltrados.reduce((sum, item) => sum + (item.valor_vendido * (item.margen_real / 100)), 0))}
            </div>
            <div className="metric-label">Ganancia Total</div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
