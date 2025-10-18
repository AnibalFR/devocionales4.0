import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { AlertTriangle, Lightbulb } from 'lucide-react';

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

const GET_NUCLEOS = gql`
  query GetNucleos {
    nucleos {
      id
      nombre
      barrioId
      descripcion
      createdAt
      barrio {
        id
        nombre
      }
    }
    barrios {
      id
      nombre
    }
  }
`;

const CREATE_NUCLEO = gql`
  mutation CreateNucleo($input: CreateNucleoInput!) {
    createNucleo(input: $input) {
      id
      nombre
      barrioId
      descripcion
      createdAt
      barrio {
        id
        nombre
      }
    }
  }
`;

const UPDATE_NUCLEO = gql`
  mutation UpdateNucleo($id: ID!, $input: UpdateNucleoInput!) {
    updateNucleo(id: $id, input: $input) {
      id
      nombre
      barrioId
      descripcion
      createdAt
      barrio {
        id
        nombre
      }
    }
  }
`;

const DELETE_NUCLEO = gql`
  mutation DeleteNucleo($id: ID!) {
    deleteNucleo(id: $id)
  }
`;

export function NucleosPage() {
  const { data, loading, error, refetch } = useQuery(GET_NUCLEOS);
  const [createNucleo] = useMutation(CREATE_NUCLEO, {
    refetchQueries: [{ query: GET_NUCLEOS }],
  });
  const [updateNucleo] = useMutation(UPDATE_NUCLEO);
  const [deleteNucleo] = useMutation(DELETE_NUCLEO, {
    refetchQueries: [{ query: GET_NUCLEOS }],
  });

  const [editing, setEditing] = useState<{
    nucleoId: string | null;
    field: string | null;
    value: string;
  }>({ nucleoId: null, field: null, value: '' });

  const startEdit = (nucleoId: string, field: string, value: string) => {
    setEditing({ nucleoId, field, value: value || '' });
  };

  const cancelEdit = () => {
    setEditing({ nucleoId: null, field: null, value: '' });
  };

  const saveEdit = async (nucleoId: string, field: string) => {
    try {
      await updateNucleo({
        variables: {
          id: nucleoId,
          input: { [field]: editing.value || null },
        },
      });
      cancelEdit();
      refetch();
    } catch (error: any) {
      console.error('Error updating nucleo:', error);
      alert(error.message || 'Error al actualizar el núcleo');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, nucleoId: string, field: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit(nucleoId, field);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    } else if (e.key === 'Tab') {
      e.preventDefault();

      // Find next editable cell
      const currentCell = e.currentTarget.parentElement;
      const row = currentCell?.parentElement;
      if (!row) return;

      const cells = Array.from(row.cells);
      const currentIndex = cells.indexOf(currentCell as HTMLTableCellElement);

      // Find next editable cell (skip Fecha Creación which is at index 3)
      let nextCell = null;
      for (let i = currentIndex + 1; i < cells.length - 1; i++) { // -1 to skip Acciones
        if (i !== 3) { // Skip Fecha Creación column
          nextCell = cells[i];
          break;
        }
      }

      // Save and navigate
      saveEdit(nucleoId, field);

      if (nextCell) {
        setTimeout(() => {
          (nextCell as HTMLTableCellElement).click();
        }, 50);
      }
    }
  };

  const handleNuevoNucleo = async () => {
    const barrios = data?.barrios || [];

    // NUC-001: Validar que existe al menos un barrio
    if (barrios.length === 0) {
      alert('Primero debes crear al menos un barrio antes de crear núcleos.');
      return;
    }

    try {
      await createNucleo({
        variables: {
          input: {
            nombre: 'Nuevo Núcleo',
            barrioId: barrios[0].id, // Assign first barrio by default
            descripcion: null,
          },
        },
      });
    } catch (error: any) {
      console.error('Error creating nucleo:', error);
      alert(error.message || 'Error al crear el núcleo');
    }
  };

  const handleEliminar = async (nucleoId: string, nombre: string) => {
    if (confirm(`¿Eliminar el núcleo "${nombre}"?`)) {
      try {
        await deleteNucleo({
          variables: { id: nucleoId },
        });
      } catch (error) {
        console.error('Error deleting nucleo:', error);
        alert('Error al eliminar el núcleo');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Cargando núcleos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error al cargar núcleos: {error.message}</p>
      </div>
    );
  }

  const nucleos = data?.nucleos || [];
  const barrios = data?.barrios || [];

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Núcleos</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gestión de núcleos dentro de los barrios
            </p>
          </div>
          <button onClick={handleNuevoNucleo} className="btn btn-primary">
            + Nuevo Núcleo
          </button>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow p-4 flex gap-6">
          <div className="text-sm text-gray-600">
            Total de núcleos: <span className="font-semibold text-gray-900">{nucleos.length}</span>
          </div>
          <div className="text-sm text-gray-600">
            Total de barrios: <span className="font-semibold text-gray-900">{barrios.length}</span>
          </div>
        </div>

        {/* Warning if no barrios */}
        {barrios.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3 text-sm text-yellow-800">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>
                <strong>No hay barrios registrados.</strong> Necesitas crear al menos un barrio antes de crear núcleos.
              </p>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '200px' }}>
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '200px' }}>
                    Barrio
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '300px' }}>
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
                {nucleos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      {barrios.length === 0
                        ? 'Crea un barrio primero para poder crear núcleos.'
                        : 'No hay núcleos registrados. Crea uno nuevo para comenzar.'}
                    </td>
                  </tr>
                ) : (
                  nucleos.map((nucleo: any) => (
                    <tr key={nucleo.id} className="hover:bg-gray-50">
                      {/* Nombre */}
                      {editing.nucleoId === nucleo.id && editing.field === 'nombre' ? (
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editing.value}
                            onChange={(e) =>
                              setEditing({ ...editing, value: e.target.value })
                            }
                            onKeyDown={(e) => handleKeyDown(e, nucleo.id, 'nombre')}
                            onBlur={() => saveEdit(nucleo.id, 'nombre')}
                            autoFocus
                            className="input input-sm w-full"
                          />
                        </td>
                      ) : (
                        <td
                          className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm font-medium text-gray-900"
                          onClick={() => startEdit(nucleo.id, 'nombre', nucleo.nombre)}
                        >
                          {nucleo.nombre || '-'}
                        </td>
                      )}

                      {/* Barrio */}
                      {editing.nucleoId === nucleo.id && editing.field === 'barrioId' ? (
                        <td className="px-4 py-2">
                          <select
                            value={editing.value}
                            onChange={(e) =>
                              setEditing({ ...editing, value: e.target.value })
                            }
                            onKeyDown={(e) => handleKeyDown(e, nucleo.id, 'barrioId')}
                            onBlur={() => saveEdit(nucleo.id, 'barrioId')}
                            autoFocus
                            className="input input-sm w-full"
                          >
                            {barrios.map((barrio: any) => (
                              <option key={barrio.id} value={barrio.id}>
                                {barrio.nombre}
                              </option>
                            ))}
                          </select>
                        </td>
                      ) : (
                        <td
                          className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm text-gray-700"
                          onClick={() =>
                            startEdit(nucleo.id, 'barrioId', nucleo.barrioId)
                          }
                        >
                          {nucleo.barrio?.nombre || '-'}
                        </td>
                      )}

                      {/* Descripción */}
                      {editing.nucleoId === nucleo.id && editing.field === 'descripcion' ? (
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editing.value}
                            onChange={(e) =>
                              setEditing({ ...editing, value: e.target.value })
                            }
                            onKeyDown={(e) => handleKeyDown(e, nucleo.id, 'descripcion')}
                            onBlur={() => saveEdit(nucleo.id, 'descripcion')}
                            autoFocus
                            className="input input-sm w-full"
                          />
                        </td>
                      ) : (
                        <td
                          className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm text-gray-700"
                          onClick={() =>
                            startEdit(nucleo.id, 'descripcion', nucleo.descripcion)
                          }
                        >
                          {nucleo.descripcion || '-'}
                        </td>
                      )}

                      {/* Fecha Creación (NO EDITABLE) */}
                      <td className="px-4 py-2 bg-gray-50 text-sm text-gray-600">
                        {formatDate(nucleo.createdAt)}
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-2">
                        <button
                          onClick={() => handleEliminar(nucleo.id, nucleo.nombre)}
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
      </div>
  );
}
