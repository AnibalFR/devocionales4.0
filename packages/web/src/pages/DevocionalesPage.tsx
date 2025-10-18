import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';

const MIEMBROS_CON_DEVOCIONAL = gql`
  query MiembrosConDevocional {
    miembrosConDevocional {
      id
      nombre
      apellidos
      direccion
      devocionalDia
      devocionalHora
      devocionalParticipantes
      devocionalMiembros
      familia {
        id
        nombre
      }
      barrio {
        id
        nombre
      }
      nucleo {
        id
        nombre
      }
    }
  }
`;

const MIEMBROS_ACTIVOS = gql`
  query MiembrosActivos {
    miembros {
      id
      nombre
      apellidos
      rol
      familia {
        id
        nombre
      }
      barrio {
        id
        nombre
      }
    }
  }
`;

const UPDATE_MIEMBRO = gql`
  mutation UpdateMiembro($id: ID!, $input: UpdateMiembroInput!) {
    updateMiembro(id: $id, input: $input) {
      id
      nombre
      devocionalDia
      devocionalHora
      devocionalParticipantes
      devocionalMiembros
    }
  }
`;

const DIAS_SEMANA = [
  { value: 'lunes', label: 'Lunes' },
  { value: 'martes', label: 'Martes' },
  { value: 'miércoles', label: 'Miércoles' },
  { value: 'jueves', label: 'Jueves' },
  { value: 'viernes', label: 'Viernes' },
  { value: 'sábado', label: 'Sábado' },
  { value: 'domingo', label: 'Domingo' },
];

interface EditingState {
  miembroId: string | null;
  field: 'dia' | 'hora' | 'participantes' | null;
  value: string | number | null;
}

interface ModalState {
  isOpen: boolean;
  miembroId: string | null;
  miembroNombre: string;
  currentAcompanantesIds: string[];
  minParticipantes: number;
}

