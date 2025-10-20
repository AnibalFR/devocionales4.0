import { useEffect, useRef } from 'react';
import { AlertCircle, RefreshCw, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface UpdateModalProps {
  release: {
    buildId: string;
    notes: string[];
    requiresReload: boolean;
    requiresReauth: boolean;
  };
  onUpdate: () => void;
  onDismiss: () => void;
}

export function UpdateModal({ release, onUpdate, onDismiss }: UpdateModalProps) {
  const { logout } = useAuth();
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap y accesibilidad
  useEffect(() => {
    // Focus en el primer botón al montar
    firstButtonRef.current?.focus();

    // Bloquear scroll del body
    document.body.style.overflow = 'hidden';

    // Manejar tecla ESC
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !release.requiresReload && !release.requiresReauth) {
        onDismiss();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onDismiss, release.requiresReload, release.requiresReauth]);

  const handleLogoutAndReload = () => {
    logout();
    // Esperar un momento para que se limpie el estado
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const isCritical = release.requiresReload || release.requiresReauth;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay */}
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={isCritical ? undefined : onDismiss}
        />

        {/* Espaciador para centrar modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-blue-50 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                {isCritical ? (
                  <AlertCircle className="h-6 w-6 text-blue-600" aria-hidden="true" />
                ) : (
                  <RefreshCw className="h-6 w-6 text-blue-600" aria-hidden="true" />
                )}
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  {isCritical
                    ? 'Actualización importante disponible'
                    : 'Nueva versión disponible'}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    {isCritical
                      ? 'Esta actualización incluye cambios importantes que requieren tu atención.'
                      : 'Hemos mejorado la aplicación con nuevas características y correcciones.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notas del release */}
          {release.notes && release.notes.length > 0 && (
            <div className="px-4 py-3 sm:px-6 bg-white border-t border-b border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Novedades:</h4>
              <ul className="space-y-1">
                {release.notes.slice(0, 5).map((note, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Acciones */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
            {release.requiresReauth ? (
              <button
                ref={firstButtonRef}
                type="button"
                onClick={handleLogoutAndReload}
                className="w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar sesión y actualizar
              </button>
            ) : (
              <button
                ref={firstButtonRef}
                type="button"
                onClick={onUpdate}
                className="w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar ahora
              </button>
            )}

            {!isCritical && (
              <button
                type="button"
                onClick={onDismiss}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors"
              >
                Más tarde
              </button>
            )}
          </div>

          {isCritical && (
            <div className="bg-yellow-50 px-4 py-2 border-t border-yellow-200">
              <p className="text-xs text-yellow-800 text-center">
                Esta actualización es necesaria para continuar usando la aplicación
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
