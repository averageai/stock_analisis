import Layout from '../components/Layout';
import FilterPanel from '../components/FilterPanel';

export default function ProductosSinMovimiento() {
  return (
    <Layout title="Productos Sin Movimiento - Sistema de Análisis de Inventario">
      <div className="space-y-6">
        {/* Header Corporativo */}
        <div className="card">
          <div className="card-header">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <svg className="w-8 h-8 mr-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Productos Sin Movimiento
            </h1>
            <p className="text-gray-300">
              Análisis de productos que no han tenido actividad reciente
            </p>
          </div>
        </div>

        {/* Filtros */}
        <FilterPanel onFilterChange={() => {}} />

        {/* Contenido de Productos Sin Movimiento */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Productos Inactivos
            </h3>
          </div>
          <div className="space-y-4">
            <p className="text-gray-300">
              Esta funcionalidad mostrará productos que no han tenido ventas o movimientos recientes.
            </p>
            
            <div className="bg-yellow-900/20 p-4 rounded-lg border border-yellow-700/30">
              <h4 className="font-semibold text-yellow-300 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Funcionalidades Pendientes:
              </h4>
              <ul className="list-disc list-inside text-yellow-200 space-y-1">
                <li>Identificación de productos sin ventas</li>
                <li>Análisis de tiempo sin movimiento</li>
                <li>Productos con stock obsoleto</li>
                <li>Recomendaciones de liquidación</li>
                <li>Reportes de inactividad por sede</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
