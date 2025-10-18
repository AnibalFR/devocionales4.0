import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { Trash2 } from 'lucide-react';

const METAS_QUERY = gql`
  query Metas {
    metas {
      id
      trimestre
      fechaInicio
      fechaFin
      metaNucleos
      metaVisitas
      metaPersonasVisitando
      metaDevocionales
      estado
      createdAt
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

const CREATE_META = gql`
  mutation CreateMeta($input: CreateMetaInput!) {
    createMeta(input: $input) {
      id
      trimestre
    }
  }
`;

const UPDATE_META = gql`
  mutation UpdateMeta($id: ID!, $input: UpdateMetaInput!) {
    updateMeta(id: $id, input: $input) {
      id
      trimestre
    }
  }
`;

const DELETE_META = gql`
  mutation DeleteMeta($id: ID!) {
    deleteMeta(id: $id)
  }
`;

const ESTADO_LABELS: Record<string, string> = {
  futura: 'Futura',
  activa: 'Activa',
  completada: 'Completada',
};

const ESTADO_COLORS: Record<string, string> = {
  futura: 'bg-blue-100 text-blue-800 border-blue-300',
  activa: 'bg-green-100 text-green-800 border-green-300',
  completada: 'bg-gray-100 text-gray-800 border-gray-300',
};

export function MetasPage() {
  // State para edición inline (replicar v3.0)
  const [editingCell, setEditingCell] = useState<{metaId: string, field: string} | null>(null);

  const { data, loading, error, refetch } = useQuery(METAS_QUERY);
  const [createMeta] = useMutation(CREATE_META);
  const [updateMeta] = useMutation(UPDATE_META);
  const [deleteMeta] = useMutation(DELETE_META);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="mt-2 text-gray-600">Cargando metas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-red-50 border-red-200">
        <p className="text-red-700">Error al cargar metas: {error.message}</p>
      </div>
    );
  }

  const metas = data?.metas || [];
  const metaActiva = metas.find((m: any) => m.estado === 'activa');

  const generateTrimestreOptions = () => {
    // Sistema de trimestres del comité (META-011)
    // Cada trimestre va del día 21 al 20 del siguiente período
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];

    const options: { value: string; label: string; fechaInicio: string; fechaFin: string }[] = [];

    years.forEach(year => {
      // Ene - Abr: 21 de enero al 20 de abril
      options.push({
        value: `ene-abr-${year}`,
        label: `Ene - Abr ${year}`,
        fechaInicio: `${year}-01-21`,
        fechaFin: `${year}-04-20`,
      });

      // Abr - Jul: 21 de abril al 20 de julio
      options.push({
        value: `abr-jul-${year}`,
        label: `Abr - Jul ${year}`,
        fechaInicio: `${year}-04-21`,
        fechaFin: `${year}-07-20`,
      });

      // Jul - Oct: 21 de julio al 20 de octubre
      options.push({
        value: `jul-oct-${year}`,
        label: `Jul - Oct ${year}`,
        fechaInicio: `${year}-07-21`,
        fechaFin: `${year}-10-20`,
      });

      // Oct - Ene: 21 de octubre al 20 de enero (cruza años)
      options.push({
        value: `oct-ene-${year}`,
        label: `Oct ${year} - Ene ${year + 1}`,
        fechaInicio: `${year}-10-21`,
        fechaFin: `${year + 1}-01-20`,
      });
    });

    // Ordenar por fecha de inicio
    return options.sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio));
  };

  const openCreateModal = async () => {
    // Replicar comportamiento de v3.0: crear meta directamente sin modal
    // Obtener trimestres disponibles (4 trimestres: 2 pasados, actual, siguiente)
    const trimestresDisponibles = generateTrimestreOptions();

    // Obtener fecha actual
    const now = new Date();
    const currentDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Buscar el trimestre actual
    let trimestreSeleccionado = null;

    for (const trimestre of trimestresDisponibles) {
      if (currentDateStr >= trimestre.fechaInicio && currentDateStr <= trimestre.fechaFin) {
        trimestreSeleccionado = trimestre;
        break;
      }
    }

    // Si no encontramos el actual, usar el último disponible (siguiente)
    if (!trimestreSeleccionado && trimestresDisponibles.length > 0) {
      trimestreSeleccionado = trimestresDisponibles[trimestresDisponibles.length - 1];
    }

    // Si aún no tenemos trimestre, usar el primero como fallback
    if (!trimestreSeleccionado && trimestresDisponibles.length > 0) {
      trimestreSeleccionado = trimestresDisponibles[0];
    }

    // Crear la meta directamente con el trimestre seleccionado
    if (trimestreSeleccionado) {
      try {
        await createMeta({
          variables: {
            input: {
              trimestre: trimestreSeleccionado.label,
              fechaInicio: trimestreSeleccionado.fechaInicio,
              fechaFin: trimestreSeleccionado.fechaFin,
              metaNucleos: 0,
              metaVisitas: 0,
              metaPersonasVisitando: 0,
              metaDevocionales: 0,
            },
          },
        });

        refetch();
      } catch (err: any) {
        alert(`Error al crear meta: ${err.message}`);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta meta?')) return;

    try {
      await deleteMeta({ variables: { id } });
      refetch();
    } catch (err: any) {
      alert(`Error al eliminar: ${err.message}`);
    }
  };

  const renderProgressBar = (label: string, actual: number, meta: number, porcentaje: number) => {
    // Determinar color y mensaje según META-006
    let color = '';
    let mensaje = '';
    let colorMensaje = '';

    if (meta === 0) {
      // Si la meta es 0, mostrar verde sin mensaje
      color = 'bg-green-500';
    } else if (porcentaje >= 80) {
      // Verde (≥80% de cumplimiento)
      color = 'bg-green-500';
      mensaje = '¡Excelente progreso!';
      colorMensaje = 'text-green-700';
    } else if (porcentaje >= 50) {
      // Amarillo (50-79% de cumplimiento)
      color = 'bg-yellow-500';
      mensaje = '¡Buen avance!';
      colorMensaje = 'text-yellow-700';
    } else {
      // Rojo (<50% de cumplimiento)
      color = 'bg-red-500';
      mensaje = '¡Sigamos adelante!';
      colorMensaje = 'text-red-700';
    }

    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm text-gray-600">
            {actual} / {meta} ({porcentaje.toFixed(1)}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-1">
          <div
            className={`h-3 rounded-full transition-all ${color}`}
            style={{ width: `${Math.min(porcentaje, 100)}%` }}
          ></div>
        </div>
        {mensaje && (
          <p className={`text-xs font-medium ${colorMensaje}`}>{mensaje}</p>
        )}
      </div>
    );
  };

  // ============================================
  // FUNCIONES DE EDICIÓN INLINE (v3.0 pattern)
  // ============================================

  const handleInlineUpdate = async (metaId: string, field: string, value: any) => {
    try {
      await updateMeta({
        variables: {
          id: metaId,
          input: { [field]: value }
        }
      });
      await refetch();
    } catch (err: any) {
      alert(`Error al actualizar: ${err.message}`);
    }
  };

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '-';
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTimeForDisplay = (dateTimeString: string) => {
    if (!dateTimeString) return '-';
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Componente: Celda editable con dropdown para Trimestre
  const renderTrimestreCell = (meta: any) => {
    const isEditing = editingCell?.metaId === meta.id && editingCell?.field === 'trimestre';

    if (isEditing) {
      return (
        <select
          autoFocus
          defaultValue={meta.trimestre}
          className="w-full border-2 border-primary-600 rounded px-2 py-1 text-sm"
          onChange={async (e) => {
            const selectedOption = generateTrimestreOptions().find(opt => opt.label === e.target.value);
            if (selectedOption) {
              await handleInlineUpdate(meta.id, 'trimestre', selectedOption.label);
              await handleInlineUpdate(meta.id, 'fechaInicio', selectedOption.fechaInicio);
              await handleInlineUpdate(meta.id, 'fechaFin', selectedOption.fechaFin);
            }
            setEditingCell(null);
          }}
          onBlur={() => setEditingCell(null)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setEditingCell(null);
          }}
        >
          {generateTrimestreOptions().map(opt => (
            <option key={opt.value} value={opt.label}>{opt.label}</option>
          ))}
        </select>
      );
    }

    return (
      <span
        className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded block"
        onClick={() => setEditingCell({metaId: meta.id, field: 'trimestre'})}
      >
        {meta.trimestre}
      </span>
    );
  };

  // Componente: Celda editable con date picker
  const renderDateCell = (meta: any, field: 'fechaInicio' | 'fechaFin') => {
    const isEditing = editingCell?.metaId === meta.id && editingCell?.field === field;
    const value = meta[field];

    if (isEditing) {
      return (
        <input
          type="date"
          autoFocus
          defaultValue={value}
          className="w-full border-2 border-primary-600 rounded px-2 py-1 text-sm"
          onChange={async (e) => {
            if (e.target.value) {
              await handleInlineUpdate(meta.id, field, e.target.value);
            }
          }}
          onBlur={() => setEditingCell(null)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setEditingCell(null);
            if (e.key === 'Enter') setEditingCell(null);
          }}
        />
      );
    }

    return (
      <span
        className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded block"
        onClick={() => setEditingCell({metaId: meta.id, field})}
      >
        {formatDateForDisplay(value)}
      </span>
    );
  };

  // Componente: Celda editable con number input
  const renderNumberCell = (meta: any, field: 'metaNucleos' | 'metaVisitas' | 'metaPersonasVisitando' | 'metaDevocionales') => {
    const isEditing = editingCell?.metaId === meta.id && editingCell?.field === field;
    const value = meta[field];

    if (isEditing) {
      return (
        <input
          type="number"
          min="0"
          autoFocus
          defaultValue={value}
          className="w-full border-2 border-primary-600 rounded px-2 py-1 text-sm text-center"
          onBlur={async (e) => {
            const newValue = parseInt(e.target.value);
            if (!isNaN(newValue) && newValue >= 0 && newValue !== value) {
              await handleInlineUpdate(meta.id, field, newValue);
            }
            setEditingCell(null);
          }}
          onKeyDown={async (e) => {
            if (e.key === 'Escape') {
              setEditingCell(null);
            } else if (e.key === 'Enter') {
              const newValue = parseInt((e.target as HTMLInputElement).value);
              if (!isNaN(newValue) && newValue >= 0 && newValue !== value) {
                await handleInlineUpdate(meta.id, field, newValue);
              }
              setEditingCell(null);
            }
          }}
          onClick={(e) => {
            (e.target as HTMLInputElement).select();
          }}
        />
      );
    }

    return (
      <span
        className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded block text-center font-bold text-green-600"
        onClick={() => setEditingCell({metaId: meta.id, field})}
      >
        {value}
      </span>
    );
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Metas Trimestrales</h1>
          <p className="text-gray-600 mt-2">
            Gestión de objetivos por ciclo trimestral
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Nueva Meta</span>
        </button>
      </div>

      {/* Banner Informativo (META-009) */}
      <div className="mb-6 bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-r-lg p-4 flex items-start space-x-3">
        <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-blue-900">
          Define aquí las metas del comité por trimestre. La meta con fecha actual será marcada como <strong>Activa</strong> y se mostrará en el Reporte de Ciclo.
        </p>
      </div>

      {/* Meta Activa con Progreso */}
      {metaActiva && metaActiva.progreso && (
        <div className="card mb-6 border-2 border-green-400 bg-green-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Meta Activa - {metaActiva.trimestre}
            </h2>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${ESTADO_COLORS.activa}`}>
              {ESTADO_LABELS.activa}
            </span>
          </div>

          <div className="text-sm text-gray-600 mb-4">
            Período: {metaActiva.fechaInicio} al {metaActiva.fechaFin}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {renderProgressBar(
              'Núcleos',
              metaActiva.progreso.nucleosActuales,
              metaActiva.metaNucleos,
              metaActiva.progreso.nucleosPorcentaje
            )}

            {renderProgressBar(
              'Visitas',
              metaActiva.progreso.visitasActuales,
              metaActiva.metaVisitas,
              metaActiva.progreso.visitasPorcentaje
            )}

            {renderProgressBar(
              'Personas Visitando',
              metaActiva.progreso.personasVisitandoActuales,
              metaActiva.metaPersonasVisitando,
              metaActiva.progreso.personasVisitandoPorcentaje
            )}

            {renderProgressBar(
              'Devocionales',
              metaActiva.progreso.devocionalesActuales,
              metaActiva.metaDevocionales,
              metaActiva.progreso.devocionalesPorcentaje
            )}
          </div>
        </div>
      )}

      {/* Lista de Todas las Metas */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Todas las Metas</h2>

        {metas.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No hay metas registradas</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{minWidth: '180px'}}>
                    Trimestre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{minWidth: '130px'}}>
                    Fecha Inicio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{minWidth: '130px'}}>
                    Fecha Fin
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{minWidth: '110px'}}>
                    Meta Núcleos
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{minWidth: '110px'}}>
                    Meta Visitas
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{minWidth: '140px'}}>
                    Meta Personas Visitando
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{minWidth: '120px'}}>
                    Meta Devocionales
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{minWidth: '100px'}}>
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{minWidth: '150px'}}>
                    Fecha Creación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{minWidth: '120px'}}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metas.map((meta: any) => (
                  <tr key={meta.id} className="hover:bg-gray-50">
                    {/* Trimestre - EDITABLE */}
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {renderTrimestreCell(meta)}
                    </td>

                    {/* Fecha Inicio - EDITABLE */}
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                      {renderDateCell(meta, 'fechaInicio')}
                    </td>

                    {/* Fecha Fin - EDITABLE */}
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                      {renderDateCell(meta, 'fechaFin')}
                    </td>

                    {/* Meta Núcleos - EDITABLE */}
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {renderNumberCell(meta, 'metaNucleos')}
                    </td>

                    {/* Meta Visitas - EDITABLE */}
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {renderNumberCell(meta, 'metaVisitas')}
                    </td>

                    {/* Meta Personas Visitando - EDITABLE */}
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {renderNumberCell(meta, 'metaPersonasVisitando')}
                    </td>

                    {/* Meta Devocionales - EDITABLE */}
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {renderNumberCell(meta, 'metaDevocionales')}
                    </td>

                    {/* Estado - CALCULADO (no editable) */}
                    <td className="px-4 py-2 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${ESTADO_COLORS[meta.estado]}`}>
                        {ESTADO_LABELS[meta.estado]}
                      </span>
                    </td>

                    {/* Fecha Creación - NO EDITABLE */}
                    <td className="px-4 py-2 whitespace-nowrap text-sm bg-gray-50 text-gray-500">
                      {formatDateTimeForDisplay(meta.createdAt)}
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDelete(meta.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-semibold"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
