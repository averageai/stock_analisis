import { useState } from 'react';
import Layout from '../components/Layout';

export default function DebugDB() {
  const [sede, setSede] = useState('ladorada');
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ejecutarDiagnostico = async () => {
    setLoading(true);
    setError(null);
    setResultado(null);

    try {
      const response = await fetch(`/api/debug-db?sede=${sede}`);
      const data = await response.json();

      if (data.success) {
        setResultado(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Debug DB - Sistema de Análisis de Inventario">
      <div className="space-y-6">
        {/* Header */}
        <div className="card">
          <div className="card-header">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <svg className="w-8 h-8 mr-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Diagnóstico de Base de Datos
            </h1>
            <p className="text-gray-300">
              Herramienta de diagnóstico para verificar el estado y estructura de la base de datos
            </p>
          </div>
        </div>
        
        {/* Controles */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
              Configuración del Diagnóstico
            </h3>
          </div>
          <div className="mb-4">
            <label className="label-corporate block mb-2">
              Seleccionar Sede:
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
          
          <button
            onClick={ejecutarDiagnostico}
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Ejecutando diagnóstico...' : 'Ejecutar Diagnóstico'}
          </button>
        </div>

        {error && (
          <div className="status-bar status-bar-danger">
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Error en el Diagnóstico
            </h3>
            <p>{error}</p>
          </div>
        )}

        {resultado && (
          <div className="space-y-6">
            <div className="status-bar status-bar-success">
              <h3 className="font-semibold mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Diagnóstico Completado
              </h3>
              <p><strong>Sede:</strong> {resultado.sede}</p>
              <p><strong>Timestamp:</strong> {resultado.timestamp}</p>
            </div>

            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  Permisos de Base de Datos
                </h2>
              </div>
              <div className="table-container">
                <pre className="p-4 overflow-auto text-sm text-white">
                  {JSON.stringify(resultado.permisos, null, 2)}
                </pre>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                  </svg>
                  Estructura de Tabla Provider
                </h2>
              </div>
              <div className="table-container">
                <pre className="p-4 overflow-auto text-sm text-white">
                  {JSON.stringify(resultado.estructuraProvider, null, 2)}
                </pre>
              </div>
            </div>

            <div className="status-bar status-bar-warning">
              <h3 className="font-semibold mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Recomendaciones
              </h3>
              <ul className="list-disc list-inside space-y-1">
                {resultado.recomendaciones.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
