import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ProductosSinMovimiento({ productosIniciales, error: serverError }) {
  const [productos, setProductos] = useState(() => {
    if (productosIniciales && Array.isArray(productosIniciales)) {
      return productosIniciales;
    }
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(serverError || null);
  const [filtroSede, setFiltroSede] = useState('ladorada');
  const [rangoAnalisis, setRangoAnalisis] = useState(30);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [modoRango, setModoRango] = useState('predefinido');
  const [filtroTipoInactividad, setFiltroTipoInactividad] = useState(['todos']);
  const [ordenarPor, setOrdenarPor] = useState('dias_sin_actividad');
  const [ordenDireccion, setOrdenDireccion] = useState('desc');

  // Efecto para recargar datos cuando cambien los filtros
  useEffect(() => {
    if (productosIniciales && productosIniciales.length > 0) {
      recargarDatos();
    }
  }, [rangoAnalisis, modoRango, fechaInicio, fechaFin, filtroSede]);

  // Función para recargar datos con nuevos filtros
  const recargarDatos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sede: filtroSede,
        rango: rangoAnalisis,
        modo: modoRango,
        fechaInicio: fechaInicio,
        fechaFin: fechaFin
      });
      
      const response = await fetch(`/api/productos-sin-movimiento?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setProductos(data.productosSinMovimiento);
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

  // Funciones para manejar selección múltiple de tipos de inactividad
  const handleTipoInactividadChange = (tipo) => {
    if (tipo === 'todos') {
      setFiltroTipoInactividad(['todos']);
    } else {
      const newTipos = filtroTipoInactividad.includes('todos') 
        ? [tipo] 
        : filtroTipoInactividad.includes(tipo)
        ? filtroTipoInactividad.filter(t => t !== tipo)
        : [...filtroTipoInactividad, tipo];
      
      setFiltroTipoInactividad(newTipos.length === 0 ? ['todos'] : newTipos);
    }
  };

  const isTipoSelected = (tipo) => {
    return filtroTipoInactividad.includes(tipo);
  };

  const getInactividadClass = (dias) => {
    if (dias >= 90) return 'text-red-600 font-bold';
    if (dias >= 60) return 'text-orange-600 font-semibold';
    if (dias >= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getInactividadText = (dias) => {
    if (dias >= 90) return 'MUY OBSOLETO';
    if (dias >= 60) return 'OBSOLETO';
    if (dias >= 30) return 'INACTIVO';
    return 'ACTIVO';
  };

  // Filtrar datos según sede seleccionada y tipo de inactividad
  let datosFiltrados = productos.filter(item => item.sede === filtroSede);
  
  // Aplicar filtro de tipo de inactividad
  if (!filtroTipoInactividad.includes('todos')) {
    datosFiltrados = datosFiltrados.filter(item => {
      return filtroTipoInactividad.some(tipo => {
        return item.tipo_inactividad.includes(tipo);
      });
    });
  }
  
  // Aplicar ordenamiento
  datosFiltrados.sort((a, b) => {
    let valorA, valorB;
    
    switch (ordenarPor) {
      case 'nombre':
        valorA = a.nombre.toLowerCase();
        valorB = b.nombre.toLowerCase();
        break;
      case 'stock_actual':
        valorA = a.stock_actual;
        valorB = b.stock_actual;
        break;
      case 'valor_stock_obsoleto':
        valorA = a.valor_stock_obsoleto;
        valorB = b.valor_stock_obsoleto;
        break;
      case 'dias_sin_actividad':
      default:
        valorA = a.dias_sin_actividad;
        valorB = b.dias_sin_actividad;
        break;
    }
    
    if (ordenDireccion === 'asc') {
      return valorA > valorB ? 1 : -1;
    } else {
      return valorA < valorB ? 1 : -1;
    }
  });

  // Top 10 productos más obsoletos para el gráfico
  const top10Obsoletos = datosFiltrados
    .sort((a, b) => b.dias_sin_actividad - a.dias_sin_actividad)
    .slice(0, 10);

  // Datos para el gráfico
  const chartData = {
    labels: top10Obsoletos.map(item => item.nombre.substring(0, 20) + '...'),
    datasets: [
      {
        label: 'Días Sin Actividad',
        data: top10Obsoletos.map(item => item.dias_sin_actividad),
        backgroundColor: top10Obsoletos.map(item => {
          if (item.dias_sin_actividad >= 90) return 'rgba(239, 68, 68, 0.8)';
          if (item.dias_sin_actividad >= 60) return 'rgba(249, 115, 22, 0.8)';
          return 'rgba(245, 158, 11, 0.8)';
        }),
        borderColor: top10Obsoletos.map(item => {
          if (item.dias_sin_actividad >= 90) return 'rgb(239, 68, 68)';
          if (item.dias_sin_actividad >= 60) return 'rgb(249, 115, 22)';
          return 'rgb(245, 158, 11)';
        }),
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
        text: 'Top 10 Productos Más Obsoletos',
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
          text: 'Días Sin Actividad',
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
    <Layout title="Productos Sin Movimiento - Sistema de Análisis de Inventario">
      <div className="space-y-6">
        {/* Header */}
        <div className="card">
          <div className="card-header">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <svg className="w-8 h-8 mr-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Productos Sin Movimiento
            </h1>
            <p className="text-gray-300">
              Análisis de productos que no han tenido ventas, movimientos o compras recientes
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

          {/* Filtros y Ordenamiento */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Tipos de Inactividad */}
            <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
              <label className="label-corporate block mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                </svg>
                Tipos de Inactividad
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="flex items-center p-2 rounded hover:bg-gray-700/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={isTipoSelected('todos')}
                    onChange={() => handleTipoInactividadChange('todos')}
                    className="checkbox-corporate"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-300">Todos los Tipos</span>
                </label>
                <label className="flex items-center p-2 rounded hover:bg-gray-700/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={isTipoSelected('Sin ventas')}
                    onChange={() => handleTipoInactividadChange('Sin ventas')}
                    className="checkbox-corporate"
                  />
                  <span className="ml-2 text-sm font-medium text-red-400">Sin ventas</span>
                </label>
                <label className="flex items-center p-2 rounded hover:bg-gray-700/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={isTipoSelected('Sin movimientos')}
                    onChange={() => handleTipoInactividadChange('Sin movimientos')}
                    className="checkbox-corporate"
                  />
                  <span className="ml-2 text-sm font-medium text-orange-400">Sin movimientos</span>
                </label>
                <label className="flex items-center p-2 rounded hover:bg-gray-700/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={isTipoSelected('Sin compras')}
                    onChange={() => handleTipoInactividadChange('Sin compras')}
                    className="checkbox-corporate"
                  />
                  <span className="ml-2 text-sm font-medium text-yellow-400">Sin compras</span>
                </label>
              </div>
            </div>

            {/* Ordenamiento */}
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
                    <option value="dias_sin_actividad">Días sin Actividad</option>
                    <option value="nombre">Nombre</option>
                    <option value="stock_actual">Stock Actual</option>
                    <option value="valor_stock_obsoleto">Valor Stock</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Dirección:</label>
                  <select
                    value={ordenDireccion}
                    onChange={(e) => setOrdenDireccion(e.target.value)}
                    className="select-corporate w-full"
                  >
                    <option value="desc">Descendente (Más obsoleto)</option>
                    <option value="asc">Ascendente (Menos obsoleto)</option>
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
              Gráfico de Productos Obsoletos
            </h3>
          </div>
          {top10Obsoletos.length > 0 ? (
            <div className="chart-wrapper chart-dark-theme">
              <Bar data={chartData} options={chartOptions} />
            </div>
          ) : (
            <div className="chart-no-data">
              <svg className="chart-no-data-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="chart-no-data-text">
                No hay productos obsoletos para mostrar
              </p>
            </div>
          )}
        </div>

        {/* Tabla de Productos Sin Movimiento */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
              Productos Sin Movimiento
            </h3>
            <div className="label-corporate-secondary">
              {datosFiltrados.length} productos mostrados
              {!filtroTipoInactividad.includes('todos') && (
                <span className="ml-2 factura-counter">
                  • Filtrado por: {filtroTipoInactividad.join(', ')}
                </span>
              )}
              <span className="ml-2">
                • Ordenado por: {ordenarPor === 'dias_sin_actividad' ? 'Días sin Actividad' : 
                                ordenarPor === 'nombre' ? 'Nombre' : 
                                ordenarPor === 'stock_actual' ? 'Stock Actual' : 'Valor Stock'} 
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
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Producto {ordenarPor === 'nombre' && (ordenDireccion === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Stock Actual {ordenarPor === 'stock_actual' && (ordenDireccion === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Días Sin Actividad {ordenarPor === 'dias_sin_actividad' && (ordenDireccion === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Valor Stock {ordenarPor === 'valor_stock_obsoleto' && (ordenDireccion === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Última Actividad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Tipo Inactividad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {datosFiltrados.length > 0 ? (
                    datosFiltrados.map((item) => (
                      <tr key={`${item.id}-${item.sede}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-white">
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
                          <div>
                            <div className="font-medium">{formatNumber(item.stock_actual)}</div>
                            <div className="text-xs text-gray-300">
                              Mínimo: {formatNumber(item.minimum_stock)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm ${getInactividadClass(item.dias_sin_actividad)}`}>
                            {item.dias_sin_actividad} días
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {formatPrice(item.valor_stock_obsoleto)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          <div>
                            <div className="text-xs text-gray-300">
                              General: {formatDate(item.ultima_actividad_general)}
                            </div>
                            {item.ultima_venta_fecha && (
                              <div className="text-xs text-gray-400">
                                Venta: {formatDate(item.ultima_venta_fecha)}
                              </div>
                            )}
                            {item.ultimo_movimiento_fecha && (
                              <div className="text-xs text-gray-400">
                                Movimiento: {formatDate(item.ultimo_movimiento_fecha)}
                              </div>
                            )}
                            {item.ultima_compra_fecha && (
                              <div className="text-xs text-gray-400">
                                Compra: {formatDate(item.ultima_compra_fecha)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          <div className="space-y-1">
                            {item.tipo_inactividad.map((tipo, index) => (
                              <span key={index} className="inline-block px-2 py-1 text-xs bg-gray-700 rounded mr-1">
                                {tipo}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getInactividadClass(item.dias_sin_actividad).replace('text-', 'bg-').replace('font-bold', '').replace('font-semibold', '')} bg-opacity-10`}>
                            {getInactividadText(item.dias_sin_actividad)}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-gray-300">
                        No hay productos sin movimiento disponibles
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
              Lógica de Productos Sin Movimiento
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold mb-2 text-blue-400">🎯 Objetivo:</h4>
              <p className="mb-2 text-gray-300">Identificar productos que no han tenido actividad reciente (ventas, movimientos entre sedes, o compras) para detectar stock obsoleto. Solo se consideran productos con actividad desde 2024.</p>
              
              <h4 className="font-semibold mb-2 text-blue-400">�� Criterios de Inactividad:</h4>
              <ul className="space-y-1 text-gray-300">
                <li>• <strong>Sin ventas:</strong> No ha habido ventas en el rango de análisis</li>
                <li>• <strong>Sin movimientos:</strong> No ha habido transferencias entre sedes</li>
                <li>• <strong>Sin compras:</strong> No se han realizado compras recientes</li>
              </ul>
              
              <h4 className="font-semibold mb-2 text-blue-400">�� Valor del Stock Obsoleto:</h4>
              <p className="text-gray-300">Stock actual × Costo unitario = Valor total del inventario obsoleto</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-blue-400">⚠️ Estados de Obsolecencia:</h4>
              <ul className="space-y-1 text-gray-300">
                <li><span className="text-red-400 font-semibold">MUY OBSOLETO:</span> ≥90 días sin actividad</li>
                <li><span className="text-orange-400 font-semibold">OBSOLETO:</span> 60-89 días sin actividad</li>
                <li><span className="text-yellow-400 font-semibold">INACTIVO:</span> 30-59 días sin actividad</li>
                <li><span className="text-green-400 font-semibold">ACTIVO:</span> &lt;30 días sin actividad</li>
              </ul>
              
              <h4 className="font-semibold mb-2 mt-4 text-blue-400">🔍 Filtros Disponibles:</h4>
              <ul className="space-y-1 text-gray-300">
                <li>• <strong>Rango de tiempo:</strong> 15, 30, 60 o 90 días</li>
                <li>• <strong>Tipos de inactividad:</strong> Sin ventas, movimientos o compras</li>
                <li>• <strong>Ordenamiento:</strong> Por días, nombre, stock o valor</li>
                <li>• <strong>Filtro automático:</strong> Solo productos con actividad desde 2024</li>
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
              {datosFiltrados.filter(item => item.dias_sin_actividad >= 90).length}
            </div>
            <div className="metric-label">Muy Obsoletos (≥90 días)</div>
          </div>
          <div className="metric-card">
            <div className="metric-number metric-urgent">
              {datosFiltrados.filter(item => item.dias_sin_actividad >= 60 && item.dias_sin_actividad < 90).length}
            </div>
            <div className="metric-label">Obsoletos (60-89 días)</div>
          </div>
          <div className="metric-card">
            <div className="metric-number metric-ok">
              {datosFiltrados.filter(item => item.dias_sin_actividad < 30).length}
            </div>
            <div className="metric-label">Activos (&lt;30 días)</div>
          </div>
          <div className="metric-card">
            <div className="metric-number metric-historical">
              {formatPrice(datosFiltrados.reduce((sum, item) => sum + item.valor_stock_obsoleto, 0))}
            </div>
            <div className="metric-label">Valor Total Obsoleto</div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Función para obtener datos del servidor
export async function getServerSideProps() {
  try {
    const { getProductosSinMovimiento } = require('../lib/database');
    
    // Obtener datos solo de La Dorada por defecto (30 días)
    const productosLadorada = await getProductosSinMovimiento('ladorada', 30);
    
    return {
      props: {
        productosIniciales: productosLadorada
      }
    };
  } catch (error) {
    console.error('Error en getServerSideProps:', error);
    
    return {
      props: {
        productosIniciales: [],
        error: error.message
      }
    };
  }
}