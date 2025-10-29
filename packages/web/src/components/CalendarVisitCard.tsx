import { Home, RefreshCw, X, ClipboardList } from 'lucide-react';

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
}

interface CalendarVisitCardProps {
  visita: Visita;
  onClick: () => void;
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

export function CalendarVisitCard({ visita, onClick }: CalendarVisitCardProps) {
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
      onClick={onClick}
      className={`
        ${colors.bg} ${colors.border}
        border-l-4 rounded-lg p-2.5 mb-2
        cursor-pointer transition-all duration-200
        hover:shadow-md hover:scale-[1.02]
        group
      `}
    >
      {/* Hora y Tipo */}
      <div className="flex items-start justify-between mb-2">
        <span className={`text-sm font-bold ${colors.text}`}>
          {visita.visitTime}
        </span>
        <div title={visita.visitType}>
          <IconComponent className={`w-4 h-4 ${colors.text}`} />
        </div>
      </div>

      {/* Familia */}
      <div className="mb-2">
        <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
          {visita.familia.nombre}
        </p>
      </div>

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
  );
}
