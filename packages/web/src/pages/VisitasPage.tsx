import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { VisitaWizard } from '../components/VisitaWizard';
import { Lightbulb } from 'lucide-react';
import { VisitaDetallesModal } from '../components/VisitaDetallesModal';

// Helper para formatear fechas de forma segura
const formatDate = (dateInput: string | number | null | undefined): string => {
  if (!dateInput) return '-';

  try {
    let date: Date;

    // Si es un número, usarlo directamente
    if (typeof dateInput === 'number') {
      date = new Date(dateInput);
    }
    // Si es un string que parece un timestamp numérico, parsearlo
    else if (typeof dateInput === 'string' && /^\d+$/.test(dateInput)) {
      date = new Date(parseInt(dateInput, 10));
    }
    // Si es un string ISO, parsearlo normalmente
    else {
      date = new Date(dateInput);
    }

    if (isNaN(date.getTime())) return '-';

    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'America/Mexico_City'
    });
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return '-';
  }
};

const VISITAS_QUERY = gql`
  query Visitas {
    visitas {
      id
      visitDate
      visitTime
      visitType
      visitStatus
      familia {
        id
        nombre
      }
      barrio {
        id
        nombre
      }
      barrioOtro
      nucleo {
        id
        nombre
      }
      visitadores {
        id
        nombre
      }
      visitActivities {
        conversacion_preocupaciones
        oraciones
        estudio_instituto
        otro_estudio
        invitacion_actividad
      }
      materialDejado {
        libro_oraciones
        otro
      }
      seguimientoVisita
      tipoSeguimiento
      seguimientoFecha
      additionalNotes
      motivoNoVisita
      motivoNoVisitaOtra
      creadoPor {
        nombre
      }
      createdAt
    }
  }
`;

const DELETE_VISITA = gql`
  mutation DeleteVisita($id: ID!) {
    deleteVisita(id: $id)
  }
`;

const TIPO_LABELS: Record<string, string> = {
  primera_visita: 'Primera Visita',
  visita_seguimiento: 'Seguimiento',
  no_se_pudo_realizar: 'No Realizada',
};

const TIPO_COLORS: Record<string, string> = {
  primera_visita: 'bg-blue-100 text-blue-800',
  visita_seguimiento: 'bg-green-100 text-green-800',
  no_se_pudo_realizar: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
  programada: 'Programada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
};

const STATUS_COLORS: Record<string, string> = {
  programada: 'bg-yellow-100 text-yellow-800',
  realizada: 'bg-green-100 text-green-800',
  cancelada: 'bg-gray-100 text-gray-800',
};

// Helper para resumir actividades
const resumirActividades = (actividades: any): string => {
  if (!actividades) return '-';

  const items = [];
  if (actividades.conversacion_preocupaciones) items.push('Conversación');
  if (actividades.oraciones) items.push('Oraciones');
  if (actividades.estudio_instituto) items.push('Estudio Instituto');
  if (actividades.otro_estudio) items.push('Otro Estudio');
  if (actividades.invitacion_actividad) items.push('Invitación');

  return items.length > 0 ? items.join(', ') : '-';
};

// Helper para resumir materiales
const resumirMateriales = (materiales: any): string => {
  if (!materiales) return '-';

  const items = [];
  if (materiales.libro_oraciones) items.push('Libro de Oraciones');
  if (materiales.otro) items.push('Otro');

  return items.length > 0 ? items.join(', ') : '-';
};

