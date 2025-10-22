import { useState, useRef } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { Lightbulb } from 'lucide-react';
import EditConflictModal from '../components/EditConflictModal';
import EditingIndicator from '../components/EditingIndicator';

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

const GET_BARRIOS = gql`
  query GetBarrios {
    barrios {
      id
      nombre
      descripcion
      createdAt
      updatedAt
      nucleos {
        id
        nombre
      }
    }
    nucleos {
      id
      nombre
      barrioId
    }
  }
`;

const CREATE_BARRIO = gql`
  mutation CreateBarrio($input: CreateBarrioInput!) {
    createBarrio(input: $input) {
      id
      nombre
      descripcion
      createdAt
    }
  }
`;

const UPDATE_BARRIO = gql`
  mutation UpdateBarrio($id: ID!, $input: UpdateBarrioInput!) {
    updateBarrio(id: $id, input: $input) {
      id
      nombre
      descripcion
      createdAt
      updatedAt
    }
  }
`;

const DELETE_BARRIO = gql`
  mutation DeleteBarrio($id: ID!) {
    deleteBarrio(id: $id)
  }
`;

const UPDATE_NUCLEO = gql`
  mutation UpdateNucleo($id: ID!, $input: UpdateNucleoInput!) {
    updateNucleo(id: $id, input: $input) {
      id
      nombre
      barrioId
    }
  }
`;