export function DevocionalesPage() {
  const [editing, setEditing] = useState<EditingState>({
    miembroId: null,
    field: null,
    value: null,
  });

  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    miembroId: null,
    miembroNombre: '',
    currentAcompanantesIds: [],
    minParticipantes: 1,
  });

  const [selectedAcompanantes, setSelectedAcompanantes] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');

  const { data, loading, error, refetch } = useQuery(MIEMBROS_CON_DEVOCIONAL);
  const { data: miembrosData } = useQuery(MIEMBROS_ACTIVOS);
  const [updateMiembro] = useMutation(UPDATE_MIEMBRO);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="mt-2 text-gray-600">Cargando devocionales...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-red-50 border-red-200">
        <p className="text-red-700">Error al cargar devocionales: {error.message}</p>
      </div>
    );
  }

  const miembrosConDevocional = data?.miembrosConDevocional || [];
  const todosMiembros = miembrosData?.miembros || [];

  const startEdit = (miembroId: string, field: 'dia' | 'hora' | 'participantes', currentValue: any) => {
    setEditing({ miembroId, field, value: currentValue });
  };

  const cancelEdit = () => {
    setEditing({ miembroId: null, field: null, value: null });
  };

  const findNextEditableCell = (currentCell: HTMLTableCellElement): HTMLTableCellElement | null => {
    const row = currentCell.parentElement as HTMLTableRowElement;
    if (!row) return null;

    const cells = Array.from(row.cells);
    const currentIndex = cells.indexOf(currentCell);

    // Buscar siguiente celda editable en la misma fila
    for (let i = currentIndex + 1; i < cells.length; i++) {
      const cell = cells[i];
      if (cell.querySelector('button[onClick]')) {
        return cell as HTMLTableCellElement;
      }
    }

    return null;
  };

  const saveEdit = async (miembroId: string, moveToNext = false, currentCellElement?: HTMLTableCellElement) => {
    if (!editing.field || editing.value === null) return;

    try {
      const input: any = {};

      if (editing.field === 'dia') {
        input.devocionalDia = editing.value;
      } else if (editing.field === 'hora') {
        input.devocionalHora = editing.value;
      } else if (editing.field === 'participantes') {
        const participantes = parseInt(editing.value as string);

        // Validación: Participantes >= (Acompañantes + 1)
        const miembro = miembrosConDevocional.find((m: any) => m.id === miembroId);
        const numAcompanantes = miembro?.devocionalMiembros?.length || 0;

        if (participantes < numAcompanantes + 1) {
          alert(`Error: Los participantes deben ser al menos ${numAcompanantes + 1} (número de acompañantes + 1)`);
          cancelEdit();
          return;
        }

        input.devocionalParticipantes = participantes;
      }

      await updateMiembro({
        variables: { id: miembroId, input },
      });

      refetch();
      cancelEdit();

      // Si se presionó Tab, mover a la siguiente celda
      if (moveToNext && currentCellElement) {
        setTimeout(() => {
          const nextCell = findNextEditableCell(currentCellElement);
          if (nextCell) {
            const button = nextCell.querySelector('button');
            if (button) {
              button.click();
            }
          }
        }, 50);
      }
    } catch (err: any) {
      alert(`Error al actualizar: ${err.message}`);
      cancelEdit();
    }
  };

  const openAcompanantesModal = (miembro: any) => {
    setModalState({
      isOpen: true,
      miembroId: miembro.id,
      miembroNombre: miembro.nombre,
      currentAcompanantesIds: miembro.devocionalMiembros || [],
      minParticipantes: miembro.devocionalParticipantes || 1,
    });
    setSelectedAcompanantes(miembro.devocionalMiembros || []);
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      miembroId: null,
      miembroNombre: '',
      currentAcompanantesIds: [],
      minParticipantes: 1,
    });
    setSelectedAcompanantes([]);
    setSearchText('');
  };

  const toggleAcompanante = (miembroId: string) => {
    setSelectedAcompanantes(prev => {
      if (prev.includes(miembroId)) {
        return prev.filter(id => id !== miembroId);
      } else {
        return [...prev, miembroId];
      }
    });
  };

  const toggleSelectAll = () => {
    const miembrosFiltrados = todosMiembros.filter((m: any) => {
      if (m.id === modalState.miembroId) return false;
      if (!searchText) return true;
      const nombreCompleto = `${m.nombre} ${m.apellidos || ''}`.toLowerCase();
      return nombreCompleto.includes(searchText.toLowerCase());
    });

    if (selectedAcompanantes.length === miembrosFiltrados.length) {
      setSelectedAcompanantes([]);
    } else {
      setSelectedAcompanantes(miembrosFiltrados.map((m: any) => m.id));
    }
  };

  const saveAcompanantes = async () => {
    if (!modalState.miembroId) return;

    // Validación: Participantes >= (Acompañantes + 1)
    const numAcompanantes = selectedAcompanantes.length;
    if (modalState.minParticipantes < numAcompanantes + 1) {
      alert(`Error: Debes tener al menos ${numAcompanantes + 1} participantes. Actualmente tienes ${modalState.minParticipantes}.`);
      return;
    }

    try {
      await updateMiembro({
        variables: {
          id: modalState.miembroId,
          input: {
            devocionalMiembros: selectedAcompanantes,
          },
        },
      });

      refetch();
      closeModal();
    } catch (err: any) {
      alert(`Error al actualizar acompañantes: ${err.message}`);
    }
  };

  const getNombresAcompanantes = (acompanantesIds: string[]) => {
    if (!acompanantesIds || acompanantesIds.length === 0) return '-';

    return acompanantesIds
      .map(id => {
        const miembro = todosMiembros.find((m: any) => m.id === id);
        if (!miembro) return '';
        return `${miembro.nombre} ${miembro.apellidos || ''}`.trim();
      })
      .filter(n => n)
      .join(', ');
  };

  const handleEliminarDevocional = async (id: string, nombre: string) => {
    if (!confirm(`¿Desmarcar devocional de "${nombre}"?\n\nEsto desactivará la reunión devocional, pero el miembro seguirá existiendo.`)) return;

    try {
      await updateMiembro({
        variables: {
          id,
          input: {
            tieneDevocional: false,
            devocionalDia: null,
            devocionalHora: null,
            devocionalParticipantes: null,
            devocionalMiembros: [],
          },
        },
      });
      refetch();
    } catch (err: any) {
      alert(`Error al eliminar devocional: ${err.message}`);
    }
  };

  const handleNuevaDevocional = () => {
    if (todosMiembros.length === 0) {
      alert('⚠ Primero debes crear al menos un miembro.\n\nVe al Catálogo de Miembros y crea un miembro antes de agregar devocionales.');
      return;
    }

    alert('ℹ Para agregar una nueva devocional, ve al Catálogo de Miembros y marca el checkbox "Reunión Devocional" en el miembro que será el anfitrión.');
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Catálogo de Devocionales</h1>
          <p className="text-gray-600 mt-2">
            Miembros con devocional activo - Edición inline de horarios y participantes
          </p>
        </div>
        <button
          onClick={handleNuevaDevocional}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Nueva Devocional</span>
        </button>
      </div>

      {/* Estadísticas */}
      {miembrosConDevocional.length > 0 && (
        <div className="card mb-6">
          <div className="text-sm text-gray-600">
            Total de devocionales: <span className="font-semibold text-gray-900">{miembrosConDevocional.length}</span>
          </div>
        </div>
      )}

      {miembrosConDevocional.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600">No hay devocionales registrados</p>
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Anfitrión
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Día
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dirección
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Barrio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Núcleo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Miembros que Acompañan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participantes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {miembrosConDevocional.map((miembro: any) => (
                  <tr key={miembro.id} className="hover:bg-gray-50">
                    {/* Anfitrión con badges de validación */}
                    <td className="px-6 py-4 text-sm font-medium text-primary-600 bg-gray-50" title="Editar en: Catálogo de Miembros">
                      <div className="flex items-center gap-2">
                        <span>{miembro.nombre} {miembro.apellidos || ''}</span>
                        {/* Badge amarillo: sin día/hora definidos */}
                        {(!miembro.devocionalDia || !miembro.devocionalHora) && (
                          <span
                            title="Sin día/hora definidos. Editar en: Catálogo de Devocionales"
                            className="inline-flex items-center justify-center w-5 h-5 rounded-full cursor-help bg-yellow-100 text-yellow-600"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                        {/* Badge naranja: sin familia asignada */}
                        {!miembro.familia?.id && (
                          <span
                            title="Sin familia asignada. Ligar miembro en: Catálogo de Familias"
                            className="inline-flex items-center justify-center w-5 h-5 rounded-full cursor-help bg-orange-100 text-orange-600"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Día - Editable */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" ref={(el) => el && editing.miembroId === miembro.id && editing.field === 'dia' ? (el as any)._currentCell = el : null}>
                      {editing.miembroId === miembro.id && editing.field === 'dia' ? (
                        <div className="flex items-center space-x-2">
                          <select
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                            value={editing.value as string}
                            onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                saveEdit(miembro.id);
                              }
                              if (e.key === 'Escape') {
                                e.preventDefault();
                                cancelEdit();
                              }
                              if (e.key === 'Tab') {
                                e.preventDefault();
                                const cell = e.currentTarget.parentElement?.parentElement as HTMLTableCellElement;
                                saveEdit(miembro.id, true, cell);
                              }
                            }}
                            autoFocus
                          >
                            <option value="">Seleccionar...</option>
                            {DIAS_SEMANA.map(dia => (
                              <option key={dia.value} value={dia.value}>{dia.label}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => saveEdit(miembro.id)}
                            className="text-green-600 hover:text-green-800"
                          >
                            ✓
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-red-600 hover:text-red-800"
                          >
                            ✗
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(miembro.id, 'dia', miembro.devocionalDia)}
                          className="hover:text-primary-600 hover:underline text-left"
                        >
                          {DIAS_SEMANA.find(d => d.value === miembro.devocionalDia)?.label || miembro.devocionalDia || '-'}
                        </button>
                      )}
                    </td>

                    {/* Hora - Editable */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {editing.miembroId === miembro.id && editing.field === 'hora' ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="time"
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                            value={editing.value as string}
                            onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                saveEdit(miembro.id);
                              }
                              if (e.key === 'Escape') {
                                e.preventDefault();
                                cancelEdit();
                              }
                              if (e.key === 'Tab') {
                                e.preventDefault();
                                const cell = e.currentTarget.parentElement?.parentElement as HTMLTableCellElement;
                                saveEdit(miembro.id, true, cell);
                              }
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => saveEdit(miembro.id)}
                            className="text-green-600 hover:text-green-800"
                          >
                            ✓
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-red-600 hover:text-red-800"
                          >
                            ✗
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(miembro.id, 'hora', miembro.devocionalHora)}
                          className="hover:text-primary-600 hover:underline text-left"
                        >
                          {miembro.devocionalHora || '-'}
                        </button>
                      )}
                    </td>

                    {/* Dirección */}
                    <td className="px-6 py-4 text-sm text-gray-600 bg-gray-50" title="Editar en: Catálogo de Miembros">
                      {miembro.direccion || '-'}
                    </td>

                    {/* Barrio */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 bg-gray-50" title="Editar en: Catálogo de Miembros">
                      {miembro.barrio?.nombre || '-'}
                    </td>

                    {/* Núcleo */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 bg-gray-50" title="Editar en: Catálogo de Miembros">
                      {miembro.nucleo?.nombre || '-'}
                    </td>

                    {/* Miembros que Acompañan */}
                    <td className="px-6 py-4 text-sm text-primary-600 font-medium">
                      {getNombresAcompanantes(miembro.devocionalMiembros)}
                    </td>

                    {/* Participantes - Editable */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {editing.miembroId === miembro.id && editing.field === 'participantes' ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="1"
                            className="border border-gray-300 rounded px-2 py-1 text-sm w-20"
                            value={editing.value as number}
                            onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                saveEdit(miembro.id);
                              }
                              if (e.key === 'Escape') {
                                e.preventDefault();
                                cancelEdit();
                              }
                              if (e.key === 'Tab') {
                                e.preventDefault();
                                const cell = e.currentTarget.parentElement?.parentElement as HTMLTableCellElement;
                                saveEdit(miembro.id, true, cell);
                              }
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => saveEdit(miembro.id)}
                            className="text-green-600 hover:text-green-800"
                          >
                            ✓
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-red-600 hover:text-red-800"
                          >
                            ✗
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(miembro.id, 'participantes', miembro.devocionalParticipantes)}
                          className="hover:text-primary-600 hover:underline text-left"
                        >
                          {miembro.devocionalParticipantes || 0}
                        </button>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openAcompanantesModal(miembro)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium flex items-center gap-1"
                          title="Gestionar miembros que acompañan"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                          </svg>
                          Acompañan
                        </button>
                        <button
                          onClick={() => handleEliminarDevocional(miembro.id, miembro.nombre)}
                          className="text-red-600 hover:text-red-800 font-medium"
                          title="Desmarcar devocional"
                        >
                          <svg className="w-4 h-4 inline-block mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Help text */}
      <div className="card mt-4 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> Haz clic en cualquier celda para editarla. Presiona <kbd className="px-1 py-0.5 bg-white border border-blue-300 rounded text-xs">Enter</kbd> para guardar, <kbd className="px-1 py-0.5 bg-white border border-blue-300 rounded text-xs">Tab</kbd> para ir a la siguiente celda, o <kbd className="px-1 py-0.5 bg-white border border-blue-300 rounded text-xs">Escape</kbd> para cancelar.
        </p>
      </div>

      {/* Modal de Acompañantes */}
      {modalState.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  Miembros que acompañan al Anfitrión de la Reunión Devocional
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* Anfitrión */}
              <div className="mt-3 px-4 py-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                <strong className="text-blue-700">Anfitrión:</strong>{' '}
                <span className="text-gray-900 font-semibold">{modalState.miembroNombre}</span>
              </div>
            </div>

            {/* Búsqueda */}
            <div className="px-6 py-3">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Buscar miembro por nombre..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Body - Tabla */}
            <div className="flex-1 overflow-auto border-t border-gray-200">
              {todosMiembros.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No hay miembros disponibles</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={
                            todosMiembros.filter((m: any) => {
                              if (m.id === modalState.miembroId) return false;
                              if (!searchText) return true;
                              const nombreCompleto = `${m.nombre} ${m.apellidos || ''}`.toLowerCase();
                              return nombreCompleto.includes(searchText.toLowerCase());
                            }).length > 0 &&
                            selectedAcompanantes.length ===
                              todosMiembros.filter((m: any) => {
                                if (m.id === modalState.miembroId) return false;
                                if (!searchText) return true;
                                const nombreCompleto = `${m.nombre} ${m.apellidos || ''}`.toLowerCase();
                                return nombreCompleto.includes(searchText.toLowerCase());
                              }).length
                          }
                          onChange={toggleSelectAll}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Barrio</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Familia</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {todosMiembros
                      .filter((m: any) => {
                        if (m.id === modalState.miembroId) return false;
                        if (!searchText) return true;
                        const nombreCompleto = `${m.nombre} ${m.apellidos || ''}`.toLowerCase();
                        return nombreCompleto.includes(searchText.toLowerCase());
                      })
                      .sort((a: any, b: any) => {
                        const aSelected = selectedAcompanantes.includes(a.id);
                        const bSelected = selectedAcompanantes.includes(b.id);
                        if (aSelected && !bSelected) return -1;
                        if (!aSelected && bSelected) return 1;
                        return a.nombre.localeCompare(b.nombre);
                      })
                      .map((miembro: any) => {
                        const isSelected = selectedAcompanantes.includes(miembro.id);
                        const rolColors: Record<string, string> = {
                          CEA: 'bg-green-600',
                          COLABORADOR: 'bg-blue-600',
                          MIEMBRO: 'bg-gray-600',
                        };

                        return (
                          <tr
                            key={miembro.id}
                            className={`hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
                            onClick={() => toggleAcompanante(miembro.id)}
                          >
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleAcompanante(miembro.id);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                              {miembro.nombre} {miembro.apellidos || ''}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span
                                className={`px-2 py-1 rounded text-xs font-semibold text-white ${
                                  rolColors[miembro.rol] || 'bg-gray-600'
                                }`}
                              >
                                {miembro.rol}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {miembro.barrio?.nombre || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {miembro.familia?.nombre || '-'}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveAcompanantes}
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors font-semibold"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
