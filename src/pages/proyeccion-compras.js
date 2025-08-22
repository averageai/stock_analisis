import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

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

  // Efecto para recargar datos cuando cambien los filtros de rango
  useEffect(() => {
    if (proyeccionInicial && proyeccionInicial.length > 0) {
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
      
      console.log('[DEBUG] Parámetros enviados al API:', {
        sede: filtroSede,
        rango: rangoAnalisis,
        modo: modoRango,
        fechaInicio: fechaInicio,
        fechaFin: fechaFin
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
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Top 10 Productos que Necesitan Restock Urgente',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Días de Inventario Restante',
        },
      },
    },
  };

  return (
    <Layout title="Proyección de Compras - Sistema de Análisis de Inventario">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Proyección de Compras
          </h1>
          <p className="text-gray-600">
            Análisis de productos con ventas desde la última compra y sugerencias de reposición
          </p>
        </div>

                 {/* Filtros */}
         <div className="bg-white p-6 rounded-lg shadow-md">
           <h3 className="text-lg font-semibold mb-4">Filtros de Análisis</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Sede */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sede
                </label>
                <select
                  value={filtroSede}
                  onChange={(e) => setFiltroSede(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ladorada">La Dorada</option>
                  <option value="manizales">Manizales</option>
                </select>
              </div>

              {/* Modo de Rango */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Rango
                </label>
                <select
                  value={modoRango}
                  onChange={(e) => setModoRango(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="predefinido">Predefinido</option>
                  <option value="personalizado">Personalizado</option>
                </select>
              </div>

              {/* Rango Predefinido */}
              {modoRango === 'predefinido' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rango de Análisis
                  </label>
                  <select
                    value={rangoAnalisis}
                    onChange={(e) => setRangoAnalisis(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha Inicio
                    </label>
                    <input
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha Fin
                    </label>
                    <input
                      type="date"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Filtros adicionales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {/* Filtro de Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estados
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isEstadoSelected('todos')}
                      onChange={() => handleEstadoChange('todos')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Todos los Estados</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isEstadoSelected('critico')}
                      onChange={() => handleEstadoChange('critico')}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-2 text-sm text-red-600 font-medium">Crítico (≤7 días)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isEstadoSelected('urgente')}
                      onChange={() => handleEstadoChange('urgente')}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="ml-2 text-sm text-orange-600 font-medium">Urgente (8-14 días)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isEstadoSelected('atencion')}
                      onChange={() => handleEstadoChange('atencion')}
                      className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                    />
                    <span className="ml-2 text-sm text-yellow-600 font-medium">Atención (15-30 días)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isEstadoSelected('ok')}
                      onChange={() => handleEstadoChange('ok')}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="ml-2 text-sm text-green-600 font-medium">OK (&gt;30 días)</span>
                  </label>
                </div>
              </div>

              {/* Ordenar por */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ordenar por
                </label>
                <select
                  value={ordenarPor}
                  onChange={(e) => setOrdenarPor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="nombre">Nombre</option>
                  <option value="vendido">Vendido desde Compra</option>
                  <option value="frecuencia">Frecuencia Diaria</option>
                </select>
              </div>

              {/* Dirección del ordenamiento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Orden
                </label>
                <select
                  value={ordenDireccion}
                  onChange={(e) => setOrdenDireccion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="asc">Ascendente (A-Z)</option>
                  <option value="desc">Descendente (Z-A)</option>
                </select>
              </div>
            </div>

           {/* Botón de Actualizar */}
           <div className="mt-4">
             <button
               onClick={recargarDatos}
               disabled={loading}
               className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
             >
               {loading ? 'Actualizando...' : 'Actualizar Análisis'}
             </button>
           </div>
         </div>

        {/* Mostrar error si existe */}
        {error && (
          <div className="card bg-red-50 border border-red-200">
            <h3 className="text-lg font-semibold mb-2 text-red-800">Error de Conexión</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Gráfico */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Gráfico de Productos Urgentes</h3>
          {top10Urgentes.length > 0 ? (
            <div className="h-96">
              <Bar data={chartData} options={chartOptions} />
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No hay productos que requieran restock urgente
            </p>
          )}
        </div>

                 {/* Tabla de Proyección */}
         <div className="bg-white p-6 rounded-lg shadow-md">
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-semibold">Tabla de Proyección de Compras</h3>
             <div className="text-sm text-gray-600">
               {datosFiltrados.length} productos mostrados
                               {!filtroEstado.includes('todos') && (
                  <span className="ml-2 text-blue-600">
                    • Filtrado por: {filtroEstado.map(estado => 
                      estado === 'critico' ? 'Crítico' : 
                      estado === 'urgente' ? 'Urgente' : 
                      estado === 'atencion' ? 'Atención' : 'OK'
                    ).join(', ')}
                  </span>
                )}
               <span className="ml-2 text-gray-500">
                 • Ordenado por: {ordenarPor === 'nombre' ? 'Nombre' : 
                                 ordenarPor === 'vendido' ? 'Vendido' : 'Frecuencia'} 
                 ({ordenDireccion === 'asc' ? 'A-Z' : 'Z-A'})
               </span>
             </div>
           </div>
          {loading ? (
            <p className="text-gray-500">Cargando datos...</p>
          ) : error ? (
            <p className="text-red-500">Error: {error}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                                 <thead className="bg-gray-50">
                   <tr>
                                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Producto {ordenarPor === 'nombre' && (ordenDireccion === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         Compras en Rango
                       </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vendido desde Compra {ordenarPor === 'vendido' && (ordenDireccion === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Frecuencia/día {ordenarPor === 'frecuencia' && (ordenDireccion === 'asc' ? '↑' : '↓')}
                      </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Stock Actual
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Días Restantes
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Sugerido Comprar
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Estado
                     </th>
                   </tr>
                 </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {datosFiltrados.length > 0 ? (
                    datosFiltrados.map((item) => (
                      <tr key={`${item.id}-${item.sede}`} className="hover:bg-gray-50">
                                                 <td className="px-6 py-4 whitespace-nowrap">
                           <div>
                             <div className="text-sm font-medium text-gray-900">
                               {item.nombre}
                             </div>
                             <div className="text-sm text-gray-500">
                               SKU: {item.sku || 'N/A'} | Código: {item.internal_code || 'N/A'}
                             </div>
                           </div>
                         </td>
                                                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              <div className="font-medium">
                                {item.numero_compras_en_rango} compra{item.numero_compras_en_rango > 1 ? 's' : ''}
                              </div>
                                                             <div className="text-xs text-gray-500">
                                 Total: {formatNumber(item.cantidad_total_comprada_en_rango)} unidades
                               </div>
                              <div className="text-xs text-gray-500">
                                Primera: {formatDate(item.primera_compra_en_rango)}
                              </div>
                              <div className="text-xs text-gray-500">
                                Última: {formatDate(item.ultima_compra_en_rango)}
                              </div>
                              {item.numero_compras_en_rango > 1 && (
                                <div className="text-xs text-blue-600">
                                  Promedio: ${item.precio_promedio_compra?.toFixed(2) || 'N/A'}
                                </div>
                              )}
                            </div>
                          </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                           <div>
                             <div>{formatNumber(item.vendido_desde_compra)}</div>
                             <div className="text-xs text-gray-500">
                               {formatNumber(item.numero_ventas)} ventas
                             </div>
                           </div>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                           {item.frecuencia_venta_diaria.toFixed(2)}/día
                         </td>
                                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                           {formatNumber(item.stock_actual)}
                         </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm ${getUrgencyClass(item.dias_inventario_restante)}`}>
                            {item.dias_inventario_restante} días
                          </span>
                        </td>
                                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                           {formatNumber(item.sugerido_comprar)}
                         </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUrgencyClass(item.dias_inventario_restante).replace('text-', 'bg-').replace('font-bold', '').replace('font-semibold', '')} bg-opacity-10`}>
                            {getUrgencyText(item.dias_inventario_restante)}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
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
        <div className="bg-blue-50 p-6 rounded-lg shadow-md border border-blue-200">
          <h3 className="text-lg font-semibold mb-4 text-blue-800">📊 Lógica de Proyección de Compras</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-700">
            <div>
                             <h4 className="font-semibold mb-2">🎯 Objetivo:</h4>
               <p className="mb-2">Analizar productos comprados en un rango de tiempo específico que han tenido ventas y proyectar cuánto comprar basado en las ventas realizadas.</p>
              
              <h4 className="font-semibold mb-2">📈 Cálculo de Frecuencia:</h4>
              <p className="mb-2">Frecuencia diaria = Total vendido desde primera compra ÷ Días transcurridos desde primera compra</p>
              
                             <h4 className="font-semibold mb-2">🛒 Sugerencia de Compra:</h4>
               <p>Proyección 30 días + 20% margen de seguridad - Stock actual</p>
               
               <h4 className="font-semibold mb-2">🔍 Filtro Aplicado:</h4>
               <p>Solo se muestran productos que han tenido ventas desde su primera compra en el rango de análisis</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">⚠️ Estados de Urgencia:</h4>
              <ul className="space-y-1">
                <li><span className="text-red-600 font-semibold">CRÍTICO:</span> ≤7 días de inventario</li>
                <li><span className="text-orange-600 font-semibold">URGENTE:</span> 8-14 días de inventario</li>
                <li><span className="text-yellow-600 font-semibold">ATENCIÓN:</span> 15-30 días de inventario</li>
                <li><span className="text-green-600 font-semibold">OK:</span> &gt;30 días de inventario</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-md text-center">
            <div className="text-2xl font-bold text-blue-600">
              {datosFiltrados.length}
            </div>
            <div className="text-sm text-gray-600">Total Productos</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md text-center">
            <div className="text-2xl font-bold text-red-600">
              {datosFiltrados.filter(item => item.dias_inventario_restante <= 7).length}
            </div>
            <div className="text-sm text-gray-600">Críticos (≤7 días)</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md text-center">
            <div className="text-2xl font-bold text-orange-600">
              {datosFiltrados.filter(item => item.dias_inventario_restante > 7 && item.dias_inventario_restante <= 14).length}
            </div>
            <div className="text-sm text-gray-600">Urgentes (8-14 días)</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md text-center">
            <div className="text-2xl font-bold text-green-600">
              {datosFiltrados.filter(item => item.dias_inventario_restante > 30).length}
            </div>
            <div className="text-sm text-gray-600">OK (&gt;30 días)</div>
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
    const proyeccionLadorada = await getProyeccionCompras('ladorada', 30);
    
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
