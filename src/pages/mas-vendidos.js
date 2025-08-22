import Layout from '../components/Layout';
import FilterPanel from '../components/FilterPanel';

export default function MasVendidos() {
  return (
    <Layout title="Productos Más Vendidos - Sistema de Análisis de Inventario">
      <div className="space-y-6">
        {/* Header Corporativo */}
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
              Análisis de productos con mayor demanda en ambas sedes
            </p>
          </div>
        </div>

        {/* Filtros */}
        <FilterPanel onFilterChange={() => {}} />

        {/* Contenido de Más Vendidos */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Top de Ventas
            </h3>
          </div>
          <div className="space-y-4">
            <p className="text-gray-300">
              Esta funcionalidad mostrará los productos con mayor volumen de ventas.
            </p>
            
            <div className="bg-green-900/20 p-4 rounded-lg border border-green-700/30">
              <h4 className="font-semibold text-green-300 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Funcionalidades Pendientes:
              </h4>
              <ul className="list-disc list-inside text-green-200 space-y-1">
                <li>Ranking de productos más vendidos</li>
                <li>Análisis de tendencias de venta</li>
                <li>Comparación entre sedes</li>
                <li>Análisis por categorías</li>
                <li>Reportes de rendimiento por período</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