export function BarriosPage() {
  const { data, loading, error, refetch } = useQuery(GET_BARRIOS);
  const [createBarrio] = useMutation(CREATE_BARRIO, {
    refetchQueries: [{ query: GET_BARRIOS }],
  });
  const [updateBarrio] = useMutation(UPDATE_BARRIO);
  const [deleteBarrio] = useMutation(DELETE_BARRIO, {
    refetchQueries: [{ query: GET_BARRIOS }],
  });
  const [updateNucleo] = useMutation(UPDATE_NUCLEO);

  const [editing, setEditing] = useState<{
    barrioId: string | null;
    field: string | null;
    value: string;
    updatedAt: string | null;
  }>({ barrioId: null, field: null, value: '', updatedAt: null });

  // FASE 2: Estado para indicador visual de guardado
  const [isSaving, setIsSaving] = useState(false);

  // OCC: Estado del modal de conflictos
  const [conflictModal, setConflictModal] = useState<{
    isOpen: boolean;
    barrioId: string | null;
    field: string | null;
    pendingValue: string;
  }>({
    isOpen: false,
    barrioId: null,
    field: null,
    pendingValue: '',
  });

  // Refs para navegación con Tab
  const tableRef = useRef<HTMLTableElement>(null);
  const isSavingRef = useRef(false);

  // Estado para modal de reasignación de núcleos
  const [reassignModal, setReassignModal] = useState<{
    isOpen: boolean;
    barrioId: string | null;
    barrioNombre: string;
    nucleos: Array<{ id: string; nombre: string }>;
    targetBarrioId: string;
  }>({
    isOpen: false,
    barrioId: null,
    barrioNombre: '',
    nucleos: [],
    targetBarrioId: '',
  });

  const startEdit = (barrioId: string, field: string, value: string) => {
    // OCC Fix: Capturar updatedAt al INICIAR edición, no al guardar
    const barrios = data?.barrios || [];
    const barrio = barrios.find((b: any) => b.id === barrioId);
    setEditing({
      barrioId,
      field,
      value: value || '',
      updatedAt: barrio?.updatedAt || null
    });
  };

  const cancelEdit = () => {
    setEditing({ barrioId: null, field: null, value: '', updatedAt: null });
  };

  // Función para encontrar la siguiente celda editable
  const findNextEditableCell = (currentCell: HTMLTableCellElement): HTMLTableCellElement | null => {
    const row = currentCell.parentElement as HTMLTableRowElement;
    if (!row) return null;

    const cells = Array.from(row.cells);
    const currentIndex = cells.indexOf(currentCell);

    // Buscar siguiente celda editable en la misma fila
    for (let i = currentIndex + 1; i < cells.length; i++) {
      const cell = cells[i];

      // Verificar si la celda es editable (no readonly)
      if (cell.classList.contains('bg-gray-50')) {
        continue; // Celda readonly
      }

      const hasCheckbox = cell.querySelector('input[type="checkbox"]');
      const hasClickableSpan = cell.querySelector('span[class*="cursor-pointer"]');
      const hasSelect = cell.querySelector('select');
      const isEditableCell = cell.classList.contains('editable-cell');

      if (cell.onclick || hasCheckbox || hasClickableSpan || hasSelect || isEditableCell) {
        return cell as HTMLTableCellElement;
      }
    }

    return null;
  };

  const saveEdit = async (barrioId: string, field: string, moveToNext = false, currentCellIndex?: number, forceOverwrite = false) => {
    if (isSavingRef.current) return;

    isSavingRef.current = true;
    setIsSaving(true); // FASE 2: Mostrar indicador de guardado

    try {
      await updateBarrio({
        variables: {
          id: barrioId,
          input: {
            [field]: editing.value || null,
            // OCC Fix: Usar updatedAt capturado al INICIAR edición, no del array actual
            ...(forceOverwrite ? {} : { lastUpdatedAt: editing.updatedAt })
          },
        },
      });

      // Esperar refetch ANTES de cancelEdit para asegurar datos actualizados
      await refetch();
      setIsSaving(false); // FASE 2: Ocultar indicador
      cancelEdit();

      // Si se presionó Tab, mover a la siguiente celda
      if (moveToNext && currentCellIndex !== undefined && tableRef.current) {
        setTimeout(() => {
          const row = tableRef.current?.querySelector(`tr[data-barrio-id="${barrioId}"]`) as HTMLTableRowElement;
          if (!row) {
            isSavingRef.current = false;
            return;
          }

          const currentCell = row.cells[currentCellIndex];
          if (!currentCell) {
            isSavingRef.current = false;
            return;
          }

          const nextCell = findNextEditableCell(currentCell);
          if (nextCell) {
            const clickableSpan = nextCell.querySelector('span[class*="cursor-pointer"]') as HTMLElement;
            const clickableCheckbox = nextCell.querySelector('input[type="checkbox"]') as HTMLElement;

            if (clickableSpan) {
              clickableSpan.click();
            } else if (clickableCheckbox) {
              clickableCheckbox.focus();
            } else if (nextCell.onclick) {
              nextCell.click();
            }
          }
          isSavingRef.current = false;
        }, 100);
      } else {
        isSavingRef.current = false;
      }
    } catch (err: any) {
      setIsSaving(false); // FASE 2: Ocultar indicador en error
      // OCC: Detectar conflicto de edición
      if (err.graphQLErrors?.[0]?.extensions?.code === 'EDIT_CONFLICT') {
        setConflictModal({
          isOpen: true,
          barrioId,
          field,
          pendingValue: editing.value,
        });
      } else {
        console.error('Error updating barrio:', err);
        alert(`Error al actualizar el barrio: ${err.message}`);
        cancelEdit();
      }
      isSavingRef.current = false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, barrioId: string, field: string, cellElement?: HTMLTableCellElement) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit(barrioId, field);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Calcular el índice de la celda actual
      if (cellElement) {
        const row = cellElement.parentElement as HTMLTableRowElement;
        const cellIndex = Array.from(row.cells).indexOf(cellElement);
        saveEdit(barrioId, field, true, cellIndex);
      } else {
        saveEdit(barrioId, field);
      }
    }
  };

  // OCC: Handlers del modal de conflictos
  const handleConflictReload = async () => {
    await refetch();
    setConflictModal({ isOpen: false, barrioId: null, field: null, pendingValue: '' });
    cancelEdit();
  };

  const handleConflictOverwrite = async () => {
    if (!conflictModal.barrioId || !conflictModal.field) return;

    // Restaurar el estado de edición con el valor pendiente
    // OCC Fix: No necesitamos updatedAt porque forceOverwrite=true lo ignora
    setEditing({
      barrioId: conflictModal.barrioId,
      field: conflictModal.field,
      value: conflictModal.pendingValue,
      updatedAt: null, // No importa en sobrescritura forzada
    });

    setConflictModal({ isOpen: false, barrioId: null, field: null, pendingValue: '' });

    // Guardar con forceOverwrite = true
    await saveEdit(conflictModal.barrioId, conflictModal.field, false, undefined, true);
  };

  const handleConflictClose = () => {
    setConflictModal({ isOpen: false, barrioId: null, field: null, pendingValue: '' });
    cancelEdit();
  };

  const handleNuevoBarrio = async () => {
    try {
      await createBarrio({
        variables: {
          input: {
            nombre: 'Nuevo Barrio',
            descripcion: null,
          },
        },
      });
    } catch (error) {
      console.error('Error creating barrio:', error);
      alert('Error al crear el barrio');
    }
  };

  const handleEliminar = async (barrioId: string, nombre: string) => {
    // Buscar el barrio en los datos
    const barrios = data?.barrios || [];
    const barrio = barrios.find((b: any) => b.id === barrioId);

    // Verificar si tiene núcleos asignados
    if (barrio && barrio.nucleos && barrio.nucleos.length > 0) {
      // Mostrar modal de reasignación
      setReassignModal({
        isOpen: true,
        barrioId,
        barrioNombre: nombre,
        nucleos: barrio.nucleos,
        targetBarrioId: '',
      });
    } else {
      // No tiene núcleos, proceder con borrado normal
      if (confirm(`¿Eliminar el barrio "${nombre}"?`)) {
        try {
          await deleteBarrio({
            variables: { id: barrioId },
          });
        } catch (error) {
          console.error('Error deleting barrio:', error);
          alert('Error al eliminar el barrio');
        }
      }
    }
  };

  const handleReassignAndDelete = async () => {
    if (!reassignModal.targetBarrioId) {
      alert('Por favor selecciona un barrio destino');
      return;
    }

    try {
      // 1. Reasignar todos los núcleos al nuevo barrio
      for (const nucleo of reassignModal.nucleos) {
        await updateNucleo({
          variables: {
            id: nucleo.id,
            input: {
              barrioId: reassignModal.targetBarrioId,
            },
          },
        });
      }

      // 2. Borrar el barrio original
      await deleteBarrio({
        variables: { id: reassignModal.barrioId },
      });

      // 3. Cerrar modal
      setReassignModal({
        isOpen: false,
        barrioId: null,
        barrioNombre: '',
        nucleos: [],
        targetBarrioId: '',
      });

      alert('Núcleos reasignados y barrio eliminado correctamente');
    } catch (error) {
      console.error('Error reassigning nucleos:', error);
      alert('Error al reasignar núcleos. Por favor intenta de nuevo.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Cargando barrios...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error al cargar barrios: {error.message}</p>
      </div>
    );
  }

  const barrios = data?.barrios || [];

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Barrios</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gestión de barrios de la comunidad
            </p>
          </div>
          <button onClick={handleNuevoBarrio} className="btn btn-primary">
            + Nuevo Barrio
          </button>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">
            Total de barrios: <span className="font-semibold text-gray-900">{barrios.length}</span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table ref={tableRef} className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '200px' }}>
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '350px' }}>
                    Descripción
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '180px' }}>
                    Fecha Creación
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '120px' }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {barrios.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      No hay barrios registrados. Crea uno nuevo para comenzar.
                    </td>
                  </tr>
                ) : (
                  barrios.map((barrio: any) => (
                    <tr key={barrio.id} data-barrio-id={barrio.id} className="hover:bg-gray-50">
                      {/* Nombre */}
                      {editing.barrioId === barrio.id && editing.field === 'nombre' ? (
                        <td className="px-4 pt-8 pb-2 bg-yellow-50 ring-2 ring-yellow-400 ring-inset relative">
                          {/* FASE 2: Indicador visual */}
                          <EditingIndicator isEditing={true} isSaving={isSaving} />
                          <input
                            type="text"
                            value={editing.value}
                            onChange={(e) =>
                              setEditing({ ...editing, value: e.target.value })
                            }
                            onKeyDown={(e) => {
                              const cell = e.currentTarget.parentElement as HTMLTableCellElement;
                              handleKeyDown(e, barrio.id, 'nombre', cell);
                            }}
                            onBlur={() => saveEdit(barrio.id, 'nombre')}
                            autoFocus
                            className="input input-sm w-full"
                          />
                        </td>
                      ) : (
                        <td
                          className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm font-medium text-gray-900"
                          onClick={() => startEdit(barrio.id, 'nombre', barrio.nombre)}
                        >
                          {barrio.nombre || '-'}
                        </td>
                      )}

                      {/* Descripción */}
                      {editing.barrioId === barrio.id && editing.field === 'descripcion' ? (
                        <td className="px-4 pt-8 pb-2 bg-yellow-50 ring-2 ring-yellow-400 ring-inset relative">
                          {/* FASE 2: Indicador visual */}
                          <EditingIndicator isEditing={true} isSaving={isSaving} />
                          <input
                            type="text"
                            value={editing.value}
                            onChange={(e) =>
                              setEditing({ ...editing, value: e.target.value })
                            }
                            onKeyDown={(e) => {
                              const cell = e.currentTarget.parentElement as HTMLTableCellElement;
                              handleKeyDown(e, barrio.id, 'descripcion', cell);
                            }}
                            onBlur={() => saveEdit(barrio.id, 'descripcion')}
                            autoFocus
                            className="input input-sm w-full"
                          />
                        </td>
                      ) : (
                        <td
                          className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm text-gray-700"
                          onClick={() =>
                            startEdit(barrio.id, 'descripcion', barrio.descripcion)
                          }
                        >
                          {barrio.descripcion || '-'}
                        </td>
                      )}

                      {/* Fecha Creación (NO EDITABLE) */}
                      <td className="px-4 py-2 bg-gray-50 text-sm text-gray-600">
                        {formatDate(barrio.createdAt)}
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-2">
                        <button
                          onClick={() => handleEliminar(barrio.id, barrio.nombre)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Help text */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3 text-sm text-blue-800">
            <Lightbulb className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Tip:</strong> Haz clic en cualquier celda para editarla. Presiona Enter para guardar, Tab para ir a la siguiente celda, o Escape para cancelar.
            </p>
          </div>
        </div>

        {/* Modal de Conflictos de Edición (OCC) */}
        <EditConflictModal
          isOpen={conflictModal.isOpen}
          onClose={handleConflictClose}
          onReload={handleConflictReload}
          onOverwrite={handleConflictOverwrite}
          entityType="barrio"
          fieldName={conflictModal.field || undefined}
        />

        {/* Modal de Reasignación de Núcleos */}
        {reassignModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Reasignar Núcleos Antes de Eliminar
                </h2>

                <div className="mb-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-yellow-800">
                      <strong>⚠️ Atención:</strong> El barrio <strong>"{reassignModal.barrioNombre}"</strong> tiene{' '}
                      <strong>{reassignModal.nucleos.length}</strong> núcleo(s) asignado(s).
                      <br />
                      Debes reasignarlos a otro barrio antes de eliminarlo.
                    </p>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-700 mb-2">
                      Núcleos que serán reasignados:
                    </h3>
                    <ul className="space-y-1">
                      {reassignModal.nucleos.map((nucleo) => (
                        <li key={nucleo.id} className="text-sm text-gray-600 flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          {nucleo.nombre}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Barrio destino: <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={reassignModal.targetBarrioId}
                      onChange={(e) =>
                        setReassignModal({ ...reassignModal, targetBarrioId: e.target.value })
                      }
                      className="select select-bordered w-full"
                    >
                      <option value="">Seleccionar barrio...</option>
                      {(data?.barrios || [])
                        .filter((b: any) => b.id !== reassignModal.barrioId)
                        .map((b: any) => (
                          <option key={b.id} value={b.id}>
                            {b.nombre}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() =>
                      setReassignModal({
                        isOpen: false,
                        barrioId: null,
                        barrioNombre: '',
                        nucleos: [],
                        targetBarrioId: '',
                      })
                    }
                    className="btn btn-ghost"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleReassignAndDelete}
                    disabled={!reassignModal.targetBarrioId}
                    className="btn btn-error"
                  >
                    Reasignar y Eliminar Barrio
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
