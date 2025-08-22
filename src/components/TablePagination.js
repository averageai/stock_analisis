import { useState } from 'react';
import * as XLSX from 'xlsx';

export default function TablePagination({ 
  data, 
  itemsPerPage = 100, 
  maxItemsPerPage = 200,
  onExport,
  exportFileName = 'datos',
  exportData = null,
  showExport = true,
  showPagination = true
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentItemsPerPage, setCurrentItemsPerPage] = useState(itemsPerPage);

  // Calcular datos paginados
  const indexOfLastItem = currentPage * currentItemsPerPage;
  const indexOfFirstItem = indexOfLastItem - currentItemsPerPage;
  const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(data.length / currentItemsPerPage);

  // Función para exportar a Excel
  const handleExport = () => {
    if (onExport) {
      onExport();
      return;
    }

    if (!exportData || exportData.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    // Crear workbook
    const wb = XLSX.utils.book_new();

    // Hoja 1: Datos principales
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, 'Datos');

    // Hoja 2: Resumen
    const resumen = [
      { 'Campo': 'Fecha de Exportación', 'Valor': new Date().toLocaleDateString('es-ES') },
      { 'Campo': 'Total Registros', 'Valor': exportData.length },
      { 'Campo': 'Registros por Página', 'Valor': currentItemsPerPage },
      { 'Campo': 'Página Actual', 'Valor': currentPage },
      { 'Campo': 'Total Páginas', 'Valor': totalPages }
    ];

    const wsResumen = XLSX.utils.json_to_sheet(resumen);
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

    // Generar nombre del archivo
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `${exportFileName}_${fecha}.xlsx`;

    // Exportar archivo
    XLSX.writeFile(wb, nombreArchivo);
  };

  // Cambiar página
  const goToPage = (pageNumber) => {
    setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
  };

  // Cambiar items por página
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setCurrentItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset a la primera página
  };

  if (!showPagination && !showExport) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Controles superiores */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Información de paginación */}
        {showPagination && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-300">Mostrar:</span>
              <select
                value={currentItemsPerPage}
                onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                className="select-corporate text-sm"
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={150}>150</option>
                <option value={200}>200</option>
              </select>
              <span className="text-sm text-gray-300">por página</span>
            </div>
            <div className="text-sm text-gray-300">
              Mostrando {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, data.length)} de {data.length} registros
            </div>
          </div>
        )}

        {/* Botón de exportación */}
        {showExport && (
          <button
            onClick={handleExport}
            className="btn-secondary px-4 py-2 text-sm flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span>Exportar Excel</span>
          </button>
        )}
      </div>

      {/* Controles de navegación */}
      {showPagination && totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          {/* Botón Primera página */}
          <button
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Primera
          </button>

          {/* Botón Anterior */}
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>

          {/* Números de página */}
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNumber;
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (currentPage <= 3) {
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNumber}
                  onClick={() => goToPage(pageNumber)}
                  className={`px-3 py-1 text-sm rounded-md ${
                    currentPage === pageNumber
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
          </div>

          {/* Botón Siguiente */}
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>

          {/* Botón Última página */}
          <button
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Última
          </button>
        </div>
      )}

      {/* Renderizar datos paginados */}
      {currentItems}
    </div>
  );
}
