import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import * as XLSX from 'xlsx';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function RecompraProveedor() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sede, setSede] = useState('ladorada');
  const [proveedores, setProveedores] = useState([]);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [facturas, setFacturas] = useState([]);
  const [facturasSeleccionadas, setFacturasSeleccionadas] = useState([]);
  const [facturasFiltradas, setFacturasFiltradas] = useState([]);
  const [busquedaFacturas, setBusquedaFacturas] = useState('');
  const [analisis, setAnalisis] = useState([]);
  const [ordenarPor, setOrdenarPor] = useState('vendido');
  const [ordenDireccion, setOrdenDireccion] = useState('desc');
  const [ignorarStock, setIgnorarStock] = useState(false);
  const [filtroDias, setFiltroDias] = useState('todos');

  // Cargar proveedores al cambiar sede
  useEffect(() => {
    cargarProveedores();
  }, [sede]);

  // Cargar facturas cuando se selecciona un proveedor
  useEffect(() => {
    if (proveedorSeleccionado) {
      if (proveedorSeleccionado.id === 'todos') {
        cargarTodasLasFacturas();
      } else {
        cargarFacturas();
      }
    } else {
      setFacturas([]);
      setFacturasSeleccionadas([]);
      setFacturasFiltradas([]);
    }
  }, [proveedorSeleccionado, sede]);

  // Filtrar facturas cuando cambia el filtro de días o búsqueda
  useEffect(() => {
    let filtradas = facturas;

    // Filtrar por fecha
    if (filtroDias !== 'todos') {
      const dias = parseInt(filtroDias);
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - dias);
      
      filtradas = filtradas.filter(factura => {
        const fechaFactura = new Date(factura.created_at);
        return fechaFactura >= fechaLimite;
      });
    }

    // Filtrar por búsqueda de números de factura
    if (busquedaFacturas.trim()) {
      const numerosBusqueda = busquedaFacturas.split(',').map(num => num.trim()).filter(num => {
        // Solo incluir números válidos (solo dígitos)
        return /^\d+$/.test(num);
      });
      
      // Solo aplicar filtro si hay números válidos
      if (numerosBusqueda.length > 0) {
        const facturasFiltradasPorBusqueda = filtradas.filter(factura => {
          return numerosBusqueda.some(numero => 
            factura.invoice_number.toString().includes(numero)
          );
        });
        
        // Si no se encontraron coincidencias, mostrar todas las facturas
        if (facturasFiltradasPorBusqueda.length === 0) {
          // Mantener las facturas filtradas por fecha pero no por búsqueda
          setFacturasFiltradas(filtradas);
          return;
        }
        
        filtradas = facturasFiltradasPorBusqueda;
      }
    }

    setFacturasFiltradas(filtradas);
  }, [facturas, filtroDias, busquedaFacturas]);

  const cargarProveedores = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/recompra-proveedor?sede=${sede}&action=proveedores`);
      const data = await response.json();
      
      if (data.success) {
        setProveedores(data.proveedores);
        setError(null);
      } else {
        setError(data.error || 'Error al cargar proveedores');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const cargarFacturas = async () => {
    if (!proveedorSeleccionado) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/recompra-proveedor?sede=${sede}&action=facturas&providerId=${proveedorSeleccionado.id}`);
      const data = await response.json();
      
      if (data.success) {
        setFacturas(data.facturas);
        setError(null);
      } else {
        setError(data.error || 'Error al cargar facturas');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const cargarTodasLasFacturas = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/recompra-proveedor?sede=${sede}&action=todas-facturas`);
      const data = await response.json();
      
      if (data.success) {
        setFacturas(data.facturas);
        setError(null);
      } else {
        setError(data.error || 'Error al cargar todas las facturas');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const realizarAnalisis = async () => {
    if (!proveedorSeleccionado) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sede: sede,
        action: 'analisis'
      });
      
      if (proveedorSeleccionado.id === 'todos') {
        params.append('todosProveedores', 'true');
      } else {
        params.append('providerId', proveedorSeleccionado.id);
      }
      
      if (facturasSeleccionadas.length > 0) {
        params.append('facturaIds', JSON.stringify(facturasSeleccionadas));
      }
      
      // Agregar parámetro para ignorar stock si está habilitado
      if (ignorarStock) {
        params.append('ignorarStock', 'true');
      }
      
      const response = await fetch(`/api/recompra-proveedor?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalisis(data.analisis);
        setError(null);
      } else {
        setError(data.error || 'Error al realizar análisis');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleFacturaToggle = (facturaId) => {
    setFacturasSeleccionadas(prev => {
      if (prev.includes(facturaId)) {
        return prev.filter(id => id !== facturaId);
      } else {
        return [...prev, facturaId];
      }
    });
  };

  const handleSelectAllFacturas = () => {
    if (facturasSeleccionadas.length === facturasFiltradas.length) {
      setFacturasSeleccionadas([]);
    } else {
      setFacturasSeleccionadas(facturasFiltradas.map(f => f.id));
    }
  };

  const exportarExcel = () => {
    if (analisis.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    // Preparar datos para Excel con el orden especificado
    const datosExcel = analisis.map(item => ({
      'SKU': item.sku || 'N/A',
      'Código Interno': item.internal_code || 'N/A',
      'Nombre': item.nombre || 'N/A',
      '# Facturas': item.numero_facturas_compra || 0,
      'Vendidos': item.vendido_desde_compra || 0,
      'Sugerido de Compra': item.sugerido_comprar || 0,
      'Costo de Últ Compra': item.precio_promedio_compra || 0
    }));

    // Crear workbook
    const wb = XLSX.utils.book_new();

    // Hoja 1: Datos principales
    const ws = XLSX.utils.json_to_sheet(datosExcel);
    XLSX.utils.book_append_sheet(wb, ws, 'Análisis Recompra');

    // Hoja 2: Resumen y metadatos
    const resumen = [
      { 'Campo': 'Proveedor', 'Valor': proveedorSeleccionado?.nombre || 'N/A' },
      { 'Campo': 'Sede', 'Valor': sede === 'ladorada' ? 'La Dorada' : 'Manizales' },
      { 'Campo': 'Fecha de Análisis', 'Valor': new Date().toLocaleDateString('es-ES') },
             { 'Campo': 'Total Productos', 'Valor': analisis.length },
             { 'Campo': 'Modo Ignorar Stock', 'Valor': ignorarStock ? 'Sí' : 'No' },
       { 'Campo': 'Filtro por Días', 'Valor': filtroDias === 'todos' ? 'Todas las facturas' : `Últimos ${filtroDias} días` },
       { 'Campo': 'Facturas Analizadas', 'Valor': facturasSeleccionadas.length > 0 ? facturasSeleccionadas.length : 'Todas' },
      { 'Campo': '', 'Valor': '' },
      { 'Campo': 'Resumen por Estado', 'Valor': '' },
             { 'Campo': 'Críticos (≤7 días)', 'Valor': analisis.filter(item => item.dias_inventario_restante !== null && item.dias_inventario_restante <= 7).length },
       { 'Campo': 'Urgentes (8-14 días)', 'Valor': analisis.filter(item => item.dias_inventario_restante !== null && item.dias_inventario_restante > 7 && item.dias_inventario_restante <= 14).length },
       { 'Campo': 'OK (>30 días)', 'Valor': analisis.filter(item => item.dias_inventario_restante !== null && item.dias_inventario_restante > 30).length },
       { 'Campo': 'Histórico', 'Valor': analisis.filter(item => item.dias_inventario_restante === null).length }
    ];

    const wsResumen = XLSX.utils.json_to_sheet(resumen);
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

    // Generar nombre del archivo con fecha y proveedor
    const fecha = new Date().toISOString().split('T')[0];
    const nombreProveedor = proveedorSeleccionado?.nombre?.replace(/[^a-zA-Z0-9]/g, '_') || 'Proveedor';
    const nombreArchivo = `Analisis_${nombreProveedor}_${fecha}.xlsx`;

    // Exportar archivo
    XLSX.writeFile(wb, nombreArchivo);
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

  const getUrgencyClass = (diasInventario) => {
    if (diasInventario === null) return 'text-gray-500';
    if (diasInventario <= 7) return 'text-red-600 font-bold';
    if (diasInventario <= 14) return 'text-orange-600 font-semibold';
    if (diasInventario <= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getUrgencyText = (diasInventario) => {
    if (diasInventario === null) return 'HISTÓRICO';
    if (diasInventario <= 7) return 'CRÍTICO';
    if (diasInventario <= 14) return 'URGENTE';
    if (diasInventario <= 30) return 'ATENCIÓN';
    return 'OK';
  };

  // Ordenar análisis
  const analisisOrdenado = [...analisis].sort((a, b) => {
    let valorA, valorB;
    
    switch (ordenarPor) {
      case 'vendido':
        valorA = a.vendido_desde_compra;
        valorB = b.vendido_desde_compra;
        break;
      case 'frecuencia':
        valorA = a.frecuencia_venta_diaria;
        valorB = b.frecuencia_venta_diaria;
        break;
      case 'nombre':
        valorA = a.nombre.toLowerCase();
        valorB = b.nombre.toLowerCase();
        break;
      default:
        valorA = a.vendido_desde_compra;
        valorB = b.vendido_desde_compra;
    }
    
    if (ordenDireccion === 'asc') {
      return valorA > valorB ? 1 : -1;
    } else {
      return valorA < valorB ? 1 : -1;
    }
  });

  // Top 10 productos con más ventas para el gráfico (usando datos filtrados)
  const top10Productos = analisisOrdenado
    .filter(item => item.vendido_desde_compra > 0)
    .slice(0, 10);

  const chartData = {
    labels: top10Productos.map(item => item.nombre.substring(0, 20) + '...'),
    datasets: [
      {
        label: 'Vendido desde Compra',
        data: top10Productos.map(item => item.vendido_desde_compra),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
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
        text: 'Top 10 Productos Más Vendidos del Proveedor',
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
          text: 'Cantidad Vendida',
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
    <Layout title="Análisis de Recompra por Proveedor - Sistema de Análisis de Inventario">
      <div className="space-y-6">
        {/* Header Corporativo */}
        <div className="card">
          <div className="card-header">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <svg className="w-8 h-8 mr-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              Análisis de Recompra por Proveedor
            </h1>
            <p className="text-gray-300">
              Analiza productos comprados a proveedores específicos y obtén sugerencias de recompra basadas en ventas
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
              Configuración del Análisis
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Sede */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-1 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Sede
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

                         {/* Proveedor */}
             <div>
               <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                 <svg className="w-4 h-4 mr-1 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                   <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                 </svg>
                 Proveedor
               </label>
               <select
                 value={proveedorSeleccionado?.id || ''}
                 onChange={(e) => {
                   if (e.target.value === 'todos') {
                     setProveedorSeleccionado({ id: 'todos', nombre: 'Todos los proveedores' });
                   } else {
                     const selected = proveedores.find(p => p.id === parseInt(e.target.value));
                     setProveedorSeleccionado(selected || null);
                   }
                 }}
                 className="select-corporate w-full"
               >
                 <option value="">Seleccionar proveedor...</option>
                 <option value="todos">Todos los proveedores</option>
                 {proveedores.map(proveedor => (
                   <option key={proveedor.id} value={proveedor.id}>
                     {proveedor.nombre} ({proveedor.total_facturas} facturas)
                   </option>
                 ))}
               </select>
             </div>

                         {/* Botón de Análisis */}
             <div className="flex items-end">
               <button
                 onClick={realizarAnalisis}
                 disabled={loading || !proveedorSeleccionado}
                 className="btn-primary w-full flex items-center justify-center"
               >
                 {loading ? (
                   <>
                     <div className="loading-spinner mr-2"></div>
                     Analizando...
                   </>
                 ) : (
                   <>
                     <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                       <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                     </svg>
                     Realizar Análisis
                   </>
                 )}
               </button>
             </div>
          </div>

                     {/* Opciones de Análisis */}
           <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
             <h4 className="font-semibold text-white mb-3 flex items-center">
               <svg className="w-4 h-4 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                 <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
               </svg>
               Opciones de Análisis
             </h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* Filtro por días - Disponible para ambas sedes */}
               <div className="flex items-center space-x-3">
                 <label className="text-sm font-medium text-gray-300">Filtro por días:</label>
                 <select
                   value={filtroDias}
                   onChange={(e) => setFiltroDias(e.target.value)}
                   className="select-corporate px-2 py-1 text-sm"
                 >
                   <option value="todos">Todas las facturas</option>
                   <option value="15">Últimos 15 días</option>
                   <option value="30">Últimos 30 días</option>
                   <option value="60">Últimos 60 días</option>
                   <option value="90">Últimos 90 días</option>
                 </select>
               </div>
               {/* Ignorar stock - Disponible para ambas sedes */}
               <div className="flex items-center space-x-3">
                 <label className="flex items-center">
                   <input
                     type="checkbox"
                     checked={ignorarStock}
                     onChange={(e) => setIgnorarStock(e.target.checked)}
                     className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                   />
                   <span className="ml-2 text-sm text-gray-300">
                     Ignorar stock actual (analizar solo cantidad comprada)
                   </span>
                 </label>
               </div>
             </div>
             <p className="text-xs text-gray-400 mt-2">
               <strong>Filtro por días:</strong> Analiza solo las facturas de los últimos días seleccionados. Útil para análisis recientes.
               <br />
               <strong>Ignorar stock:</strong> Cuando está habilitado, el análisis se basa únicamente en las cantidades compradas y vendidas, 
               sin considerar el inventario actual. Útil para análisis histórico de comportamiento de ventas.
             </p>
           </div>

                     {/* Información del Proveedor */}
           {proveedorSeleccionado && (
            <div className="mt-4 p-4 bg-blue-900/20 rounded-lg border border-blue-700/30">
              <h4 className="font-semibold text-blue-300 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
                Información del Proveedor
              </h4>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                 {proveedorSeleccionado.id === 'todos' ? (
                   <>
                     <div>
                       <span className="font-medium text-gray-300">Análisis:</span> <span className="text-white">Todos los proveedores</span>
                     </div>
                     <div>
                       <span className="font-medium text-gray-300">Total Proveedores:</span> <span className="text-white">{proveedores.length}</span>
                     </div>
                     <div>
                       <span className="font-medium text-gray-300">Total Facturas:</span> <span className="text-white">{facturas.length}</span>
                     </div>
                   </>
                 ) : (
                   <>
                     <div>
                       <span className="font-medium text-gray-300">Nombre:</span> <span className="text-white">{proveedorSeleccionado.nombre}</span>
                     </div>
                     <div>
                       <span className="font-medium text-gray-300">Total Productos:</span> <span className="text-white">{formatNumber(proveedorSeleccionado.total_productos_comprados)}</span>
                     </div>
                     <div>
                       <span className="font-medium text-gray-300">Total Facturas:</span> <span className="text-white">{proveedorSeleccionado.total_facturas}</span>
                     </div>
                     <div>
                       <span className="font-medium text-gray-300">Primera Compra:</span> <span className="text-white">{formatDate(proveedorSeleccionado.primera_compra)}</span>
                     </div>
                     <div>
                       <span className="font-medium text-gray-300">Última Compra:</span> <span className="text-white">{formatDate(proveedorSeleccionado.ultima_compra)}</span>
                     </div>
                     <div>
                       <span className="font-medium text-gray-300">Total Productos:</span> <span className="text-white">{formatNumber(proveedorSeleccionado.total_productos_comprados)}</span>
                     </div>
                   </>
                 )}
               </div>
            </div>
          )}
        </div>

                 {/* Facturas del Proveedor */}
         {facturasFiltradas.length > 0 && (
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Facturas del Proveedor</h3>
                             <div className="select-all-container">
                 <label>
                   <input
                     type="checkbox"
                     checked={facturasSeleccionadas.length === facturasFiltradas.length}
                     onChange={handleSelectAllFacturas}
                     className="checkbox-corporate"
                   />
                   <span>Seleccionar Todas</span>
                 </label>
               </div>
            </div>
            
                         <div className="label-corporate-secondary mb-4">
               Selecciona las facturas específicas para analizar, o déjalo vacío para analizar todas las facturas del proveedor.
               <span className="factura-counter">
                 {' '}Mostrando {facturasFiltradas.length} de {facturas.length} facturas
                 {filtroDias !== 'todos' && ` (filtradas por fecha)`}
                 {busquedaFacturas.trim() && (() => {
                   const numerosBusqueda = busquedaFacturas.split(',').map(num => num.trim()).filter(num => /^\d+$/.test(num));
                   return numerosBusqueda.length > 0 ? ` (filtradas por búsqueda)` : '';
                 })()}
               </span>
             </div>

             {/* Buscador de facturas */}
             <div className="mb-4">
               <label className="label-corporate block mb-2">
                 Buscar facturas por número:
               </label>
               <input
                 type="text"
                 value={busquedaFacturas}
                 onChange={(e) => setBusquedaFacturas(e.target.value)}
                 placeholder="Ej: 123, 456, 789 (separar por comas para múltiples)"
                 className="input-search-corporate w-full"
               />
               <p className="help-text">
                 Ingresa números de factura separados por comas para buscar múltiples facturas
               </p>
               {busquedaFacturas.trim() && (() => {
                 const numerosBusqueda = busquedaFacturas.split(',').map(num => num.trim()).filter(num => /^\d+$/.test(num));
                 const hayNumerosValidos = numerosBusqueda.length > 0;
                 const noHayCoincidencias = hayNumerosValidos && facturasFiltradas.length === 0;
                 
                 if (!hayNumerosValidos && busquedaFacturas.trim()) {
                   return (
                     <p className="help-text-warning">
                       Ingresa solo números válidos separados por comas (ej: 123, 456)
                     </p>
                   );
                 } else if (noHayCoincidencias) {
                   return (
                     <p className="help-text-error">
                       No se encontraron facturas con los números: {numerosBusqueda.join(', ')}
                     </p>
                   );
                 }
                 return null;
               })()}
             </div>

             <div className="facturas-grid">
               {facturasFiltradas.map(factura => (
                <div key={factura.id} className="factura-card">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={facturasSeleccionadas.includes(factura.id)}
                      onChange={() => handleFacturaToggle(factura.id)}
                      className="checkbox-corporate mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium">Factura #{factura.invoice_number}</div>
                      <div className="text-sm">
                        Fecha: {formatDate(factura.created_at)}
                      </div>
                      <div className="text-sm">
                        Valor: {formatPrice(factura.total_value)}
                      </div>
                      <div className="text-sm">
                        Productos: {factura.total_productos}
                      </div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

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

        {/* Gráfico */}
        {top10Productos.length > 0 && (
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
            <div className="chart-wrapper chart-dark-theme">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
        )}

                 {/* Tabla de Análisis */}
         {analisis.length > 0 && (
          <div className="card">
                         <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-semibold text-white flex items-center">
                 <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                   <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                 </svg>
                 Análisis de Recompra
               </h3>
                                <div className="chart-controls">
                   <div className="chart-control-group">
                     <label className="chart-control-label">Ordenar por:</label>
                     <select
                       value={ordenarPor}
                       onChange={(e) => setOrdenarPor(e.target.value)}
                       className="chart-select"
                     >
                     <option value="vendido">Vendido</option>
                     <option value="frecuencia">Frecuencia</option>
                     <option value="nombre">Nombre</option>
                   </select>
                 </div>
                                    <div className="chart-control-group">
                     <label className="chart-control-label">Orden:</label>
                     <select
                       value={ordenDireccion}
                       onChange={(e) => setOrdenDireccion(e.target.value)}
                       className="chart-select"
                     >
                     <option value="desc">Descendente</option>
                     <option value="asc">Ascendente</option>
                   </select>
                 </div>
                 <button
                   onClick={exportarExcel}
                   disabled={analisis.length === 0}
                   className="chart-export-btn"
                   title="Exportar análisis a Excel con SKU, código interno, nombre, facturas, vendidos, sugerido de compra y costo"
                 >
                   <svg fill="currentColor" viewBox="0 0 20 20">
                     <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                   </svg>
                   Exportar Excel
                 </button>
               </div>
             </div>

            <div className="table-container">
              <table className="min-w-full divide-y divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Compras
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendido desde Compra
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Frecuencia/día
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
                      Margen %
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {analisisOrdenado.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-800/50">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">
                            {item.numero_facturas_compra} factura{item.numero_facturas_compra > 1 ? 's' : ''}
                          </div>
                          <div className="text-xs text-gray-500">
                            Total: {formatNumber(item.cantidad_total_comprada)} unidades
                          </div>
                          <div className="text-xs text-gray-500">
                            Promedio: {formatPrice(item.precio_promedio_compra)}
                          </div>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(item.sugerido_comprar)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="text-green-600 font-medium">
                            {item.margen_ganancia.toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-500">
                            Mayorista: {item.margen_mayorista.toFixed(1)}%
                          </div>
                        </div>
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

                 {/* Resumen */}
         {analisis.length > 0 && (
           <div className="metrics-grid">
                         <div className="metric-card">
                              <div className="metric-number metric-total">
                 {analisis.length}
               </div>
               <div className="metric-label">Total Productos</div>
             </div>
             <div className="metric-card">
               <div className="metric-number metric-critical">
                 {analisis.filter(item => item.dias_inventario_restante !== null && item.dias_inventario_restante <= 7).length}
               </div>
               <div className="metric-label">Críticos (≤7 días)</div>
             </div>
             <div className="metric-card">
               <div className="metric-number metric-urgent">
                 {analisis.filter(item => item.dias_inventario_restante !== null && item.dias_inventario_restante > 7 && item.dias_inventario_restante <= 14).length}
               </div>
               <div className="metric-label">Urgentes (8-14 días)</div>
             </div>
             <div className="metric-card">
               <div className="metric-number metric-ok">
                 {analisis.filter(item => item.dias_inventario_restante !== null && item.dias_inventario_restante > 30).length}
               </div>
               <div className="metric-label">OK (&gt;30 días)</div>
             </div>
             <div className="metric-card">
               <div className="metric-number metric-historical">
                 {analisis.filter(item => item.dias_inventario_restante === null).length}
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
              Lógica de Análisis de Recompra por Proveedor
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold mb-2 text-blue-400">🎯 Objetivo:</h4>
              <p className="mb-2 text-gray-300">Analizar productos comprados a un proveedor específico y proyectar recompra basada en las ventas realizadas desde la primera compra.</p>
              
              <h4 className="font-semibold mb-2 text-blue-400">📈 Cálculo de Frecuencia:</h4>
              <p className="mb-2 text-gray-300">Frecuencia diaria = Total vendido desde primera compra ÷ Días transcurridos desde primera compra</p>
              
              <h4 className="font-semibold mb-2 text-blue-400">🛒 Sugerencia de Compra:</h4>
              <p className="mb-2 text-gray-300">Proyección 30 días + 20% margen de seguridad - Stock actual</p>
              
              <h4 className="font-semibold mb-2 text-blue-400">📊 Modo Ignorar Stock (La Dorada):</h4>
              <p className="text-gray-300">Cuando está habilitado, el análisis se basa únicamente en cantidades compradas y vendidas, sin considerar inventario actual.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-blue-400">🔍 Filtros Disponibles:</h4>
              <ul className="space-y-1 text-gray-300">
                <li>• <strong>Proveedor específico:</strong> Selecciona el proveedor a analizar</li>
                <li>• <strong>Facturas específicas:</strong> Analiza solo ciertas facturas del proveedor</li>
                <li>• <strong>Todas las facturas:</strong> Análisis completo del proveedor</li>
                                 <li>• <strong>Ignorar stock:</strong> Análisis basado solo en compras y ventas (La Dorada)</li>
                 <li>• <strong>Filtro por días:</strong> Analiza facturas de los últimos 15, 30, 60 o 90 días</li>
              </ul>
              
              <h4 className="font-semibold mb-2 mt-4 text-blue-400">💰 Métricas Incluidas:</h4>
              <ul className="space-y-1 text-gray-300">
                <li>• Margen de ganancia al detal y mayorista</li>
                <li>• Historial completo de compras y ventas</li>
                <li>• Proyección de demanda y sugerencias</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