export function VisitasPage() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedVisita, setSelectedVisita] = useState<any | null>(null);
  const [editingVisita, setEditingVisita] = useState<any | null>(null);
  const { data, loading, error, refetch } = useQuery(VISITAS_QUERY);
  const [deleteVisita] = useMutation(DELETE_VISITA, {
    refetchQueries: [{ query: VISITAS_QUERY }],
  });

  // Filtros y ordenamiento
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterFamilia, setFilterFamilia] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('fecha-desc');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const handleEditar = (visita: any) => {
    setEditingVisita(visita);
    setWizardOpen(true);
  };

  const handleDuplicar = (visita: any) => {
    // Crear una copia de la visita pero sin ID, fecha, hora, y notas
    const visitaDuplicada = {
      ...visita,
      id: undefined, // Sin ID para que se cree como nueva
      visitDate: new Date().toISOString().split('T')[0], // Fecha de hoy
      visitTime: '18:00', // Hora por defecto
      visitStatus: undefined, // Se calculará automáticamente
      additionalNotes: '', // Limpiar notas
      createdAt: undefined,
      updatedAt: undefined,
    };
    setEditingVisita(visitaDuplicada);
    setWizardOpen(true);
  };

  const handleEliminar = async (visitaId: string, familiaNombre: string) => {
    if (confirm(`¿Eliminar la visita a "${familiaNombre}"?`)) {
      try {
        await deleteVisita({
          variables: { id: visitaId },
        });
      } catch (error) {
        console.error('Error deleting visita:', error);
        alert('Error al eliminar la visita');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Cargando visitas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error al cargar visitas: {error.message}</p>
      </div>
    );
  }

  let visitas = data?.visitas || [];

  // Aplicar filtros
  if (filterType) {
    visitas = visitas.filter((v: any) => v.visitType === filterType);
  }
  if (filterStatus) {
    visitas = visitas.filter((v: any) => v.visitStatus === filterStatus);
  }
  if (filterFamilia) {
    visitas = visitas.filter((v: any) =>
      v.familia.nombre.toLowerCase().includes(filterFamilia.toLowerCase())
    );
  }

  // Aplicar ordenamiento
  if (sortBy === 'fecha-desc') {
    visitas = [...visitas].sort((a: any, b: any) =>
      new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
    );
  } else if (sortBy === 'fecha-asc') {
    visitas = [...visitas].sort((a: any, b: any) =>
      new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime()
    );
  } else if (sortBy === 'familia') {
    visitas = [...visitas].sort((a: any, b: any) =>
      a.familia.nombre.localeCompare(b.familia.nombre)
    );
  } else if (sortBy === 'tipo') {
    visitas = [...visitas].sort((a: any, b: any) =>
      a.visitType.localeCompare(b.visitType)
    );
  }

  // Aplicar paginación
  const totalVisitas = visitas.length;
  const totalPages = Math.ceil(totalVisitas / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalVisitas);
  const visitasPaginadas = visitas.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Visitas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestión y seguimiento de visitas a familias
          </p>
        </div>
        <button onClick={() => setWizardOpen(true)} className="btn btn-primary">
          + Nueva Visita
        </button>
      </div>

      <VisitaWizard
        isOpen={wizardOpen}
        onClose={() => {
          setWizardOpen(false);
          setEditingVisita(null);
        }}
        onSuccess={() => {
          refetch();
          setWizardOpen(false);
          setEditingVisita(null);
        }}
        initialData={editingVisita}
        visitaId={editingVisita?.id}
      />

      {/* Stats y Controles */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          {/* Stats */}
          <div className="flex gap-6">
            <div className="text-sm text-gray-600">
              Total de visitas: <span className="font-semibold text-gray-900">{data?.visitas.length || 0}</span>
            </div>
          </div>

          {/* Ordenamiento */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Ordenar por:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="select select-sm select-bordered"
            >
              <option value="fecha-desc">Fecha (más reciente)</option>
              <option value="fecha-asc">Fecha (más antigua)</option>
              <option value="familia">Familia (A-Z)</option>
              <option value="tipo">Tipo de Visita</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Estatus</label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="input input-sm w-full"
            >
              <option value="">Todas</option>
              <option value="realizada">Realizadas</option>
              <option value="programada">Programadas</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Tipo</label>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="input input-sm w-full"
            >
              <option value="">Todas</option>
              <option value="primera_visita">Primera Visita</option>
              <option value="visita_seguimiento">Seguimiento</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Buscar Familia</label>
            <input
              type="text"
              value={filterFamilia}
              onChange={(e) => {
                setFilterFamilia(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Nombre de familia..."
              className="input input-sm w-full"
            />
          </div>
        </div>
        {(filterType || filterStatus || filterFamilia) && (
          <div className="mt-3">
            <button
              onClick={() => {
                setFilterType('');
                setFilterStatus('');
                setFilterFamilia('');
                setCurrentPage(1);
              }}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '100px' }}>
                  Fecha
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '70px' }}>
                  Hora
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '100px' }}>
                  Estatus
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '100px' }}>
                  Tipo
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '150px' }}>
                  Familia
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px' }}>
                  Barrio
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '100px' }}>
                  Núcleo
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '150px' }}>
                  Visitadores
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '180px' }}>
                  Actividades
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px' }}>
                  Material
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '150px' }}>
                  Seguimiento
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px' }}>
                  Motivo No Realizada
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '150px' }}>
                  Notas
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50" style={{ minWidth: '110px' }}>
                  Fecha Creación
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '200px' }}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {visitasPaginadas.length === 0 ? (
                <tr>
                  <td colSpan={15} className="px-4 py-8 text-center text-gray-500">
                    No hay visitas que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                visitasPaginadas.map((visita: any) => (
                  <tr key={visita.id} className="hover:bg-gray-50">
                    {/* Fecha */}
                    <td className="px-3 py-2 text-sm font-medium text-gray-900">
                      {format(new Date(visita.visitDate), 'dd/MM/yy', { locale: es })}
                    </td>

                    {/* Hora */}
                    <td className="px-3 py-2 text-sm text-gray-700">
                      {visita.visitTime}
                    </td>

                    {/* Estatus */}
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          STATUS_COLORS[visita.visitStatus] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {STATUS_LABELS[visita.visitStatus] || visita.visitStatus}
                      </span>
                    </td>

                    {/* Tipo */}
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          TIPO_COLORS[visita.visitType] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {TIPO_LABELS[visita.visitType] || visita.visitType}
                      </span>
                    </td>

                    {/* Familia */}
                    <td className="px-3 py-2 text-sm font-medium text-gray-900">
                      {visita.familia.nombre}
                    </td>

                    {/* Barrio */}
                    <td className="px-3 py-2 text-sm text-gray-700">
                      {visita.barrio?.nombre || visita.barrioOtro || '-'}
                    </td>

                    {/* Núcleo */}
                    <td className="px-3 py-2 text-sm text-gray-700">
                      {visita.nucleo?.nombre || '-'}
                    </td>

                    {/* Visitadores */}
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {visita.visitadores && visita.visitadores.length > 0 ? (
                          visita.visitadores.map((visitador: any) => (
                            <span key={visitador.id} className="px-2 py-0.5 inline-flex text-xs font-medium rounded-full bg-primary-100 text-primary-800">
                              {visitador.nombre}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">-</span>
                        )}
                      </div>
                    </td>

                    {/* Actividades */}
                    <td className="px-3 py-2 text-xs text-gray-600">
                      {resumirActividades(visita.visitActivities)}
                    </td>

                    {/* Material */}
                    <td className="px-3 py-2 text-xs text-gray-600">
                      {resumirMateriales(visita.materialDejado)}
                    </td>

                    {/* Seguimiento */}
                    <td className="px-3 py-2 text-xs text-gray-600">
                      {visita.seguimientoVisita ? (
                        <div>
                          <span className="font-medium text-green-700">Sí</span>
                          {visita.seguimientoFecha && (
                            <div className="text-xs text-gray-500">
                              {format(new Date(visita.seguimientoFecha), 'dd/MM/yy', { locale: es })}
                            </div>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* Motivo No Realizada */}
                    <td className="px-3 py-2 text-xs text-gray-600">
                      {visita.visitType === 'no_se_pudo_realizar' ? (
                        <span className="text-red-600">
                          {visita.motivoNoVisita === 'no_abrieron' && 'No abrieron'}
                          {visita.motivoNoVisita === 'sin_tiempo' && 'Sin tiempo'}
                          {visita.motivoNoVisita === 'otra' && (visita.motivoNoVisitaOtra || 'Otra')}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* Notas */}
                    <td className="px-3 py-2 text-xs text-gray-600 max-w-xs truncate">
                      {visita.additionalNotes || '-'}
                    </td>

                    {/* Fecha Creación */}
                    <td className="px-3 py-2 bg-gray-50 text-xs text-gray-600">
                      {formatDate(visita.createdAt)}
                    </td>

                    {/* Acciones */}
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedVisita(visita)}
                          className="text-primary-600 hover:text-primary-800 text-xs font-medium"
                          title="Ver detalles"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => handleEditar(visita)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                          title="Editar visita"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDuplicar(visita)}
                          className="text-green-600 hover:text-green-800 text-xs font-medium"
                          title="Duplicar visita"
                        >
                          Duplicar
                        </button>
                        <button
                          onClick={() => handleEliminar(visita.id, visita.familia.nombre)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium"
                          title="Eliminar visita"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            {/* Info de paginación */}
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1} - {endIndex} de {totalVisitas} visitas
            </div>

            {/* Controles de paginación */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn btn-sm btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className={`btn btn-sm ${
                        currentPage === pageNum
                          ? 'btn-primary'
                          : 'btn-outline'
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
                className="btn btn-sm btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente →
              </button>
            </div>

            {/* Selector de tamaño de página */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Por página:</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="select select-sm select-bordered"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Help text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3 text-sm text-blue-800">
          <Lightbulb className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>
            <strong>Tip:</strong> Usa los filtros para buscar visitas específicas. Puedes ordenar por fecha, familia o tipo de visita.
          </p>
        </div>
      </div>

      {/* Modal de Detalles */}
      {selectedVisita && (
        <VisitaDetallesModal
          visita={selectedVisita}
          onClose={() => setSelectedVisita(null)}
        />
      )}
    </div>
  );
}
