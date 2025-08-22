import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import * as XLSX from 'xlsx';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ProyeccionCompras({ proyeccionInicial, error: serverError }) {
  const [proyeccion, setProyeccion] = useState(() => {
    if (proyeccionInicial && Array.isArray(proyeccionInicial)) {
      return proyeccionInicial;
    }
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(serverError || null);
  const [filtroSede, setFiltroSede] = useState('ladorada');
  const [rangoAnalisis, setRangoAnalisis] = useState(30);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [modoRango, setModoRango] = useState('predefinido'); // 'predefinido' o 'personalizado'
  const [filtroEstado, setFiltroEstado] = useState(['todos']); // Array de estados seleccionados
  const [ordenarPor, setOrdenarPor] = useState('nombre'); // 'nombre', 'vendido', 'frecuencia'
  const [ordenDireccion, setOrdenDireccion] = useState('asc'); // 'asc', 'desc'
  const [ignorarStock, setIgnorarStock] = useState(false);

  // Efecto para recargar datos cuando cambien los filtros de rango
  useEffect(() => {
    if (proyeccionInicial && proyeccionInicial.length > 0) {
      recargarDatos();
    }
  }, [rangoAnalisis, modoRango, fechaInicio, fechaFin, filtroSede, ignorarStock]);

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
      
      // Agregar parámetro para ignorar stock si está habilitado
      if (ignorarStock) {
        params.append('ignorarStock', 'true');
      }
      
      console.log('[DEBUG] Parámetros enviados al API:', {
        sede: filtroSede,
        rango: rangoAnalisis,
        modo: modoRango,
        fechaInicio: fechaInicio,
        fechaFin: fechaFin,
        ignorarStock: ignorarStock
      });
      
      const response = await fetch(`/api/proyeccion-compras?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setProyeccion(data.proyeccion);
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
     return `$${price.toFixed(2)}`;
   };

   const formatNumber = (num) => {
     if (!num && num !== 0) return 'N/A';
     return num.toLocaleString('es-ES');
   };

   // Funciones para manejar selección múltiple de estados
   const handleEstadoChange = (estado) => {
     if (estado === 'todos') {
       setFiltroEstado(['todos']);
     } else {
       const newEstados = filtroEstado.includes('todos') 
         ? [estado] 
         : filtroEstado.includes(estado)
         ? filtroEstado.filter(e => e !== estado)
         : [...filtroEstado, estado];
       
       setFiltroEstado(newEstados.length === 0 ? ['todos'] : newEstados);
     }
   };

   const isEstadoSelected = (estado) => {
     return filtroEstado.includes(estado);
   };

  const getUrgencyClass = (diasInventario) => {
    if (diasInventario <= 7) return 'text-red-600 font-bold';
    if (diasInventario <= 14) return 'text-orange-600 font-semibold';
    if (diasInventario <= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getUrgencyText = (diasInventario) => {
    if (diasInventario <= 7) return 'CRÍTICO';
    if (diasInventario <= 14) return 'URGENTE';
    if (diasInventario <= 30) return 'ATENCIÓN';
    return 'OK';
  };

           // Filtrar datos según sede seleccionada y estado
    let datosFiltrados = proyeccion.filter(item => item.sede === filtroSede);
    
         // Aplicar filtro de estado
     if (!filtroEstado.includes('todos')) {
       datosFiltrados = datosFiltrados.filter(item => {
         const diasInventario = item.dias_inventario_restante;
         return filtroEstado.some(estado => {
           switch (estado) {
             case 'critico':
               return diasInventario <= 7;
             case 'urgente':
               return diasInventario > 7 && diasInventario <= 14;
             case 'atencion':
               return diasInventario > 14 && diasInventario <= 30;
             case 'ok':
               return diasInventario > 30;
             default:
               return false;
           }
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
        case 'vendido':
          valorA = parseInt(a.vendido_desde_compra);
          valorB = parseInt(b.vendido_desde_compra);
          break;
        case 'frecuencia':
          valorA = a.frecuencia_venta_diaria;
          valorB = b.frecuencia_venta_diaria;
          break;
        default:
          valorA = a.nombre.toLowerCase();
          valorB = b.nombre.toLowerCase();
      }
      
      if (ordenDireccion === 'asc') {
        return valorA > valorB ? 1 : -1;
      } else {
        return valorA < valorB ? 1 : -1;
      }
    });

  // Top 10 productos que necesitan restock urgente
  const top10Urgentes = datosFiltrados
    .filter(item => item.dias_inventario_restante <= 30)
    .sort((a, b) => a.dias_inventario_restante - b.dias_inventario_restante)
    .slice(0, 10);

  // Datos para el gráfico
  const chartData = {
    labels: top10Urgentes.map(item => item.nombre.substring(0, 20) + '...'),
    datasets: [
      {
        label: 'Días de Inventario Restante',
        data: top10Urgentes.map(item => item.dias_inventario_restante),
        backgroundColor: top10Urgentes.map(item => {
          if (item.dias_inventario_restante <= 7) return 'rgba(239, 68, 68, 0.8)';
          if (item.dias_inventario_restante <= 14) return 'rgba(249, 115, 22, 0.8)';
          return 'rgba(245, 158, 11, 0.8)';
        }),
        borderColor: top10Urgentes.map(item => {
          if (item.dias_inventario_restante <= 7) return 'rgb(239, 68, 68)';
          if (item.dias_inventario_restante <= 14) return 'rgb(249, 115, 22)';
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
        text: 'Top 10 Productos que Necesitan Restock Urgente',
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
          text: 'Días de Inventario Restante',
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
    <Layout title="Proyección de Compras - Sistema de Análisis de Inventario">
      <div className="space-y-6">
        {/* Header */}
        <div className="card">
          <div className="card-header">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <svg className="w-8 h-8 mr-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Proyección de Compras
            </h1>
            <p className="text-gray-300">
              Análisis de productos con ventas desde la última compra y sugerencias de reposición
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
            {/* Estados */}
            <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
              <label className="label-corporate block mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                </svg>
                Estados de Urgencia
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="flex items-center p-2 rounded hover:bg-gray-700/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={isEstadoSelected('todos')}
                    onChange={() => handleEstadoChange('todos')}
                    className="checkbox-corporate"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-300">Todos los Estados</span>
                </label>
                <label className="flex items-center p-2 rounded hover:bg-gray-700/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={isEstadoSelected('critico')}
                    onChange={() => handleEstadoChange('critico')}
                    className="checkbox-corporate"
                  />
                  <span className="ml-2 text-sm font-medium text-red-400">Crítico (≤7 días)</span>
                </label>
                <label className="flex items-center p-2 rounded hover:bg-gray-700/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={isEstadoSelected('urgente')}
                    onChange={() => handleEstadoChange('urgente')}
                    className="checkbox-corporate"
                  />
                  <span className="ml-2 text-sm font-medium text-orange-400">Urgente (8-14 días)</span>
                </label>
                <label className="flex items-center p-2 rounded hover:bg-gray-700/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={isEstadoSelected('atencion')}
                    onChange={() => handleEstadoChange('atencion')}
                    className="checkbox-corporate"
                  />
                  <span className="ml-2 text-sm font-medium text-yellow-400">Atención (15-30 días)</span>
                </label>
                <label className="flex items-center p-2 rounded hover:bg-gray-700/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={isEstadoSelected('ok')}
                    onChange={() => handleEstadoChange('ok')}
                    className="checkbox-corporate"
                  />
                  <span className="ml-2 text-sm font-medium text-green-400">OK (&gt;30 días)</span>
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
                    <option value="nombre">Nombre</option>
                    <option value="vendido">Vendido desde Compra</option>
                    <option value="frecuencia">Frecuencia Diaria</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Dirección:</label>
                  <select
                    value={ordenDireccion}
                    onChange={(e) => setOrdenDireccion(e.target.value)}
                    className="select-corporate w-full"
                  >
                    <option value="asc">Ascendente (A-Z)</option>
                    <option value="desc">Descendente (Z-A)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Opciones de Análisis */}
          {filtroSede === 'ladorada' && (
            <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-700/30 mb-6">
              <h4 className="font-semibold text-blue-300 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                Opciones de Análisis Avanzado
              </h4>
              <div className="flex items-center p-3 bg-blue-900/30 rounded-lg border border-blue-600/30">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ignorarStock}
                    onChange={(e) => setIgnorarStock(e.target.checked)}
                    className="rounded border-blue-600 bg-gray-700 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="ml-3 text-sm text-blue-200 font-medium">
                    Ignorar stock actual (analizar solo cantidad comprada)
                  </span>
                </label>
              </div>
              <p className="text-xs text-blue-300 mt-3 leading-relaxed">
                <strong>Modo histórico:</strong> Cuando está habilitado, el análisis se basa únicamente en las cantidades compradas y vendidas, 
                sin considerar el inventario actual. Útil para análisis histórico de comportamiento de ventas.
              </p>
            </div>
          )}

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
              Gráfico de Productos Urgentes
            </h3>
          </div>
          {top10Urgentes.length > 0 ? (
            <div className="chart-wrapper chart-dark-theme">
              <Bar data={chartData} options={chartOptions} />
            </div>
          ) : (
            <div className="chart-no-data">
              <svg className="chart-no-data-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="chart-no-data-text">
                No hay productos que requieran restock urgente
              </p>
            </div>
          )}
        </div>

                 {/* Tabla de Proyección */}
         <div className="card">
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-semibold text-white flex items-center">
               <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                 <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
               </svg>
               Tabla de Proyección de Compras
             </h3>
             <div className="label-corporate-secondary">
               {datosFiltrados.length} productos mostrados
                               {!filtroEstado.includes('todos') && (
                  <span className="ml-2 factura-counter">
                    • Filtrado por: {filtroEstado.map(estado => 
                      estado === 'critico' ? 'Crítico' : 
                      estado === 'urgente' ? 'Urgente' : 
                      estado === 'atencion' ? 'Atención' : 'OK'
                    ).join(', ')}
                  </span>
                )}
               <span className="ml-2">
                 • Ordenado por: {ordenarPor === 'nombre' ? 'Nombre' : 
                                 ordenarPor === 'vendido' ? 'Vendido' : 'Frecuencia'} 
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
                  Mostrando {datosFiltrados.length} productos
                </div>
                <button
                  onClick={() => {
                    // Función de exportación básica
                    const datosExcel = datosFiltrados.map(item => ({
                      'Nombre': item.nombre,
                      'SKU': item.sku || 'N/A',
                      'Código': item.internal_code || 'N/A',
                      'Compras en Rango': item.numero_compras_en_rango,
                      'Vendido desde Compra': item.vendido_desde_compra,
                      'Frecuencia/día': item.frecuencia_venta_diaria.toFixed(2),
                      'Stock Actual': item.ignorar_stock ? 'Ignorado' : item.stock_actual,
                      'Días Restantes': item.dias_inventario_restante === null ? 'N/A' : item.dias_inventario_restante,
                      'Sugerido Comprar': item.sugerido_comprar,
                      'Estado': item.dias_inventario_restante === null ? 'HISTÓRICO' : 
                               item.dias_inventario_restante <= 7 ? 'CRÍTICO' :
                               item.dias_inventario_restante <= 14 ? 'URGENTE' :
                               item.dias_inventario_restante <= 30 ? 'ATENCIÓN' : 'OK'
                    }));
                    
                    const wb = XLSX.utils.book_new();
                    const ws = XLSX.utils.json_to_sheet(datosExcel);
                    XLSX.utils.book_append_sheet(wb, ws, 'Proyección Compras');
                    
                    const fecha = new Date().toISOString().split('T')[0];
                    const nombreArchivo = `Proyeccion_Compras_${fecha}.xlsx`;
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
                      Compras en Rango
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Vendido desde Compra {ordenarPor === 'vendido' && (ordenDireccion === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Frecuencia/día {ordenarPor === 'frecuencia' && (ordenDireccion === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Stock Actual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Días Restantes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Sugerido Comprar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {datosFiltrados.length > 0 ? (
                    datosFiltrados.slice(0, 100).map((item) => (
                      <tr key={`${item.id}-${item.sede}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {item.nombre}
                          </div>
                          <div className="text-sm text-gray-300">
                            SKU: {item.sku || 'N/A'} | Código: {item.internal_code || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        <div>
                          <div className="font-medium">
                            {item.numero_compras_en_rango} compra{item.numero_compras_en_rango > 1 ? 's' : ''}
                          </div>
                          <div className="text-xs text-gray-300">
                            Total: {formatNumber(item.cantidad_total_comprada_en_rango)} unidades
                          </div>
                          <div className="text-xs text-gray-300">
                            Primera: {formatDate(item.primera_compra_en_rango)}
                          </div>
                          <div className="text-xs text-gray-300">
                            Última: {formatDate(item.ultima_compra_en_rango)}
                          </div>
                          {item.numero_compras_en_rango > 1 && (
                            <div className="text-xs text-blue-400">
                              Promedio: ${item.precio_promedio_compra?.toFixed(2) || 'N/A'}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        <div>
                          <div>{formatNumber(item.vendido_desde_compra)}</div>
                          <div className="text-xs text-gray-300">
                            {formatNumber(item.numero_ventas)} ventas
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {item.frecuencia_venta_diaria.toFixed(2)}/día
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {item.ignorar_stock ? (
                          <span className="text-gray-500 italic">Ignorado</span>
                        ) : (
                          formatNumber(item.stock_actual)
                        )}
                      </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                        {item.dias_inventario_restante === null ? (
                          <span className="text-gray-500 italic text-sm">N/A</span>
                        ) : (
                          <span className={`text-sm ${getUrgencyClass(item.dias_inventario_restante)}`}>
                            {item.dias_inventario_restante} días
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {formatNumber(item.sugerido_comprar)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.dias_inventario_restante === null ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                            HISTÓRICO
                          </span>
                        ) : (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUrgencyClass(item.dias_inventario_restante).replace('text-', 'bg-').replace('font-bold', '').replace('font-semibold', '')} bg-opacity-10`}>
                            {getUrgencyText(item.dias_inventario_restante)}
                          </span>
                        )}
                      </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-6 py-4 text-center text-gray-300">
                        No hay datos de proyección disponibles
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
              Lógica de Proyección de Compras
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
                             <h4 className="font-semibold mb-2 text-blue-400">🎯 Objetivo:</h4>
               <p className="mb-2 text-gray-300">Analizar productos comprados en un rango de tiempo específico que han tenido ventas y proyectar cuánto comprar basado en las ventas realizadas.</p>
              
              <h4 className="font-semibold mb-2 text-blue-400">📈 Cálculo de Frecuencia:</h4>
              <p className="mb-2 text-gray-300">Frecuencia diaria = Total vendido desde primera compra ÷ Días transcurridos desde primera compra</p>
              
                             <h4 className="font-semibold mb-2 text-blue-400">🛒 Sugerencia de Compra:</h4>
               <p className="text-gray-300">Proyección 30 días + 20% margen de seguridad - Stock actual</p>
               
               <h4 className="font-semibold mb-2 text-blue-400">📊 Modo Ignorar Stock (La Dorada):</h4>
               <p className="text-gray-300">Cuando está habilitado, el análisis se basa únicamente en cantidades compradas y vendidas, sin considerar inventario actual.</p>
               
               <h4 className="font-semibold mb-2 text-blue-400">🔍 Filtro Aplicado:</h4>
               <p className="text-gray-300">Solo se muestran productos que han tenido ventas desde su primera compra en el rango de análisis</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-blue-400">⚠️ Estados de Urgencia:</h4>
              <ul className="space-y-1 text-gray-300">
                <li><span className="text-red-400 font-semibold">CRÍTICO:</span> ≤7 días de inventario</li>
                <li><span className="text-orange-400 font-semibold">URGENTE:</span> 8-14 días de inventario</li>
                <li><span className="text-yellow-400 font-semibold">ATENCIÓN:</span> 15-30 días de inventario</li>
                <li><span className="text-green-400 font-semibold">OK:</span> &gt;30 días de inventario</li>
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
              {datosFiltrados.filter(item => item.dias_inventario_restante !== null && item.dias_inventario_restante <= 7).length}
            </div>
            <div className="metric-label">Críticos (≤7 días)</div>
          </div>
          <div className="metric-card">
            <div className="metric-number metric-urgent">
              {datosFiltrados.filter(item => item.dias_inventario_restante !== null && item.dias_inventario_restante > 7 && item.dias_inventario_restante <= 14).length}
            </div>
            <div className="metric-label">Urgentes (8-14 días)</div>
          </div>
          <div className="metric-card">
            <div className="metric-number metric-ok">
              {datosFiltrados.filter(item => item.dias_inventario_restante !== null && item.dias_inventario_restante > 30).length}
            </div>
            <div className="metric-label">OK (&gt;30 días)</div>
          </div>
          <div className="metric-card">
            <div className="metric-number metric-historical">
              {datosFiltrados.filter(item => item.dias_inventario_restante === null).length}
            </div>
            <div className="metric-label">Histórico</div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Función para obtener datos del servidor
export async function getServerSideProps() {
  try {
    const { getProyeccionCompras } = require('../lib/database');
    
    // Obtener datos solo de La Dorada por defecto (30 días)
    const proyeccionLadorada = await getProyeccionCompras('ladorada', 30, null, null, false);
    
    return {
      props: {
        proyeccionInicial: proyeccionLadorada
      }
    };
  } catch (error) {
    console.error('Error en getServerSideProps:', error);
    
    return {
      props: {
        proyeccionInicial: [],
        error: error.message
      }
    };
  }
}
