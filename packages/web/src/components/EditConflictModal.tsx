import { AlertTriangle, RefreshCw, Save } from 'lucide-react';

interface EditConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReload: () => void;
  onOverwrite: () => void;
  entityType: string; // "familia", "miembro", etc.
  fieldName?: string;
}

export default function EditConflictModal({
  isOpen,
  onClose,
  onReload,
  onOverwrite,
  entityType,
  fieldName
}: EditConflictModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          {/* Header con icono de alerta */}
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Conflicto de Edición Detectado
              </h3>
              <p className="text-sm text-gray-600">
                Otro usuario modificó {fieldName ? `el campo "${fieldName}" de ` : ''}este{' '}
                {entityType} mientras editabas.
              </p>
            </div>
          </div>

          {/* Mensaje explicativo */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <p className="text-sm text-gray-700">
              Para evitar perder cambios importantes, puedes:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
              <li>Recargar los datos más recientes (recomendado)</li>
              <li>Sobrescribir con tus cambios (puede perder datos del otro usuario)</li>
            </ul>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onReload}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <RefreshCw size={16} />
              Recargar Datos
            </button>
            <button
              onClick={onOverwrite}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
            >
              <Save size={16} />
              Sobrescribir
            </button>
          </div>

          {/* Botón cancelar */}
          <button
            onClick={onClose}
            className="w-full mt-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
