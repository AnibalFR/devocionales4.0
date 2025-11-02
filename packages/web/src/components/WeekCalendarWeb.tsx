import { useMemo, useState } from 'react';
import { CalendarVisitCard } from './CalendarVisitCard';
import {
  getWeekDates,
  getDayAbbreviation,
  getDayNumber,
  isToday,
  parseDateString,
  formatDateString,
} from '../utils/dateHelpers';

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

interface WeekCalendarWebProps {
  visitas: Visita[];
  currentWeekStart: Date;
  onVisitClick: (visitaId: string) => void;
  onRescheduleVisit?: (visitaId: string, newDate: string) => Promise<void>;
}

// Helper para detectar si dos horarios tienen conflicto (dentro de 30 minutos)
const tieneConflictoHorario = (visita1: Visita, visita2: Visita): boolean => {
  if (visita1.id === visita2.id) return false;

  const time1 = visita1.visitTime.split(':').map(Number);
  const time2 = visita2.visitTime.split(':').map(Number);

  const minutes1 = time1[0] * 60 + time1[1];
  const minutes2 = time2[0] * 60 + time2[1];

  // Conflicto si están a menos de 30 minutos
  return Math.abs(minutes1 - minutes2) < 30;
};

export function WeekCalendarWeb({ visitas, currentWeekStart, onVisitClick, onRescheduleVisit }: WeekCalendarWebProps) {
  const [draggedVisitId, setDraggedVisitId] = useState<string | null>(null);
  const [dropTargetDate, setDropTargetDate] = useState<string | null>(null);

  // Get array of 7 dates for the week
  const weekDates = useMemo(() => getWeekDates(currentWeekStart), [currentWeekStart]);

  // Group visitas by day
  const visitasByDay = useMemo(() => {
    const grouped: { [key: string]: Visita[] } = {};

    weekDates.forEach((date) => {
      const dateStr = formatDateString(date);
      grouped[dateStr] = [];
    });

    visitas.forEach((visita) => {
      const visitDate = parseDateString(visita.visitDate);
      const dateStr = formatDateString(visitDate);

      if (grouped[dateStr]) {
        grouped[dateStr].push(visita);
      }
    });

    // Sort visitas by time within each day
    Object.keys(grouped).forEach((dateStr) => {
      grouped[dateStr].sort((a, b) => {
        return a.visitTime.localeCompare(b.visitTime);
      });
    });

    return grouped;
  }, [visitas, weekDates]);

  // Drag & Drop handlers
  const handleDragStart = (visitaId: string) => {
    setDraggedVisitId(visitaId);
  };

  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    setDropTargetDate(dateStr);
  };

  const handleDragLeave = () => {
    setDropTargetDate(null);
  };

  const handleDrop = async (e: React.DragEvent, newDateStr: string) => {
    e.preventDefault();
    setDropTargetDate(null);

    if (!draggedVisitId || !onRescheduleVisit) return;

    const draggedVisita = visitas.find(v => v.id === draggedVisitId);
    if (!draggedVisita) return;

    // No hacer nada si es el mismo día
    if (draggedVisita.visitDate === newDateStr) {
      setDraggedVisitId(null);
      return;
    }

    try {
      await onRescheduleVisit(draggedVisitId, newDateStr);
    } catch (error) {
      console.error('Error rescheduling visit:', error);
    } finally {
      setDraggedVisitId(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Grid de 7 columnas */}
      <div className="grid grid-cols-7 gap-0 border-b border-gray-200">
        {weekDates.map((date, index) => {
          const dayAbbr = getDayAbbreviation(date);
          const dayNum = getDayNumber(date);
          const today = isToday(date);
          const dateStr = formatDateString(date);
          const dayVisitas = visitasByDay[dateStr] || [];

          return (
            <div
              key={index}
              className={`
                border-r border-gray-200 last:border-r-0
                ${today ? 'bg-primary-50' : 'bg-white'}
              `}
            >
              {/* Day header */}
              <div
                className={`
                  p-3 text-center border-b border-gray-200
                  ${today ? 'bg-primary-100' : 'bg-gray-50'}
                `}
              >
                <div
                  className={`
                    text-xs font-semibold uppercase tracking-wide mb-1
                    ${today ? 'text-primary-700' : 'text-gray-600'}
                  `}
                >
                  {dayAbbr}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div
                    className={`
                      inline-flex items-center justify-center w-8 h-8 rounded-full
                      ${today ? 'bg-primary-600 text-white font-bold' : 'text-gray-900 font-semibold'}
                    `}
                  >
                    {dayNum}
                  </div>
                  {/* Badge de conteo */}
                  {dayVisitas.length > 0 && (
                    <div
                      className={`
                        inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full text-xs font-bold
                        ${today ? 'bg-primary-700 text-white' : 'bg-gray-700 text-white'}
                      `}
                      title={`${dayVisitas.length} visita${dayVisitas.length !== 1 ? 's' : ''}`}
                    >
                      {dayVisitas.length}
                    </div>
                  )}
                </div>
              </div>

              {/* Day content */}
              <div
                className={`p-2 min-h-[400px] max-h-[600px] overflow-y-auto transition-colors ${
                  dropTargetDate === dateStr ? 'bg-primary-100 ring-2 ring-primary-500' : ''
                }`}
                onDragOver={(e) => handleDragOver(e, dateStr)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, dateStr)}
              >
                {dayVisitas.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                    {dropTargetDate === dateStr ? 'Soltar aquí' : 'Sin visitas'}
                  </div>
                ) : (
                  dayVisitas.map((visita) => {
                    // Detectar conflictos para esta visita
                    const tieneConflicto = dayVisitas.some(otraVisita =>
                      tieneConflictoHorario(visita, otraVisita)
                    );

                    return (
                      <CalendarVisitCard
                        key={visita.id}
                        visita={visita}
                        onClick={() => onVisitClick(visita.id)}
                        tieneConflicto={tieneConflicto}
                        onDragStart={() => handleDragStart(visita.id)}
                        isDragging={draggedVisitId === visita.id}
                      />
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
