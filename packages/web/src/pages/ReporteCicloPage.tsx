import { useState, useMemo } from 'react';
import { useQuery, gql } from '@apollo/client';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Users, Home, Calendar, Award, Clock, MapPin, User, CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react';

const VISITAS_POR_CICLO_QUERY = gql`
  query VisitasPorCiclo($fechaInicio: String!, $fechaFin: String!) {
    visitasPorCiclo(fechaInicio: $fechaInicio, fechaFin: $fechaFin) {
      id
      visitDate
      visitTime
      visitType
      visitStatus
      visitorUserIds
      additionalNotes
      seguimientoVisita
      tipoSeguimiento
      seguimientoFecha
      seguimientoHora
      seguimientoActividadBasica
      seguimientoActividadBasicaEspecificar
      seguimientoNinguno
      familia {
        id
        nombre
        telefono
        direccion
        barrio
      }
      creadoPor {
        id
        nombre
      }
      visitadores {
        id
        nombre
      }
    }
  }
`;

const FAMILIAS_QUERY = gql`
  query Familias {
    familias {
      id
      nombre
      telefono
      direccion
      barrio
    }
  }
`;

const MIEMBROS_QUERY = gql`
  query Miembros {
    miembros {
      id
      familiaId
      nombre
      apellidos
      tieneDevocional
      devocionalDia
      devocionalHora
      devocionalParticipantes
    }
  }
`;

const META_ACTIVA_QUERY = gql`
  query MetaActiva {
    metaActiva {
      id
      trimestre
      fechaInicio
      fechaFin
      metaNucleos
      metaVisitas
      metaPersonasVisitando
      metaDevocionales
      progreso {
        nucleosActuales
        nucleosPorcentaje
        visitasActuales
        visitasPorcentaje
        personasVisitandoActuales
        personasVisitandoPorcentaje
        devocionalesActuales
        devocionalesPorcentaje
      }
    }
  }
`;

interface Ciclo {
  label: string;
  fechaInicio: string;
  fechaFin: string;
  esActual: boolean;
}

interface VisitadorStats {
  userId: string;
  nombre: string;
  familiasVisitadas: Set<string>;
  totalVisitas: number;
  realizadas: number;
  programadas: number;
  canceladas: number;
  porcentaje: number;
}

interface VisitadorFrecuente {
  userId: string;
  nombre: string;
  count: number;
}

interface FamiliaStats {
  familiaId: string;
  nombre: string;
  telefono: string;
  direccion: string;
  barrio: string;
  totalVisitas: number;
  visitadores: Map<string, { nombre: string; count: number }>;
  visitadoresFrecuentes: VisitadorFrecuente[];
  ultimaVisita: { fecha: string; diasTranscurridos: number } | null;
  seguimiento: {
    tipo: 'visita_agendada' | 'visita_por_agendar' | 'actividad_basica' | 'ninguno';
    fecha?: string;
    hora?: string;
    especificacion?: string;
  } | null;
  notasUltimaVisita: string | null;
  estado: 'al_dia' | 'regular' | 'necesita_atencion' | 'urgente' | 'sin_visitas';
  visitasDetalle: any[];
  devocional: {
    anfitrion: string;
    dia: string;
    hora: string;
    participantes: number;
  } | null;
}

