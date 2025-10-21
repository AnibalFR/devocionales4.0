import { useQuery, gql } from '@apollo/client';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  RefreshCw,
  Clock,
  User,
  FileText,
  LogIn,
  PlusCircle,
  Edit,
  Trash2,
  Download,
  Upload
} from 'lucide-react';

const TIMELINE_EVENTS_QUERY = gql`
  query TimelineEvents($limit: Int, $cursor: String) {
    timelineEvents(limit: $limit, cursor: $cursor) {
      events {
        id
        timestampUtc
        actorName
        actorRole
        actionType
        entityType
        summary
      }
      hasMore
      cursor
    }
  }
`;

interface TimelineEvent {
  id: string;
  timestampUtc: string;
  actorName: string;
  actorRole: string;
  actionType: string;
  entityType: string;
  summary: string;
}

interface GroupedEvent extends TimelineEvent {
  count: number;
  latestTimestamp: string;
}

const getActionIcon = (actionType: string) => {
  const iconProps = { className: 'w-5 h-5' };

  switch (actionType) {
    case 'login':
      return <LogIn {...iconProps} />;
    case 'create':
      return <PlusCircle {...iconProps} />;
    case 'update':
      return <Edit {...iconProps} />;
    case 'delete':
      return <Trash2 {...iconProps} />;
    case 'import':
      return <Download {...iconProps} />;
    case 'export':
      return <Upload {...iconProps} />;
    default:
      return <FileText {...iconProps} />;
  }
};

const getActionColor = (actionType: string) => {
  switch (actionType) {
    case 'login':
      return 'bg-gray-100 text-gray-700';
    case 'create':
      return 'bg-green-100 text-green-700';
    case 'update':
      return 'bg-blue-100 text-blue-700';
    case 'delete':
      return 'bg-red-100 text-red-700';
    case 'import':
    case 'export':
      return 'bg-purple-100 text-purple-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export default function TimelinePage() {
  const { data, loading, refetch, fetchMore } = useQuery(TIMELINE_EVENTS_QUERY, {
    variables: { limit: 50 },
  });

  const events: TimelineEvent[] = data?.timelineEvents?.events || [];
  const hasMore = data?.timelineEvents?.hasMore || false;
  const cursor = data?.timelineEvents?.cursor;

  const handleLoadMore = () => {
    if (hasMore && cursor) {
      fetchMore({
        variables: { cursor, limit: 50 },
      });
    }
  };

  const groupEventsByDay = (events: TimelineEvent[]) => {
    const groups: { [key: string]: TimelineEvent[] } = {};

    events.forEach((event) => {
      const date = new Date(event.timestampUtc);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let dayLabel: string;
      if (date.toDateString() === today.toDateString()) {
        dayLabel = 'Hoy';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dayLabel = 'Ayer';
      } else {
        dayLabel = date.toLocaleDateString('es-MX', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }

      if (!groups[dayLabel]) {
        groups[dayLabel] = [];
      }
      groups[dayLabel].push(event);
    });

    return groups;
  };

  const groupDuplicateEvents = (events: TimelineEvent[]): GroupedEvent[] => {
    const grouped: { [key: string]: GroupedEvent } = {};

    events.forEach((event) => {
      // Crear una clave única basada en los campos que definen eventos "iguales"
      const key = `${event.summary}|${event.actionType}|${event.actorName}|${event.entityType}`;

      if (grouped[key]) {
        // Si ya existe, incrementar el contador y actualizar el timestamp si es más reciente
        grouped[key].count += 1;
        const currentTimestamp = new Date(grouped[key].latestTimestamp);
        const eventTimestamp = new Date(event.timestampUtc);
        if (eventTimestamp > currentTimestamp) {
          grouped[key].latestTimestamp = event.timestampUtc;
        }
      } else {
        // Si es nuevo, crear el grupo
        grouped[key] = {
          ...event,
          count: 1,
          latestTimestamp: event.timestampUtc,
        };
      }
    });

    // Convertir a array y ordenar por timestamp más reciente
    return Object.values(grouped).sort(
      (a, b) => new Date(b.latestTimestamp).getTime() - new Date(a.latestTimestamp).getTime()
    );
  };

  const groupEventsByDayWithCounts = (events: TimelineEvent[]) => {
    const dayGroups = groupEventsByDay(events);
    const result: { [key: string]: GroupedEvent[] } = {};

    Object.entries(dayGroups).forEach(([day, dayEvents]) => {
      result[day] = groupDuplicateEvents(dayEvents);
    });

    return result;
  };

  const groupedEvents = groupEventsByDayWithCounts(events);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Línea de Tiempo</h1>
          <p className="text-gray-600 mt-1">Actividad reciente del sistema</p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Loading State */}
      {loading && events.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && events.length === 0 && (
        <div className="text-center py-12">
          <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay eventos recientes</h3>
          <p className="text-gray-600">Los eventos aparecerán aquí cuando los usuarios realicen acciones en el sistema.</p>
        </div>
      )}

      {/* Events Timeline */}
      {Object.keys(groupedEvents).length > 0 && (
        <div className="space-y-8">
          {Object.entries(groupedEvents).map(([day, dayEvents]) => (
            <div key={day}>
              {/* Day Header */}
              <div className="sticky top-0 bg-white py-2 mb-4 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900 uppercase">{day}</h2>
              </div>

              {/* Events List */}
              <div className="space-y-3">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getActionColor(event.actionType)}`}>
                      {getActionIcon(event.actionType)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-gray-900 font-medium">{event.summary}</p>
                        {event.count > 1 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {event.count}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(event.latestTimestamp), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {event.actorRole}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {event.entityType}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Cargando...' : 'Cargar más eventos'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
