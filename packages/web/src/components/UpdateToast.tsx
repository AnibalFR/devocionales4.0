import { RefreshCw, X } from 'lucide-react';

interface UpdateToastProps {
  onUpdate: () => void;
  onDismiss: () => void;
}

export function UpdateToast({ onUpdate, onDismiss }: UpdateToastProps) {
  return (
    <div
      className="fixed bottom-4 right-4 z-50 animate-slide-in"
      role="alert"
      aria-live="polite"
    >
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-blue-600" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">
              Nueva versión disponible
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Hay una actualización de la aplicación disponible.
            </p>

            <div className="mt-3 flex space-x-2">
              <button
                onClick={onUpdate}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Actualizar ahora
              </button>
              <button
                onClick={onDismiss}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Más tarde
              </button>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