export function ReporteCicloPage() {
  // Generar ciclos (Oct-Ene, Ene-Abr, Abr-Jul, Jul-Oct)
  const generarCiclos = (): Ciclo[] => {
    const ciclos: Ciclo[] = [];
    const hoy = new Date();
    const añoActual = hoy.getFullYear();

    // Generar últimos 12 ciclos (3 años)
    for (let año = añoActual; año >= añoActual - 3; año--) {
      const periodos = [
        { inicio: `${año}-10-21`, fin: `${año + 1}-01-20`, label: `Oct ${año} - Ene ${año + 1}` },
        { inicio: `${año}-01-21`, fin: `${año}-04-20`, label: `Ene ${año} - Abr ${año}` },
        { inicio: `${año}-04-21`, fin: `${año}-07-20`, label: `Abr ${año} - Jul ${año}` },
        { inicio: `${año}-07-21`, fin: `${año}-10-20`, label: `Jul ${año} - Oct ${año}` },
      ];

      periodos.reverse().forEach(p => {
        const inicio = new Date(p.inicio);
        const fin = new Date(p.fin);
        const esActual = hoy >= inicio && hoy <= fin;

        ciclos.push({
          label: p.label,
          fechaInicio: p.inicio,
          fechaFin: p.fin,
          esActual,
        });
      });
    }

    return ciclos.slice(0, 12).reverse();
  };

  const ciclos = generarCiclos();
  const cicloActual = ciclos.find(c => c.esActual);

  const [cicloSeleccionado, setCicloSeleccionado] = useState<Ciclo>(cicloActual || ciclos[0]);
  const [modalFamiliaId, setModalFamiliaId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'visitas-desc' | 'visitas-asc' | 'ultima-antigua' | 'ultima-reciente'>('name');
  const [filterVisitas, setFilterVisitas] = useState<'all' | 'con-visitas' | 'sin-visitas' | 'pocas-visitas'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: visitasData, loading: visitasLoading } = useQuery(VISITAS_POR_CICLO_QUERY, {
    variables: {
      fechaInicio: cicloSeleccionado.fechaInicio,
      fechaFin: cicloSeleccionado.fechaFin,
    },
  });

  const { data: familiasData } = useQuery(FAMILIAS_QUERY);
  const { data: metaActivaData } = useQuery(META_ACTIVA_QUERY);
  const { data: miembrosData } = useQuery(MIEMBROS_QUERY);

  const visitas = visitasData?.visitasPorCiclo || [];
  const todasFamilias = familiasData?.familias || [];
  const metaActiva = metaActivaData?.metaActiva;
  const miembros = miembrosData?.miembros || [];

  // Análisis de Visitadores
  const visitadoresStats = useMemo(() => {
    const visitadoresMap = new Map<string, VisitadorStats>();

    visitas.forEach((visita: any) => {
      if (visita.visitorUserIds) {
        visita.visitorUserIds.forEach((userId: string) => {
          if (!visitadoresMap.has(userId)) {
            // Buscar el nombre del visitador en el array de visitadores
            const visitadorNombre = visita.visitadores?.find((v: any) => v.id === userId)?.nombre
              || visita.creadoPor?.nombre
              || 'Desconocido';

            visitadoresMap.set(userId, {
              userId,
              nombre: visitadorNombre,
              familiasVisitadas: new Set(),
              totalVisitas: 0,
              realizadas: 0,
              programadas: 0,
              canceladas: 0,
              porcentaje: 0,
            });
          }

          const stats = visitadoresMap.get(userId)!;
          stats.familiasVisitadas.add(visita.familia.id);
          stats.totalVisitas++;

          if (visita.visitStatus === 'realizada') stats.realizadas++;
          else if (visita.visitStatus === 'programada') stats.programadas++;
          else if (visita.visitStatus === 'cancelada') stats.canceladas++;
        });
      }
    });

    const totalVisitas = visitas.length;
    const statsArray = Array.from(visitadoresMap.values());

    statsArray.forEach(stats => {
      stats.porcentaje = totalVisitas > 0 ? (stats.totalVisitas / totalVisitas) * 100 : 0;
    });

    return statsArray.sort((a, b) => b.totalVisitas - a.totalVisitas);
  }, [visitas]);

  // Análisis de Familias
  const familiasStats = useMemo(() => {
    const familiasMap = new Map<string, FamiliaStats>();

    // Inicializar con todas las familias
    todasFamilias.forEach((familia: any) => {
      // Buscar si la familia tiene un miembro con devocional
      const miembroConDevocional = miembros.find(
        (m: any) => m.familiaId === familia.id && m.tieneDevocional
      );

      familiasMap.set(familia.id, {
        familiaId: familia.id,
        nombre: familia.nombre,
        telefono: familia.telefono || '',
        direccion: familia.direccion || '',
        barrio: familia.barrio || '',
        totalVisitas: 0,
        visitadores: new Map(),
        visitadoresFrecuentes: [],
        ultimaVisita: null,
        seguimiento: null,
        notasUltimaVisita: null,
        estado: 'sin_visitas',
        visitasDetalle: [],
        devocional: miembroConDevocional ? {
          anfitrion: `${miembroConDevocional.nombre} ${miembroConDevocional.apellidos || ''}`.trim(),
          dia: miembroConDevocional.devocionalDia || 'Sin día',
          hora: miembroConDevocional.devocionalHora || 'Sin hora',
          participantes: miembroConDevocional.devocionalParticipantes || 0,
        } : null,
      });
    });

    // Procesar visitas
    const visitasRealizadas = visitas
      .filter((v: any) => v.visitStatus === 'realizada')
      .sort((a: any, b: any) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());

    visitasRealizadas.forEach((visita: any) => {
      const stats = familiasMap.get(visita.familia.id);
      if (!stats) return;

      stats.totalVisitas++;
      stats.visitasDetalle.push(visita);

      // Visitadores - Usar el array de visitadores para obtener nombres
      if (visita.visitadores && visita.visitadores.length > 0) {
        visita.visitadores.forEach((visitador: any) => {
          const existing = stats.visitadores.get(visitador.id);
          if (existing) {
            existing.count++;
          } else {
            stats.visitadores.set(visitador.id, {
              nombre: visitador.nombre,
              count: 1,
            });
          }
        });
      }

      // Última visita
      if (!stats.ultimaVisita) {
        const diasTranscurridos = differenceInDays(new Date(), new Date(visita.visitDate));
        stats.ultimaVisita = {
          fecha: visita.visitDate,
          diasTranscurridos,
        };
        stats.notasUltimaVisita = visita.additionalNotes || null;

        // Calcular estado
        if (diasTranscurridos <= 7) {
          stats.estado = 'al_dia';
        } else if (diasTranscurridos <= 14) {
          stats.estado = 'regular';
        } else if (diasTranscurridos <= 30) {
          stats.estado = 'necesita_atencion';
        } else {
          stats.estado = 'urgente';
        }

        // Procesar seguimiento de la última visita
        if (visita.seguimientoVisita) {
          if (visita.tipoSeguimiento === 'agendado' && visita.seguimientoFecha) {
            stats.seguimiento = {
              tipo: 'visita_agendada',
              fecha: visita.seguimientoFecha,
              hora: visita.seguimientoHora || '',
            };
          } else if (visita.tipoSeguimiento === 'por_agendar') {
            stats.seguimiento = {
              tipo: 'visita_por_agendar',
            };
          }
        } else if (visita.seguimientoActividadBasica) {
          stats.seguimiento = {
            tipo: 'actividad_basica',
            especificacion: visita.seguimientoActividadBasicaEspecificar || 'Actividad básica',
          };
        } else if (visita.seguimientoNinguno) {
          stats.seguimiento = {
            tipo: 'ninguno',
          };
        }
      }
    });

    // Generar top de visitadores frecuentes para cada familia
    familiasMap.forEach((familia) => {
      const visitadoresArray = Array.from(familia.visitadores.entries()).map(([userId, data]) => ({
        userId,
        nombre: data.nombre,
        count: data.count,
      }));

      // Ordenar por cantidad de visitas y tomar los top 3
      familia.visitadoresFrecuentes = visitadoresArray
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
    });

    return Array.from(familiasMap.values());
  }, [visitas, todasFamilias, miembros]);

  // Aplicar filtros y ordenamiento
  const familiasFiltradas = useMemo(() => {
    let filtered = [...familiasStats];

    // Aplicar filtros
    if (filterVisitas === 'con-visitas') {
      filtered = filtered.filter(f => f.totalVisitas > 0);
    } else if (filterVisitas === 'sin-visitas') {
      filtered = filtered.filter(f => f.totalVisitas === 0);
    } else if (filterVisitas === 'pocas-visitas') {
      filtered = filtered.filter(f => f.totalVisitas <= 2);
    }

    // Aplicar ordenamiento
    if (sortBy === 'name') {
      filtered.sort((a, b) => a.nombre.localeCompare(b.nombre));
    } else if (sortBy === 'visitas-desc') {
      filtered.sort((a, b) => b.totalVisitas - a.totalVisitas);
    } else if (sortBy === 'visitas-asc') {
      filtered.sort((a, b) => a.totalVisitas - b.totalVisitas);
    } else if (sortBy === 'ultima-antigua') {
      filtered.sort((a, b) => {
        if (!a.ultimaVisita && !b.ultimaVisita) return 0;
        if (!a.ultimaVisita) return 1;
        if (!b.ultimaVisita) return -1;
        return new Date(a.ultimaVisita.fecha).getTime() - new Date(b.ultimaVisita.fecha).getTime();
      });
    } else if (sortBy === 'ultima-reciente') {
      filtered.sort((a, b) => {
        if (!a.ultimaVisita && !b.ultimaVisita) return 0;
        if (!a.ultimaVisita) return 1;
        if (!b.ultimaVisita) return -1;
        return new Date(b.ultimaVisita.fecha).getTime() - new Date(a.ultimaVisita.fecha).getTime();
      });
    }

    return filtered;
  }, [familiasStats, filterVisitas, sortBy]);

  // Análisis de Devocionales
  const devocionalesStats = useMemo(() => {
    const familiasConDevocional = familiasStats.filter(f => f.devocional !== null);
    const totalFamilias = familiasStats.length;
    const porcentajeFamilias = totalFamilias > 0 ? (familiasConDevocional.length / totalFamilias) * 100 : 0;

    const totalParticipantes = familiasConDevocional.reduce(
      (sum, f) => sum + (f.devocional?.participantes || 0),
      0
    );

    // Agrupar por día
    const porDia: Record<string, number> = {};
    familiasConDevocional.forEach(f => {
      const dia = f.devocional?.dia || 'Sin día';
      porDia[dia] = (porDia[dia] || 0) + 1;
    });

    return {
      totalDevocionales: familiasConDevocional.length,
      porcentajeFamilias,
      totalParticipantes,
      promedioParticipantes: familiasConDevocional.length > 0
        ? totalParticipantes / familiasConDevocional.length
        : 0,
      porDia,
    };
  }, [familiasStats]);

  const topVisitadores = visitadoresStats.slice(0, 5);

  // Paginación
  const totalPages = Math.ceil(familiasFiltradas.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const familiasPaginadas = familiasFiltradas.slice(startIndex, endIndex);

  // Resetear página cuando cambian filtros
  useMemo(() => {
    setCurrentPage(1);
  }, [filterVisitas, sortBy]);

  const getEstadoColor = (estado: string) => {
    const colors: Record<string, string> = {
      al_dia: 'bg-green-100 text-green-800 border-green-300',
      regular: 'bg-blue-100 text-blue-800 border-blue-300',
      necesita_atencion: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      urgente: 'bg-red-100 text-red-800 border-red-300',
      sin_visitas: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return colors[estado] || colors.sin_visitas;
  };

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      al_dia: 'Al día',
      regular: 'Regular',
      necesita_atencion: 'Necesita atención',
      urgente: 'Urgente',
      sin_visitas: 'Sin visitas',
    };
    return labels[estado] || 'Sin visitas';
  };

  const getVisitasColor = (total: number) => {
    if (total === 0) return 'text-red-600 font-bold';
    if (total <= 2) return 'text-yellow-600 font-bold';
    return 'text-green-600 font-bold';
  };

  const getProgressColor = (porcentaje: number) => {
    if (porcentaje >= 80) return 'bg-green-500';
    if (porcentaje >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const familiaModal = familiasStats.find(f => f.familiaId === modalFamiliaId);

  const exportToCSV = () => {
    const headers = ['Familia', 'Teléfono', 'Dirección', 'Barrio', 'Total Visitas', 'Última Visita', 'Días Transcurridos', 'Estado'];
    const rows = familiasStats.map(f => [
      f.nombre,
      f.telefono,
      f.direccion,
      f.barrio,
      f.totalVisitas,
      f.ultimaVisita?.fecha || '-',
      f.ultimaVisita?.diasTranscurridos || '-',
      getEstadoLabel(f.estado),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-ciclo-${cicloSeleccionado.label}.csv`;
    a.click();
  };

  if (visitasLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="mt-2 text-gray-600">Cargando reporte...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header con Selector de Ciclo */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reporte de Ciclo</h1>
            <p className="text-gray-600 mt-2">
              Análisis completo de visitas, visitadores y familias por período
            </p>
          </div>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Exportar Tabla
          </button>
        </div>

        {/* Controles de Filtrado y Ordenamiento */}
        <div className="card p-4 flex flex-wrap gap-4 items-center">
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Ciclo:</label>
            <select
              value={cicloSeleccionado.label}
              onChange={(e) => {
                const ciclo = ciclos.find(c => c.label === e.target.value);
                if (ciclo) setCicloSeleccionado(ciclo);
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {ciclos.map(ciclo => (
                <option key={ciclo.label} value={ciclo.label}>
                  {ciclo.label} {ciclo.esActual ? '(Actual)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Ordenar por:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="name">Nombre (A-Z)</option>
              <option value="visitas-desc">Más visitas primero</option>
              <option value="visitas-asc">Menos visitas primero</option>
              <option value="ultima-antigua">Visita más antigua primero</option>
              <option value="ultima-reciente">Visita más reciente primero</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Filtrar por visitas:</label>
            <select
              value={filterVisitas}
              onChange={(e) => setFilterVisitas(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">Todas las familias</option>
              <option value="con-visitas">Solo con visitas</option>
              <option value="sin-visitas">Sin visitas</option>
              <option value="pocas-visitas">Pocas visitas (≤2)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Panel de Seguimiento de Metas */}
      {metaActiva && metaActiva.progreso && (
        <div className="card mb-6 border-2 border-green-400 bg-green-50">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Seguimiento de Meta Activa - {metaActiva.trimestre}
          </h2>

          <div className="grid md:grid-cols-4 gap-4">
            {/* Núcleos */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Núcleos Activos</div>
              <div className="text-2xl font-bold mb-2">
                {metaActiva.progreso.nucleosActuales} / {metaActiva.metaNucleos}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getProgressColor(metaActiva.progreso.nucleosPorcentaje)}`}
                  style={{ width: `${Math.min(metaActiva.progreso.nucleosPorcentaje, 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-600 mt-1">{metaActiva.progreso.nucleosPorcentaje.toFixed(1)}%</div>
            </div>

            {/* Visitas */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Visitas Realizadas</div>
              <div className="text-2xl font-bold mb-2">
                {metaActiva.progreso.visitasActuales} / {metaActiva.metaVisitas}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getProgressColor(metaActiva.progreso.visitasPorcentaje)}`}
                  style={{ width: `${Math.min(metaActiva.progreso.visitasPorcentaje, 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-600 mt-1">{metaActiva.progreso.visitasPorcentaje.toFixed(1)}%</div>
            </div>

            {/* Personas Visitando */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Personas Visitando</div>
              <div className="text-2xl font-bold mb-2">
                {metaActiva.progreso.personasVisitandoActuales} / {metaActiva.metaPersonasVisitando}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getProgressColor(metaActiva.progreso.personasVisitandoPorcentaje)}`}
                  style={{ width: `${Math.min(metaActiva.progreso.personasVisitandoPorcentaje, 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-600 mt-1">{metaActiva.progreso.personasVisitandoPorcentaje.toFixed(1)}%</div>
            </div>

            {/* Devocionales */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Devocionales Activos</div>
              <div className="text-2xl font-bold mb-2">
                {metaActiva.progreso.devocionalesActuales} / {metaActiva.metaDevocionales}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getProgressColor(metaActiva.progreso.devocionalesPorcentaje)}`}
                  style={{ width: `${Math.min(metaActiva.progreso.devocionalesPorcentaje, 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-600 mt-1">{metaActiva.progreso.devocionalesPorcentaje.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Análisis de Visitadores del Ciclo */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-600" />
            Análisis de Visitadores del Ciclo
          </h2>
          <div className="text-sm text-gray-600">
            Total: <span className="font-semibold text-gray-900">{visitas.length}</span> visitas
          </div>
        </div>

        {topVisitadores.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No hay visitadores en este ciclo</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topVisitadores.map((visitador, idx) => (
              <div
                key={visitador.userId}
                className="relative bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
              >
                {/* Ranking Badge */}
                <div className="absolute -top-3 -left-3 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                  #{idx + 1}
                </div>

                {/* Nombre del Visitador */}
                <div className="mt-2 mb-3">
                  <h3 className="font-semibold text-gray-900 text-lg">{visitador.nombre}</h3>
                </div>

                {/* Estadísticas */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Home className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">{visitador.familiasVisitadas.size}</span>
                    <span className="text-gray-500">familias</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Calendar className="w-4 h-4 text-green-600" />
                    <span className="font-medium">{visitador.totalVisitas}</span>
                    <span className="text-gray-500">visitas</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Award className="w-4 h-4 text-yellow-600" />
                    <span className="font-medium">{visitador.porcentaje.toFixed(1)}%</span>
                    <span className="text-gray-500">del total</span>
                  </div>
                </div>

                {/* Barra de Progreso con Subdivisión */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-gray-300 to-gray-400 relative"
                      style={{ width: `${Math.min(visitador.porcentaje, 100)}%` }}
                    >
                      {/* Barra interna de visitas realizadas */}
                      <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-green-600"
                        style={{
                          width: `${visitador.totalVisitas > 0 ? (visitador.realizadas / visitador.totalVisitas) * 100 : 0}%`
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span className="text-green-600 font-medium">
                      {visitador.realizadas} realizadas
                    </span>
                    {visitador.programadas > 0 && (
                      <span className="text-blue-600">
                        {visitador.programadas} programadas
                      </span>
                    )}
                    {visitador.canceladas > 0 && (
                      <span className="text-red-600">
                        {visitador.canceladas} canceladas
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Análisis de Reuniones Devocionales */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
            </svg>
            Análisis de Reuniones Devocionales
          </h2>
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-purple-700">{devocionalesStats.totalDevocionales}</span> de{' '}
            <span className="font-semibold text-gray-900">{familiasStats.length}</span> familias{' '}
            <span className="text-purple-600">({devocionalesStats.porcentajeFamilias.toFixed(1)}%)</span>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="text-sm text-gray-600 mb-1">Total Devocionales</div>
            <div className="text-3xl font-bold text-purple-700">{devocionalesStats.totalDevocionales}</div>
            <div className="text-xs text-gray-500 mt-1">
              {devocionalesStats.porcentajeFamilias.toFixed(1)}% de familias
            </div>
          </div>

          <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
            <div className="text-sm text-gray-600 mb-1">Total Participantes</div>
            <div className="text-3xl font-bold text-indigo-700">{devocionalesStats.totalParticipantes}</div>
            <div className="text-xs text-gray-500 mt-1">En todos los devocionales</div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-sm text-gray-600 mb-1">Promedio Participantes</div>
            <div className="text-3xl font-bold text-blue-700">
              {devocionalesStats.promedioParticipantes.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Por devocional</div>
          </div>

          <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
            <div className="text-sm text-gray-600 mb-2">Distribución por Día</div>
            <div className="space-y-1">
              {Object.entries(devocionalesStats.porDia)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([dia, count]) => (
                  <div key={dia} className="flex justify-between text-xs">
                    <span className="text-gray-700">{dia}</span>
                    <span className="font-semibold text-teal-700">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla Principal de Familias */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Familias del Ciclo ({familiasFiltradas.length} {familiasFiltradas.length === 1 ? 'familia' : 'familias'})
        </h2>

        {familiasFiltradas.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No hay familias que coincidan con los filtros seleccionados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Familia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Devocional
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visitas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visitadores Frecuentes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Última Visita
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seguimiento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {familiasPaginadas.map((familia) => (
                  <tr key={familia.familiaId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{familia.nombre}</div>
                      <div className="text-xs text-gray-500">{familia.telefono}</div>
                      <div className="text-xs text-gray-500">{familia.direccion}</div>
                      <div className="text-xs text-gray-500">{familia.barrio}</div>
                    </td>
                    <td className="px-6 py-4">
                      {familia.devocional ? (
                        <div className="text-sm">
                          <div className="font-medium text-green-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                            </svg>
                            {familia.devocional.anfitrion}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {familia.devocional.dia} - {familia.devocional.hora}
                          </div>
                          <div className="text-xs text-gray-500">
                            {familia.devocional.participantes} participantes
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Sin devocional</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-2xl ${getVisitasColor(familia.totalVisitas)}`}>
                        {familia.totalVisitas}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {familia.visitadoresFrecuentes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {familia.visitadoresFrecuentes.map((v) => (
                            <span
                              key={v.userId}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {v.nombre} ({v.count})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {familia.ultimaVisita ? (
                        <div>
                          <div>{format(new Date(familia.ultimaVisita.fecha), 'dd MMM yyyy', { locale: es })}</div>
                          <div className="text-xs text-gray-500">
                            hace {familia.ultimaVisita.diasTranscurridos} días
                          </div>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {familia.seguimiento ? (
                        <div>
                          {familia.seguimiento.tipo === 'visita_agendada' && (
                            <div className="text-sm">
                              <div className="font-medium text-blue-700">Visita agendada</div>
                              <div className="text-xs text-gray-600">
                                {format(new Date(familia.seguimiento.fecha!), 'dd MMM yyyy', { locale: es })}
                                {familia.seguimiento.hora && ` - ${familia.seguimiento.hora}`}
                              </div>
                            </div>
                          )}
                          {familia.seguimiento.tipo === 'visita_por_agendar' && (
                            <span className="text-sm text-orange-600 font-medium">Visita por agendar</span>
                          )}
                          {familia.seguimiento.tipo === 'actividad_basica' && (
                            <div className="text-sm">
                              <div className="font-medium text-purple-700">Actividad básica</div>
                              {familia.seguimiento.especificacion && (
                                <div className="text-xs text-gray-600">{familia.seguimiento.especificacion}</div>
                              )}
                            </div>
                          )}
                          {familia.seguimiento.tipo === 'ninguno' && (
                            <span className="text-sm text-gray-400">Sin seguimiento</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {familia.notasUltimaVisita ? (
                        <div className="truncate max-w-xs">{familia.notasUltimaVisita}</div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getEstadoColor(familia.estado)}`}>
                        {getEstadoLabel(familia.estado)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setModalFamiliaId(familia.familiaId)}
                        className="text-primary-600 hover:text-primary-800"
                      >
                        Ver Detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Controles de Paginación */}
        {familiasFiltradas.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 pt-4">
            {/* Info de registros */}
            <div className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{startIndex + 1}</span> -
              <span className="font-medium">{Math.min(endIndex, familiasFiltradas.length)}</span> de
              <span className="font-medium"> {familiasFiltradas.length}</span> familias
            </div>

            {/* Controles de navegación */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Anterior
              </button>

              {/* Números de página */}
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 border rounded-lg text-sm font-medium ${
                        currentPage === pageNum
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente →
              </button>
            </div>

            {/* Selector de tamaño de página */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Por página:</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Detalles de Familia */}
      {familiaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header Mejorado */}
            <div className="px-6 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">
                    {familiaModal.nombre}
                  </h2>
                  <div className="flex flex-wrap gap-4 text-sm opacity-90">
                    {familiaModal.telefono && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {familiaModal.telefono}
                      </div>
                    )}
                    {familiaModal.direccion && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {familiaModal.direccion}
                      </div>
                    )}
                    {familiaModal.barrio && (
                      <div className="flex items-center gap-1">
                        <Home className="w-4 h-4" />
                        {familiaModal.barrio}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setModalFamiliaId(null)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Estadísticas Rápidas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-xs opacity-90">Total Visitas</div>
                  <div className="text-2xl font-bold">{familiaModal.totalVisitas}</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-xs opacity-90">Visitadores</div>
                  <div className="text-2xl font-bold">{familiaModal.visitadoresFrecuentes.length}</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-xs opacity-90">Estado</div>
                  <div className="text-sm font-semibold mt-1">{getEstadoLabel(familiaModal.estado)}</div>
                </div>
                {familiaModal.ultimaVisita && (
                  <div className="bg-white bg-opacity-20 rounded-lg p-3">
                    <div className="text-xs opacity-90">Última Visita</div>
                    <div className="text-sm font-semibold mt-1">
                      Hace {familiaModal.ultimaVisita.diasTranscurridos} días
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {familiaModal.visitasDetalle.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-600 text-lg">No hay visitas registradas en este ciclo</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Timeline de Visitas */}
                  <div className="relative">
                    {familiaModal.visitasDetalle.map((visita: any, index: number) => {
                      const getStatusBadge = (status: string) => {
                        if (status === 'realizada') {
                          return {
                            icon: <CheckCircle className="w-5 h-5" />,
                            className: 'bg-green-100 text-green-700 border-green-300',
                            label: 'Realizada'
                          };
                        } else if (status === 'programada') {
                          return {
                            icon: <Clock className="w-5 h-5" />,
                            className: 'bg-blue-100 text-blue-700 border-blue-300',
                            label: 'Programada'
                          };
                        } else if (status === 'cancelada') {
                          return {
                            icon: <XCircle className="w-5 h-5" />,
                            className: 'bg-red-100 text-red-700 border-red-300',
                            label: 'Cancelada'
                          };
                        }
                        return {
                          icon: <AlertCircle className="w-5 h-5" />,
                          className: 'bg-gray-100 text-gray-700 border-gray-300',
                          label: status
                        };
                      };

                      const statusBadge = getStatusBadge(visita.visitStatus);

                      return (
                        <div key={visita.id} className="relative pl-8 pb-6 last:pb-0">
                          {/* Timeline Line */}
                          {index < familiaModal.visitasDetalle.length - 1 && (
                            <div className="absolute left-2.5 top-6 bottom-0 w-0.5 bg-gray-200"></div>
                          )}

                          {/* Timeline Dot */}
                          <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            visita.visitStatus === 'realizada' ? 'bg-green-500 border-green-600' :
                            visita.visitStatus === 'programada' ? 'bg-blue-500 border-blue-600' :
                            visita.visitStatus === 'cancelada' ? 'bg-red-500 border-red-600' :
                            'bg-gray-400 border-gray-500'
                          }`}>
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>

                          {/* Visita Card */}
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            {/* Header de la Visita */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Calendar className="w-4 h-4 text-gray-600" />
                                  <span className="font-semibold text-gray-900">
                                    {format(new Date(visita.visitDate), 'EEEE, dd MMMM yyyy', { locale: es })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Clock className="w-4 h-4" />
                                  <span>{visita.visitTime}</span>
                                  <span className="mx-2">•</span>
                                  <span className="capitalize">{visita.visitType}</span>
                                </div>
                              </div>
                              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border font-medium text-sm ${statusBadge.className}`}>
                                {statusBadge.icon}
                                {statusBadge.label}
                              </div>
                            </div>

                            {/* Visitadores */}
                            {visita.visitadores && visita.visitadores.length > 0 && (
                              <div className="mb-3 pb-3 border-b border-gray-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <Users className="w-4 h-4 text-gray-600" />
                                  <span className="text-sm font-medium text-gray-700">Visitadores:</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {visita.visitadores.map((visitador: any) => (
                                    <span
                                      key={visitador.id}
                                      className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                                    >
                                      <User className="w-3 h-3" />
                                      {visitador.nombre}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Seguimiento */}
                            {visita.seguimientoVisita && (
                              <div className="mb-3 pb-3 border-b border-gray-200">
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                                  <div>
                                    <span className="text-sm font-medium text-gray-700">Seguimiento: </span>
                                    {visita.tipoSeguimiento === 'agendado' && visita.seguimientoFecha && (
                                      <span className="text-sm text-blue-700">
                                        Visita agendada para {format(new Date(visita.seguimientoFecha), 'dd MMM yyyy', { locale: es })}
                                        {visita.seguimientoHora && ` a las ${visita.seguimientoHora}`}
                                      </span>
                                    )}
                                    {visita.tipoSeguimiento === 'por_agendar' && (
                                      <span className="text-sm text-orange-700">Visita por agendar</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {visita.seguimientoActividadBasica && (
                              <div className="mb-3 pb-3 border-b border-gray-200">
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="w-4 h-4 text-purple-600 mt-0.5" />
                                  <div>
                                    <span className="text-sm font-medium text-gray-700">Actividad Básica: </span>
                                    <span className="text-sm text-purple-700">
                                      {visita.seguimientoActividadBasicaEspecificar || 'Actividad básica programada'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Notas */}
                            {visita.additionalNotes && (
                              <div className="bg-white rounded-md p-3">
                                <div className="flex items-start gap-2">
                                  <FileText className="w-4 h-4 text-gray-600 mt-0.5" />
                                  <div className="flex-1">
                                    <div className="text-xs font-medium text-gray-700 mb-1">Notas:</div>
                                    <div className="text-sm text-gray-900 whitespace-pre-wrap">{visita.additionalNotes}</div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Total de {familiaModal.visitasDetalle.length} {familiaModal.visitasDetalle.length === 1 ? 'visita' : 'visitas'} en este ciclo
              </div>
              <button
                onClick={() => setModalFamiliaId(null)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
