import { useState } from 'react';

export default function FilterPanel({ onFilterChange }) {
  const [filters, setFilters] = useState({
    sede: 'ambas',
    categoria: 'todas',
    fechaInicio: '',
    fechaFin: '',
    stockMinimo: 0
  });

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
          </svg>
          Filtros de Análisis
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Filtro por Sede */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            Sede
          </label>
          <select
            value={filters.sede}
            onChange={(e) => handleFilterChange('sede', e.target.value)}
            className="select-corporate w-full"
          >
            <option value="ambas">Ambas Sedes</option>
            <option value="ladorada">La Dorada</option>
            <option value="manizales">Manizales</option>
          </select>
        </div>

        {/* Filtro por Categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
            </svg>
            Categoría
          </label>
          <select
            value={filters.categoria}
            onChange={(e) => handleFilterChange('categoria', e.target.value)}
            className="select-corporate w-full"
          >
            <option value="todas">Todas las Categorías</option>
            <option value="cristaleria">Cristalería</option>
            <option value="porcelana">Porcelana</option>
            <option value="accesorios">Accesorios</option>
          </select>
        </div>

        {/* Filtro por Fecha Inicio */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            Fecha Inicio
          </label>
          <input
            type="date"
            value={filters.fechaInicio}
            onChange={(e) => handleFilterChange('fechaInicio', e.target.value)}
            className="input-corporate w-full"
          />
        </div>

        {/* Filtro por Fecha Fin */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            Fecha Fin
          </label>
          <input
            type="date"
            value={filters.fechaFin}
            onChange={(e) => handleFilterChange('fechaFin', e.target.value)}
            className="input-corporate w-full"
          />
        </div>

        {/* Filtro por Stock Mínimo */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Stock Mínimo
          </label>
          <input
            type="number"
            min="0"
            value={filters.stockMinimo}
            onChange={(e) => handleFilterChange('stockMinimo', parseInt(e.target.value) || 0)}
            className="input-corporate w-full"
            placeholder="0"
          />
        </div>
      </div>

      {/* Botón de Limpiar Filtros */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={() => {
            const resetFilters = {
              sede: 'ambas',
              categoria: 'todas',
              fechaInicio: '',
              fechaFin: '',
              stockMinimo: 0
            };
            setFilters(resetFilters);
            onFilterChange(resetFilters);
          }}
          className="btn-secondary flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Limpiar Filtros
        </button>
      </div>
    </div>
  );
}
