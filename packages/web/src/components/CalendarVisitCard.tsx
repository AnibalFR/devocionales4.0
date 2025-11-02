import { Home, RefreshCw, X, ClipboardList, Calendar, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface Visita {
  id: string;
  visitDate: string;
  visitTime: string;
  visitType: string;
  visitStatus: string;
  familia: {
    id: string;
    nombre: string;
  };
  visitadores: Array<{
    id: string;
    nombre: string;
  }>;
  barrio?: {
    id: string;
    nombre: string;
  };
  barrioOtro?: string;
  nucleo?: {
    id: string;
    nombre: string;
  };
  seguimientoVisita?: boolean;
  seguimientoFecha?: string;
  additionalNotes?: string;
}

interface CalendarVisitCardProps {
  visita: Visita;
  onClick: () => void;
  tieneConflicto?: boolean;
  onDragStart?: () => void;
  isDragging?: boolean;
}

const STATUS_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  programada: {
    border: 'border-yellow-500',
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
  },
  realizada: {
    border: 'border-green-500',
    bg: 'bg-green-50',
    text: 'text-green-700',
  },
  cancelada: {
    border: 'border-gray-500',
    bg: 'bg-gray-50',
    text: 'text-gray-700',
  },
};

const TIPO_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  primera_visita: Home,
  visita_seguimiento: RefreshCw,
  no_se_pudo_realizar: X,
};

const TIPO_LABELS: Record<string, string> = {
  primera_visita: 'Primera Visita',
  visita_seguimiento: 'Visita de Seguimiento',
  no_se_pudo_realizar: 'No Se Pudo Realizar',
};

const STATUS_LABELS: Record<string, string> = {
  programada: 'Programada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
};

export function CalendarVisitCard({ visita, onClick, tieneConflicto, onDragStart, isDragging }: CalendarVisitCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const colors = STATUS_COLORS[visita.visitStatus] || STATUS_COLORS.programada;
  const IconComponent = TIPO_ICONS[visita.visitType] || ClipboardList;

  // Get initials from visitadores
  const getInitials = (nombre: string) => {
    return nombre
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        draggable={!!onDragStart}
        onDragStart={onDragStart}
        onClick={onClick}
        className={`
          ${colors.bg} ${colors.border}
          border-l-4 rounded-lg p-2.5 mb-2
          cursor-pointer transition-all duration-200
          hover:shadow-md hover:scale-[1.02]
          group
          ${isDragging ? 'opacity-50 scale-95' : ''}
          ${onDragStart ? 'cursor-grab active:cursor-grabbing' : ''}
        `}
      >
        {/* Hora y Tipo */}
        <div className="flex items-start justify-between mb-2">
          <span className={`text-sm font-bold ${colors.text}`}>
            {visita.visitTime}
          </span>
          <div title={TIPO_LABELS[visita.visitType] || visita.visitType}>
            <IconComponent className={`w-4 h-4 ${colors.text}`} />
          </div>
        </div>

        {/* Familia */}
        <div className="mb-2">
          <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
            {visita.familia.nombre}
          </p>
        </div>

        {/* Indicador de seguimiento */}
        {visita.seguimientoVisita && visita.seguimientoFecha && (
          <div className="mb-2 flex items-center gap-1 text-xs text-green-700 bg-green-50 rounded px-2 py-1">
            <Calendar className="w-3 h-3" />
            <span className="font-medium">Seguimiento</span>
          </div>
        )}

        {/* Indicador de conflicto de horario */}
        {tieneConflicto && (
          <div className="mb-2 flex items-center gap-1 text-xs text-orange-700 bg-orange-50 rounded px-2 py-1">
            <AlertTriangle className="w-3 h-3" />
            <span className="font-medium">Conflicto horario</span>
          </div>
        )}

        {/* Visitadores */}
        {visita.visitadores && visita.visitadores.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {visita.visitadores.slice(0, 3).map((visitador) => (
              <div
                key={visitador.id}
                className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold"
                title={visitador.nombre}
              >
                {getInitials(visitador.nombre)}
              </div>
            ))}
            {visita.visitadores.length > 3 && (
              <div
                className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs font-semibold"
                title={`+${visita.visitadores.length - 3} más`}
              >
                +{visita.visitadores.length - 3}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute z-50 left-full ml-2 top-0 w-72 bg-gray-900 text-white text-xs rounded-lg shadow-xl p-3 pointer-events-none">
          <div className="space-y-2">
            {/* Familia y Hora */}
            <div className="border-b border-gray-700 pb-2">
              <p className="font-bold text-sm">{visita.familia.nombre}</p>
              <p className="text-gray-300">{visita.visitTime}</p>
            </div>

            {/* Tipo y Estado */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-gray-400">Tipo:</p>
                <p className="font-medium">{TIPO_LABELS[visita.visitType] || visita.visitType}</p>
              </div>
              <div>
                <p className="text-gray-400">Estado:</p>
                <p className="font-medium">{STATUS_LABELS[visita.visitStatus] || visita.visitStatus}</p>
              </div>
            </div>

            {/* Barrio y Núcleo */}
            {(visita.barrio || visita.barrioOtro || visita.nucleo) && (
              <div>
                <p className="text-gray-400">Ubicación:</p>
                <p className="font-medium">
                  {visita.barrio?.nombre || visita.barrioOtro || '-'}
                  {visita.nucleo && ` • ${visita.nucleo.nombre}`}
                </p>
              </div>
            )}

            {/* Visitadores */}
            {visita.visitadores && visita.visitadores.length > 0 && (
              <div>
                <p className="text-gray-400">Visitadores:</p>
                <p className="font-medium">
                  {visita.visitadores.map(v => v.nombre).join(', ')}
                </p>
              </div>
            )}

            {/* Seguimiento */}
            {visita.seguimientoVisita && visita.seguimientoFecha && (
              <div className="bg-green-900/30 rounded p-2 border border-green-700">
                <p className="text-green-300 font-medium">Seguimiento programado</p>
                <p className="text-xs text-green-400">
                  {new Date(visita.seguimientoFecha).toLocaleDateString('es-MX')}
                </p>
              </div>
            )}

            {/* Notas */}
            {visita.additionalNotes && (
              <div>
                <p className="text-gray-400">Notas:</p>
                <p className="font-medium text-xs">{visita.additionalNotes}</p>
              </div>
            )}
          </div>

          {/* Arrow */}
          <div className="absolute right-full top-4 w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-r-4 border-r-gray-900"></div>
        </div>
      )}
    </div>
  );
}
