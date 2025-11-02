import { Home, RefreshCw, X, ClipboardList, Calendar, AlertTriangle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

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
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
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

  // Calculate tooltip position when showing
  useEffect(() => {
    if (showTooltip && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const tooltipWidth = 288; // w-72 = 18rem = 288px
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Default: show to the right
      let left = rect.right + 8; // 8px margin
      let top = rect.top;

      // If tooltip would go off right edge, show on left instead
      if (left + tooltipWidth > viewportWidth) {
        left = rect.left - tooltipWidth - 8;
      }

      // If tooltip would go off left edge, center it
      if (left < 8) {
        left = Math.max(8, (viewportWidth - tooltipWidth) / 2);
      }

      // Adjust vertical position if too close to bottom
      const tooltipHeight = 300; // approximate
      if (top + tooltipHeight > viewportHeight) {
        top = Math.max(8, viewportHeight - tooltipHeight - 8);
      }

      setTooltipPosition({ top, left });
    }
  }, [showTooltip]);

  return (
    <>
      <div
        ref={cardRef}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
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

      {/* Tooltip - Rendered with fixed positioning to escape overflow constraints */}
      {showTooltip && (
        <div
          className="fixed z-50 w-72 bg-gray-900 text-white text-xs rounded-lg shadow-xl p-3 pointer-events-none"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
          }}
        >
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
        </div>
      )}
    </>
  );
}
