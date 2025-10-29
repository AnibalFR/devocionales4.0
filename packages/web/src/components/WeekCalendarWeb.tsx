import { useMemo } from 'react';
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
}

interface WeekCalendarWebProps {
  visitas: Visita[];
  currentWeekStart: Date;
  onVisitClick: (visitaId: string) => void;
}

export function WeekCalendarWeb({ visitas, currentWeekStart, onVisitClick }: WeekCalendarWebProps) {
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
                <div
                  className={`
                    inline-flex items-center justify-center w-8 h-8 rounded-full
                    ${today ? 'bg-primary-600 text-white font-bold' : 'text-gray-900 font-semibold'}
                  `}
                >
                  {dayNum}
                </div>
              </div>

              {/* Day content */}
              <div className="p-2 min-h-[400px] max-h-[600px] overflow-y-auto">
                {dayVisitas.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                    Sin visitas
                  </div>
                ) : (
                  dayVisitas.map((visita) => (
                    <CalendarVisitCard
                      key={visita.id}
                      visita={visita}
                      onClick={() => onVisitClick(visita.id)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
