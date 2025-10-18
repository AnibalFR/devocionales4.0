import { ReactNode, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [otrosOpen, setOtrosOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isOtrosActive = () => {
    return ['/devocionales', '/metas', '/barrios', '/nucleos'].includes(location.pathname);
  };

  const navLinkClass = (path: string) => {
    const base = 'px-3 py-2 rounded-md text-sm font-medium transition-colors';
    return isActive(path)
      ? `${base} bg-primary-100 text-primary-700`
      : `${base} text-gray-700 hover:bg-gray-100`;
  };

  const dropdownButtonClass = () => {
    const base = 'px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1';
    return isOtrosActive()
      ? `${base} bg-primary-100 text-primary-700`
      : `${base} text-gray-700 hover:bg-gray-100`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/familias" className="text-xl font-bold text-primary-600">
                Devocionales 4.0
              </Link>

              <nav className="hidden md:flex space-x-2 items-center">
                <Link to="/reporte-ciclo" className={navLinkClass('/reporte-ciclo')}>
                  Reporte
                </Link>
                <Link to="/familias" className={navLinkClass('/familias')}>
                  Familias
                </Link>
                <Link to="/miembros" className={navLinkClass('/miembros')}>
                  Miembros
                </Link>
                <Link to="/visitas" className={navLinkClass('/visitas')}>
                  Visitas
                </Link>

                {/* Dropdown Otros */}
                <div className="relative">
                  <button
                    onClick={() => setOtrosOpen(!otrosOpen)}
                    onBlur={() => setTimeout(() => setOtrosOpen(false), 200)}
                    className={dropdownButtonClass()}
                  >
                    <span>Otros</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${otrosOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {otrosOpen && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                      <Link
                        to="/devocionales"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setOtrosOpen(false)}
                      >
                        Devocionales
                      </Link>
                      <Link
                        to="/metas"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setOtrosOpen(false)}
                      >
                        Metas
                      </Link>
                      <Link
                        to="/barrios"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setOtrosOpen(false)}
                      >
                        Barrios
                      </Link>
                      <Link
                        to="/nucleos"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setOtrosOpen(false)}
                      >
                        Núcleos
                      </Link>
                    </div>
                  )}
                </div>

                <Link to="/exportar-importar" className={navLinkClass('/exportar-importar')}>
                  Exportar/Importar
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{user?.nombre}</span>
                <span className="ml-2 text-gray-500">({user?.rol})</span>
              </div>
              <button onClick={handleLogout} className="btn btn-secondary">
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            Devocionales 4.0 - Sistema de Gestión de Visitas
          </p>
        </div>
      </footer>
    </div>
  );
}
