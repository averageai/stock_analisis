import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function Layout({ children, title = 'Sistema de Análisis de Inventario' }) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => router.pathname === path;

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Head>
        <title>{title}</title>
        <meta name="description" content="Sistema de análisis de inventario multi-sede" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header Moderno con Glassmorphism */}
      <nav className="backdrop-blur-md bg-gray-900/80 border-b border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo y Branding */}
            <div className="flex items-center">
              <div className="flex items-center space-x-3 sm:space-x-4">
                {/* Logo Animado */}
                <div className="relative">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-all duration-300">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                  </div>
                  {/* Efecto de brillo */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                
                {/* Título y Subtítulo */}
                <div className="hidden sm:block">
                  <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Stock Análisis
                  </h1>
                  <p className="text-xs text-gray-400 font-medium">Control de inventario multi-sede</p>
                </div>
                
                {/* Título solo para móvil */}
                <div className="sm:hidden">
                  <h1 className="text-sm font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Stock
                  </h1>
                </div>
              </div>
            </div>
            
            {/* Navegación Principal Mejorada - Solo Desktop */}
            <div className="hidden xl:flex items-center space-x-1">
              <Link href="/" className={`nav-link-modern ${isActive('/') ? 'nav-link-active' : ''}`}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                <span>Dashboard</span>
              </Link>
              
              <Link href="/proyeccion-compras" className={`nav-link-modern ${isActive('/proyeccion-compras') ? 'nav-link-active' : ''}`}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Proyección</span>
              </Link>
              
              <Link href="/recompra-proveedor" className={`nav-link-modern ${isActive('/recompra-proveedor') ? 'nav-link-active' : ''}`}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                  <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                <span>Recompra</span>
              </Link>
              
              <Link href="/productos-sin-movimiento" className={`nav-link-modern ${isActive('/productos-sin-movimiento') ? 'nav-link-active' : ''}`}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>Sin Movimiento</span>
              </Link>
              
              <Link href="/mas-vendidos" className={`nav-link-modern ${isActive('/mas-vendidos') ? 'nav-link-active' : ''}`}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                  <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                </svg>
                <span>Más Vendidos</span>
              </Link>
              
              <Link href="/validacion-producto" className={`nav-link-modern ${isActive('/validacion-producto') ? 'nav-link-active' : ''}`}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                <span>Validación</span>
              </Link>
              
              <Link href="/debug-db" className={`nav-link-modern ${isActive('/debug-db') ? 'nav-link-active' : ''}`}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>Debug</span>
              </Link>
            </div>

            {/* Indicadores de Estado */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Status Indicators - Solo Desktop */}
              <div className="hidden lg:flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-400 font-medium">Online</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-xs text-gray-400 font-medium">Multi-sede</span>
                </div>
              </div>
              
              {/* Indicador de estado móvil */}
              <div className="lg:hidden flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              
              {/* Botón de Menú Móvil */}
              <div className="xl:hidden">
                <button 
                  onClick={toggleMobileMenu}
                  className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors duration-200"
                  aria-label="Toggle mobile menu"
                >
                  <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    {mobileMenuOpen ? (
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    ) : (
                      <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navegación Móvil Mejorada */}
        <div className={`xl:hidden transition-all duration-300 ease-in-out overflow-hidden ${mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="px-4 py-3 space-y-1 bg-gray-800/50 backdrop-blur-md border-t border-gray-700/50">
            <Link href="/" onClick={closeMobileMenu} className={`mobile-nav-link-modern ${isActive('/') ? 'mobile-nav-link-active' : ''}`}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              <span>Dashboard</span>
            </Link>
            <Link href="/proyeccion-compras" onClick={closeMobileMenu} className={`mobile-nav-link-modern ${isActive('/proyeccion-compras') ? 'mobile-nav-link-active' : ''}`}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Proyección</span>
            </Link>
            <Link href="/recompra-proveedor" onClick={closeMobileMenu} className={`mobile-nav-link-modern ${isActive('/recompra-proveedor') ? 'mobile-nav-link-active' : ''}`}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              <span>Recompra</span>
            </Link>
            <Link href="/productos-sin-movimiento" onClick={closeMobileMenu} className={`mobile-nav-link-modern ${isActive('/productos-sin-movimiento') ? 'mobile-nav-link-active' : ''}`}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>Sin Movimiento</span>
            </Link>
            <Link href="/mas-vendidos" onClick={closeMobileMenu} className={`mobile-nav-link-modern ${isActive('/mas-vendidos') ? 'mobile-nav-link-active' : ''}`}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
              </svg>
              <span>Más Vendidos</span>
            </Link>
            <Link href="/validacion-producto" onClick={closeMobileMenu} className={`mobile-nav-link-modern ${isActive('/validacion-producto') ? 'mobile-nav-link-active' : ''}`}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              <span>Validación</span>
            </Link>
            <Link href="/debug-db" onClick={closeMobileMenu} className={`mobile-nav-link-modern ${isActive('/debug-db') ? 'mobile-nav-link-active' : ''}`}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>Debug</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Contenido Principal con Padding Mejorado */}
      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="fade-in">
          {children}
        </div>
      </main>

      {/* Footer Moderno */}
      <footer className="mt-16 backdrop-blur-md bg-gray-900/80 border-t border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Información de la Empresa */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-2 mb-2">
                <div className="w-6 h-6 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Stock Análisis
                </h3>
              </div>
              <p className="text-sm text-gray-400 font-medium">
                &copy; {new Date().getFullYear()} Sistema de Análisis de Stock
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Desarrollado por Humanos + IA en{' '}
                <a 
                  href="https://ai.average.lat" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-300 transition-colors duration-200 underline"
                >
                  average
                </a>
              </p>
            </div>
            
            {/* Indicadores de Estado */}
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-4 sm:gap-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-400 font-medium">Sistema Activo</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-400 font-medium">Multi-sede</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span className="text-sm text-gray-400 font-medium">v1.0 Stable</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .nav-link-modern {
          @apply flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all duration-200 relative overflow-hidden;
        }
        
        .nav-link-modern::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(55, 65, 81, 0.1), transparent);
          transition: left 0.5s;
        }
        
        .nav-link-modern:hover::before {
          left: 100%;
        }
        
        .nav-link-active {
          @apply text-white bg-gray-600/20 border border-gray-500/30;
        }
        
        .mobile-nav-link-modern {
          @apply flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all duration-200;
        }
        
        .mobile-nav-link-active {
          @apply text-white bg-gray-600/20 border border-gray-500/30;
        }
        
        .fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
