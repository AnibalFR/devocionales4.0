import React, { useState, useRef } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { AlertTriangle, Lightbulb, CheckCircle, Info } from 'lucide-react';
import EditConflictModal from '../components/EditConflictModal';
import EditingIndicator from '../components/EditingIndicator';

const GET_FAMILIAS = gql`
  query GetFamilias {
    familias {
      id
      nombre
      direccion
      telefono
      email
      barrio
      barrioId
      nucleoId
      estatus
      notas
      createdAt
      updatedAt
      barrioRel {
        id
        nombre
      }
      nucleoRel {
        id
        nombre
      }
      miembros {
        id
        nombre
        apellidos
        rolFamiliar
        telefono
        direccion
        barrioId
        nucleoId
        tieneDevocional
      }
    }
    barrios {
      id
      nombre
    }
    nucleos {
      id
      nombre
      barrioId
    }
    miembros {
      id
      nombre
      apellidos
      familiaId
      direccion
      barrioId
      nucleoId
    }
  }
`;

const CREATE_FAMILIA = gql`
  mutation CreateFamilia($input: CreateFamiliaInput!) {
    createFamilia(input: $input) {
      id
      nombre
      direccion
      telefono
      barrio
      barrioId
      nucleoId
    }
  }
`;

const UPDATE_FAMILIA = gql`
  mutation UpdateFamilia($id: ID!, $input: UpdateFamiliaInput!) {
    updateFamilia(id: $id, input: $input) {
      id
      nombre
      direccion
      telefono
      email
      barrio
      barrioId
      nucleoId
      estatus
      notas
      updatedAt
    }
  }
`;

const UPDATE_MIEMBRO = gql`
  mutation UpdateMiembro($id: ID!, $input: UpdateMiembroInput!) {
    updateMiembro(id: $id, input: $input) {
      id
      familiaId
      direccion
      barrioId
      nucleoId
      rolFamiliar
    }
  }
`;

const DELETE_FAMILIA = gql`
  mutation DeleteFamilia($id: ID!) {
    deleteFamilia(id: $id)
  }
`;

const ROLES_FAMILIARES = ['Padre', 'Madre', 'Hijo', 'Hija', 'Abuelo', 'Abuela'];

// Función para formatear fecha
const formatDate = (dateInput: string | number | null | undefined): string => {
  if (!dateInput) return '-';

  try {
    let date: Date;

    if (typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else if (typeof dateInput === 'string' && /^\d+$/.test(dateInput)) {
      date = new Date(parseInt(dateInput, 10));
    } else {
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
    return '-';
  }
};

export function FamiliasPage() {
  const { data, loading, error, refetch } = useQuery(GET_FAMILIAS);
  const [createFamilia] = useMutation(CREATE_FAMILIA, {
    refetchQueries: [{ query: GET_FAMILIAS }],
  });
  const [updateFamilia] = useMutation(UPDATE_FAMILIA);
  const [updateMiembro] = useMutation(UPDATE_MIEMBRO);
  const [deleteFamilia] = useMutation(DELETE_FAMILIA, {
    refetchQueries: [{ query: GET_FAMILIAS }],
  });

  const [editing, setEditing] = useState<{
    familiaId: string | null;
    field: string | null;
    value: string;
    updatedAt: string | null;
  }>({ familiaId: null, field: null, value: '', updatedAt: null });

  // FASE 2: Estado para indicador visual de guardado
  const [isSaving, setIsSaving] = useState(false);

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Estados de filtros
  const [filterDevocional, setFilterDevocional] = useState<'all' | 'con-devocional' | 'sin-devocional'>('all');
  const [filterEstatus, setFilterEstatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Estado de ordenamiento
  const [sortBy, setSortBy] = useState<'nombre' | 'miembros-desc' | 'miembros-asc' | 'fecha'>('fecha');

  // Refs para navegación con Tab
  const tableRef = useRef<HTMLTableElement>(null);
  const isSavingRef = useRef(false);

  // Estado del modal con estados adicionales
  const [modal, setModal] = useState<{
    isOpen: boolean;
    familiaId: string | null;
    selectedMiembros: Set<string>;
    roles: Record<string, string>;
    selectedAddress: string;
    selectedBarrioId: string;
    selectedNucleoId: string | null;
    searchMember: string;
  }>({
    isOpen: false,
    familiaId: null,
    selectedMiembros: new Set(),
    roles: {},
    selectedAddress: '',
    selectedBarrioId: '',
    selectedNucleoId: null,
    searchMember: '',
  });

  // Estado del modal de conflictos de edición (OCC)
  const [conflictModal, setConflictModal] = useState<{
    isOpen: boolean;
    familiaId: string | null;
    field: string | null;
    pendingValue: string;
  }>({
    isOpen: false,
    familiaId: null,
    field: null,
    pendingValue: '',
  });

  const toggleRow = (familiaId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(familiaId)) {
      newExpanded.delete(familiaId);
    } else {
      newExpanded.add(familiaId);
    }
    setExpandedRows(newExpanded);
  };

  const startEdit = (familiaId: string, field: string, value: string) => {
    // OCC Fix: Capturar updatedAt al INICIAR edición, no al guardar
    const familias = data?.familias || [];
    const familia = familias.find((f: any) => f.id === familiaId);
    setEditing({
      familiaId,
      field,
      value: value || '',
      updatedAt: familia?.updatedAt || null
    });
  };

  const cancelEdit = () => {
    setEditing({ familiaId: null, field: null, value: '', updatedAt: null });
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

  const saveEdit = async (familiaId: string, field: string, moveToNext = false, currentCellIndex?: number, forceOverwrite = false) => {
    if (isSavingRef.current) return;

    isSavingRef.current = true;
    setIsSaving(true); // FASE 2: Mostrar indicador de guardado

    try {
      await updateFamilia({
        variables: {
          id: familiaId,
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
          const row = tableRef.current?.querySelector(`tr[data-familia-id="${familiaId}"]`) as HTMLTableRowElement;
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
    } catch (error: any) {
      console.error('Error updating familia:', error);

      setIsSaving(false); // FASE 2: Ocultar indicador en error

      // OCC: Detectar conflicto de edición
      if (error.graphQLErrors?.[0]?.extensions?.code === 'EDIT_CONFLICT') {
        setConflictModal({
          isOpen: true,
          familiaId,
          field,
          pendingValue: editing.value,
        });
      } else {
        alert('Error al actualizar la familia');
      }

      isSavingRef.current = false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, familiaId: string, field: string, cellElement?: HTMLTableCellElement) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit(familiaId, field);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Calcular el índice de la celda actual
      if (cellElement) {
        const row = cellElement.parentElement as HTMLTableRowElement;
        const cellIndex = Array.from(row.cells).indexOf(cellElement);
        saveEdit(familiaId, field, true, cellIndex);
      } else {
        saveEdit(familiaId, field);
      }
    }
  };

  // OCC: Handlers del modal de conflictos
  const handleConflictReload = async () => {
    await refetch();
    setConflictModal({ isOpen: false, familiaId: null, field: null, pendingValue: '' });
    cancelEdit();
  };

  const handleConflictOverwrite = async () => {
    if (!conflictModal.familiaId || !conflictModal.field) return;

    // Restaurar el valor pendiente y forzar sobrescritura
    // OCC Fix: No necesitamos updatedAt porque forceOverwrite=true lo ignora
    setEditing({
      familiaId: conflictModal.familiaId,
      field: conflictModal.field,
      value: conflictModal.pendingValue,
      updatedAt: null, // No importa en sobrescritura forzada
    });

    setConflictModal({ isOpen: false, familiaId: null, field: null, pendingValue: '' });

    // Guardar con forceOverwrite = true
    await saveEdit(conflictModal.familiaId, conflictModal.field, false, undefined, true);
  };

  const handleConflictClose = () => {
    setConflictModal({ isOpen: false, familiaId: null, field: null, pendingValue: '' });
    cancelEdit();
  };

  const handleNuevaFamilia = async () => {
    const barrios = data?.barrios || [];

    // FAM-001: Validar que existan barrios
    if (barrios.length === 0) {
      alert('Primero debes crear al menos un barrio.');
      return;
    }

    try {
      await createFamilia({
        variables: {
          input: {
            nombre: 'Nueva Familia',
            barrioId: barrios[0].id,
          },
        },
      });
    } catch (error) {
      console.error('Error creating familia:', error);
      alert('Error al crear la familia');
    }
  };

  const handleEliminar = async (familiaId: string, nombre: string) => {
    if (confirm(`¿Eliminar la familia "${nombre}"?`)) {
      try {
        await deleteFamilia({
          variables: { id: familiaId },
        });
      } catch (error) {
        console.error('Error deleting familia:', error);
        alert('Error al eliminar la familia');
      }
    }
  };

  const openLigarMiembrosModal = (familiaId: string, familia: any) => {
    // Pre-select already linked members and their roles
    const selectedMiembros = new Set<string>(familia.miembros.map((m: any) => m.id));
    const roles: Record<string, string> = {};
    familia.miembros.forEach((m: any) => {
      roles[m.id] = m.rolFamiliar || '';
    });

    // Get current familia data
    const selectedAddress = familia.direccion || '';

    // Analyze nucleos from linked members first
    const miembrosNucleos = familia.miembros
      .map((m: any) => m.nucleoId)
      .filter((id: string) => id);
    const uniqueNucleos = [...new Set(miembrosNucleos)];

    let selectedBarrioId = '';
    let selectedNucleoId: string | null = null;

    // If all members have the same nucleo, use it and get its barrio
    if (uniqueNucleos.length === 1) {
      selectedNucleoId = uniqueNucleos[0] as string;
      // Get the barrio of this nucleo from the nucleos data
      const nucleoData = data?.nucleos?.find((n: any) => n.id === selectedNucleoId);
      selectedBarrioId = (nucleoData?.barrioId as string) || familia.barrioId || '';
    } else {
      // If nucleos differ or none, analyze barrios
      const miembrosBarrios = familia.miembros
        .map((m: any) => m.barrioId)
        .filter((id: string) => id);
      const uniqueBarrios = [...new Set(miembrosBarrios)];

      selectedBarrioId = uniqueBarrios.length === 1 ? uniqueBarrios[0] : (familia.barrioId || '');
      selectedNucleoId = familia.nucleoId || null;
    }

    setModal({
      isOpen: true,
      familiaId,
      selectedMiembros,
      roles,
      selectedAddress,
      selectedBarrioId,
      selectedNucleoId,
      searchMember: '',
    });
  };

  const toggleMiembroSelection = (miembroId: string) => {
    const newSelected = new Set(modal.selectedMiembros);
    if (newSelected.has(miembroId)) {
      newSelected.delete(miembroId);
      // Remove role when deselecting
      const newRoles = { ...modal.roles };
      delete newRoles[miembroId];
      setModal({ ...modal, selectedMiembros: newSelected, roles: newRoles });
    } else {
      newSelected.add(miembroId);
      setModal({ ...modal, selectedMiembros: newSelected });
    }

    // Update address selector based on new selection
    updateAddressSelector(newSelected);
  };

  const updateAddressSelector = (selectedMiembrosSet: Set<string>) => {
    const allMiembros = data?.miembros || [];
    const selectedMiembrosData = allMiembros.filter((m: any) => selectedMiembrosSet.has(m.id));

    // FAM-003: Get unique addresses from selected members
    const addresses = selectedMiembrosData
      .map((m: any) => m.direccion)
      .filter((addr: string) => addr);
    const uniqueAddresses = [...new Set(addresses)];

    // Auto-select address if only one unique
    if (uniqueAddresses.length === 1 && !modal.selectedAddress) {
      setModal(prev => ({ ...prev, selectedAddress: uniqueAddresses[0] as string }));
    }

    // Analyze nucleos first to coordinate with barrios
    const nucleoIds = selectedMiembrosData
      .map((m: any) => m.nucleoId)
      .filter((id: string) => id);
    const uniqueNucleos = [...new Set(nucleoIds)];

    // If all selected members have the same nucleo, use it and get its barrio
    if (uniqueNucleos.length === 1) {
      const nucleoId = uniqueNucleos[0] as string;
      const nucleoData = data?.nucleos?.find((n: any) => n.id === nucleoId);
      const barrioId = (nucleoData?.barrioId as string) || '';

      setModal(prev => ({
        ...prev,
        selectedNucleoId: nucleoId,
        selectedBarrioId: barrioId
      }));
    } else {
      // If nucleos differ or none, analyze barrios independently
      const barrioIds = selectedMiembrosData
        .map((m: any) => m.barrioId)
        .filter((id: string) => id);
      const uniqueBarrios = [...new Set(barrioIds)];

      if (uniqueBarrios.length === 1) {
        // All have same barrio but different/no nucleos
        setModal(prev => ({
          ...prev,
          selectedBarrioId: uniqueBarrios[0] as string,
          selectedNucleoId: null // Clear nucleo since they differ
        }));
      }
      // If no common barrio either, keep current selection
    }
  };

  const setMiembroRol = (miembroId: string, rol: string) => {
    setModal({
      ...modal,
      roles: { ...modal.roles, [miembroId]: rol },
    });
  };

  const handleLigarMiembros = async () => {
    if (!modal.familiaId) return;

    // Validaciones
    if (!modal.selectedAddress) {
      alert('Por favor selecciona una dirección para la familia.');
      return;
    }

    if (!modal.selectedBarrioId) {
      alert('Por favor selecciona un barrio para la familia.');
      return;
    }

    if (modal.selectedMiembros.size === 0) {
      alert('Selecciona al menos un miembro para ligar a la familia.');
      return;
    }

    try {
      const familia = data?.familias.find((f: any) => f.id === modal.familiaId);

      // FAM-004: Update familia with shared data
      await updateFamilia({
        variables: {
          id: modal.familiaId,
          input: {
            direccion: modal.selectedAddress,
            barrioId: modal.selectedBarrioId,
            nucleoId: modal.selectedNucleoId,
          },
        },
      });

      // Update all selected members with familia link, role, and shared data
      for (const miembroId of modal.selectedMiembros) {
        await updateMiembro({
          variables: {
            id: miembroId,
            input: {
              familiaId: modal.familiaId,
              rolFamiliar: modal.roles[miembroId] || null,
              direccion: modal.selectedAddress,
              barrioId: modal.selectedBarrioId,
              nucleoId: modal.selectedNucleoId,
            },
          },
        });
      }

      // Unlink members that were deselected
      const previouslyLinked = familia?.miembros.map((m: any) => m.id) || [];
      const toUnlink = previouslyLinked.filter(
        (id: string) => !modal.selectedMiembros.has(id)
      );
      for (const miembroId of toUnlink) {
        await updateMiembro({
          variables: {
            id: miembroId,
            input: {
              familiaId: null,
              rolFamiliar: null,
            },
          },
        });
      }

      // Close modal and refetch
      setModal({
        isOpen: false,
        familiaId: null,
        selectedMiembros: new Set(),
        roles: {},
        selectedAddress: '',
        selectedBarrioId: '',
        selectedNucleoId: null,
        searchMember: '',
      });
      refetch();
    } catch (error: any) {
      console.error('Error linking members:', error);
      alert(error.message || 'Error al ligar miembros');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Cargando familias...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error al cargar familias: {error.message}</p>
      </div>
    );
  }

  const familias = data?.familias || [];
  const barrios = data?.barrios || [];
  const nucleos = data?.nucleos || [];
  const allMiembros = data?.miembros || [];

  // FAM-002: Filter available members (not linked to other families)
  const availableMiembros = modal.familiaId
    ? allMiembros.filter(
        (m: any) =>
          (!m.familiaId || m.familiaId === modal.familiaId) &&
          (modal.searchMember === '' ||
            m.nombre.toLowerCase().includes(modal.searchMember.toLowerCase()) ||
            m.apellidos?.toLowerCase().includes(modal.searchMember.toLowerCase()))
      )
    : [];

  // Get unique addresses from selected members for selector
  const selectedMiembrosData = allMiembros.filter((m: any) =>
    modal.selectedMiembros.has(m.id)
  );
  const uniqueAddresses = [
    ...new Set<string>(
      selectedMiembrosData
        .map((m: any) => m.direccion)
        .filter((addr: string) => addr)
    ),
  ];

  // Aplicar filtros
  let filteredFamilias = [...familias];

  // Filtro de devocional
  if (filterDevocional === 'con-devocional') {
    filteredFamilias = filteredFamilias.filter((f: any) =>
      f.miembros.some((m: any) => m.tieneDevocional)
    );
  } else if (filterDevocional === 'sin-devocional') {
    filteredFamilias = filteredFamilias.filter((f: any) =>
      !f.miembros.some((m: any) => m.tieneDevocional)
    );
  }

  // Filtro de estatus
  if (filterEstatus === 'active') {
    filteredFamilias = filteredFamilias.filter((f: any) => f.estatus === 'active');
  } else if (filterEstatus === 'inactive') {
    filteredFamilias = filteredFamilias.filter((f: any) => f.estatus === 'inactive');
  }

  // Aplicar ordenamiento
  if (sortBy === 'nombre') {
    filteredFamilias.sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));
  } else if (sortBy === 'miembros-desc') {
    filteredFamilias.sort((a: any, b: any) => b.miembros.length - a.miembros.length);
  } else if (sortBy === 'miembros-asc') {
    filteredFamilias.sort((a: any, b: any) => a.miembros.length - b.miembros.length);
  } else if (sortBy === 'fecha') {
    filteredFamilias.sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Calcular paginación
  const totalFamilias = filteredFamilias.length;
  const totalPages = Math.ceil(totalFamilias / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalFamilias);
  const paginatedFamilias = filteredFamilias.slice(startIndex, endIndex);

  // Funciones de paginación
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Familias</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gestión de familias y sus miembros
            </p>
          </div>
          <button onClick={handleNuevaFamilia} className="btn btn-primary">
            + Nueva Familia
          </button>
        </div>

        {/* Stats y Controles */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            {/* Stats */}
            <div className="flex gap-6">
              <div className="text-sm text-gray-600">
                Total de familias:{' '}
                <span className="font-semibold text-gray-900">{totalFamilias}</span>
              </div>
              <div className="text-sm text-gray-600">
                Total de barrios:{' '}
                <span className="font-semibold text-gray-900">{barrios.length}</span>
              </div>
            </div>

            {/* Filtros y Ordenamiento */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Ordenar por */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Ordenar:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="select select-sm select-bordered"
                >
                  <option value="fecha">Fecha de Registro</option>
                  <option value="nombre">Nombre (A-Z)</option>
                  <option value="miembros-desc">Más miembros primero</option>
                  <option value="miembros-asc">Menos miembros primero</option>
                </select>
              </div>

              {/* Filtro Devocional */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Devocional:</label>
                <select
                  value={filterDevocional}
                  onChange={(e) => {
                    setFilterDevocional(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="select select-sm select-bordered"
                >
                  <option value="all">Todas</option>
                  <option value="con-devocional">Con Devocional</option>
                  <option value="sin-devocional">Sin Devocional</option>
                </select>
              </div>

              {/* Filtro Estatus */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Estatus:</label>
                <select
                  value={filterEstatus}
                  onChange={(e) => {
                    setFilterEstatus(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="select select-sm select-bordered"
                >
                  <option value="all">Todas</option>
                  <option value="active">Activas</option>
                  <option value="inactive">Inactivas</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Warning if no barrios */}
        {barrios.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3 text-sm text-yellow-800">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>
                <strong>No hay barrios registrados.</strong> Necesitas crear al menos un barrio antes de crear familias.
              </p>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table ref={tableRef} className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-8"></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-64">
                    Dirección
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">
                    Teléfono
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">
                    Barrio
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">
                    Núcleo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">
                    Miembros
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">
                    Devocional
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">
                    Estatus
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">
                    Notas
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">
                    Fecha Creación
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-40">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedFamilias.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-8 text-center text-gray-500">
                      {barrios.length === 0
                        ? 'Crea un barrio primero para poder crear familias.'
                        : totalFamilias === 0
                        ? 'No hay familias registradas. Crea una nueva para comenzar.'
                        : 'No hay familias que coincidan con los filtros seleccionados.'}
                    </td>
                  </tr>
                ) : (
                  paginatedFamilias.map((familia: any) => {
                    const isExpanded = expandedRows.has(familia.id);
                    // FAM-007: Check if any member has devocional
                    const tieneDevocional = familia.miembros.some(
                      (m: any) => m.tieneDevocional
                    );

                    // Validation badges logic
                    const validationWarnings: { type: 'info' | 'warning'; message: string }[] = [];

                    // Badge azul: sin miembros ligados
                    if (familia.miembros.length === 0) {
                      validationWarnings.push({
                        type: 'info',
                        message: 'Sin miembros ligados. Agregar en: Catálogo de Familias → Miembros'
                      });
                    } else {
                      // Badge amarillo: miembros con diferentes direcciones o barrios
                      const direccionesUnicas = [...new Set(
                        familia.miembros
                          .map((m: any) => m.direccion)
                          .filter((addr: string) => addr)
                      )];
                      const barriosUnicos = [...new Set(
                        familia.miembros
                          .map((m: any) => m.barrioId)
                          .filter((b: string) => b)
                      )];

                      if (direccionesUnicas.length > 1 || barriosUnicos.length > 1) {
                        validationWarnings.push({
                          type: 'warning',
                          message: 'Miembros con diferentes direcciones/barrios. Corregir en: Catálogo de Miembros'
                        });
                      }
                    }

                    return (
                      <React.Fragment key={familia.id}>
                        {/* Main Row */}
                        <tr data-familia-id={familia.id} className="hover:bg-gray-50">
                          {/* Expand/Collapse */}
                          <td className="px-4 py-2">
                            {familia.miembros.length > 0 && (
                              <button
                                onClick={() => toggleRow(familia.id)}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                {isExpanded ? '▼' : '▶'}
                              </button>
                            )}
                          </td>

                          {/* Nombre */}
                          {editing.familiaId === familia.id && editing.field === 'nombre' ? (
                            <td className="px-4 pt-8 pb-2 bg-yellow-50 ring-2 ring-yellow-400 ring-inset relative">
                              {/* FASE 2: Indicador visual */}
                              <EditingIndicator
                                isEditing={true}
                                isSaving={isSaving}
                              />

                              <input
                                type="text"
                                value={editing.value}
                                onChange={(e) =>
                                  setEditing({ ...editing, value: e.target.value })
                                }
                                onKeyDown={(e) => {
                                  const cell = e.currentTarget.parentElement as HTMLTableCellElement;
                                  handleKeyDown(e, familia.id, 'nombre', cell);
                                }}
                                onBlur={() => saveEdit(familia.id, 'nombre')}
                                autoFocus
                                className="input input-sm w-full border-2 border-green-600"
                              />
                            </td>
                          ) : (
                            <td
                              className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm font-medium text-gray-900 editable-cell"
                              onClick={() => startEdit(familia.id, 'nombre', familia.nombre)}
                            >
                              <div className="flex items-center gap-2">
                                <span>{familia.nombre || '-'}</span>
                                {validationWarnings.map((warning, idx) => (
                                  <span
                                    key={idx}
                                    title={warning.message}
                                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full cursor-help ${
                                      warning.type === 'info'
                                        ? 'bg-cyan-100 text-cyan-600'
                                        : 'bg-yellow-100 text-yellow-600'
                                    }`}
                                  >
                                    {warning.type === 'info' ? (
                                      <Info className="w-4 h-4" />
                                    ) : (
                                      <AlertTriangle className="w-4 h-4" />
                                    )}
                                  </span>
                                ))}
                              </div>
                            </td>
                          )}

                          {/* Dirección */}
                          {editing.familiaId === familia.id &&
                          editing.field === 'direccion' ? (
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={editing.value}
                                onChange={(e) =>
                                  setEditing({ ...editing, value: e.target.value })
                                }
                                onKeyDown={(e) => {
                                  const cell = e.currentTarget.parentElement as HTMLTableCellElement;
                                  handleKeyDown(e, familia.id, 'direccion', cell);
                                }}
                                onBlur={() => saveEdit(familia.id, 'direccion')}
                                autoFocus
                                className="input input-sm w-full border-2 border-green-600"
                              />
                            </td>
                          ) : (
                            <td
                              className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm text-gray-700 editable-cell"
                              onClick={() =>
                                startEdit(familia.id, 'direccion', familia.direccion)
                              }
                            >
                              {familia.direccion || '-'}
                            </td>
                          )}

                          {/* Teléfono */}
                          {editing.familiaId === familia.id && editing.field === 'telefono' ? (
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={editing.value}
                                onChange={(e) =>
                                  setEditing({ ...editing, value: e.target.value })
                                }
                                onKeyDown={(e) => {
                                  const cell = e.currentTarget.parentElement as HTMLTableCellElement;
                                  handleKeyDown(e, familia.id, 'telefono', cell);
                                }}
                                onBlur={() => saveEdit(familia.id, 'telefono')}
                                autoFocus
                                className="input input-sm w-full border-2 border-green-600"
                              />
                            </td>
                          ) : (
                            <td
                              className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm text-gray-700 editable-cell"
                              onClick={() =>
                                startEdit(familia.id, 'telefono', familia.telefono)
                              }
                            >
                              {familia.telefono || '-'}
                            </td>
                          )}

                          {/* Barrio */}
                          {editing.familiaId === familia.id && editing.field === 'barrioId' ? (
                            <td className="px-4 py-2">
                              <select
                                value={editing.value}
                                onChange={(e) =>
                                  setEditing({ ...editing, value: e.target.value })
                                }
                                onKeyDown={(e) => {
                                  const cell = e.currentTarget.parentElement as HTMLTableCellElement;
                                  handleKeyDown(e, familia.id, 'barrioId', cell);
                                }}
                                onBlur={() => saveEdit(familia.id, 'barrioId')}
                                autoFocus
                                className="select select-sm w-full border-2 border-green-600"
                              >
                                <option value="">-</option>
                                {barrios.map((barrio: any) => (
                                  <option key={barrio.id} value={barrio.id}>
                                    {barrio.nombre}
                                  </option>
                                ))}
                              </select>
                            </td>
                          ) : (
                            <td
                              className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm text-gray-700 editable-cell"
                              onClick={() => startEdit(familia.id, 'barrioId', familia.barrioId)}
                            >
                              {familia.barrioRel?.nombre || '-'}
                            </td>
                          )}

                          {/* Núcleo */}
                          {editing.familiaId === familia.id && editing.field === 'nucleoId' ? (
                            <td className="px-4 py-2">
                              <select
                                value={editing.value || ''}
                                onChange={(e) =>
                                  setEditing({ ...editing, value: e.target.value })
                                }
                                onKeyDown={(e) => {
                                  const cell = e.currentTarget.parentElement as HTMLTableCellElement;
                                  handleKeyDown(e, familia.id, 'nucleoId', cell);
                                }}
                                onBlur={() => saveEdit(familia.id, 'nucleoId')}
                                autoFocus
                                className="select select-sm w-full border-2 border-green-600"
                              >
                                <option value="">Sin núcleo</option>
                                {nucleos
                                  .filter((n: any) => n.barrioId === familia.barrioId)
                                  .map((n: any) => (
                                    <option key={n.id} value={n.id}>
                                      {n.nombre}
                                    </option>
                                  ))}
                              </select>
                            </td>
                          ) : (
                            <td
                              className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm text-gray-700 editable-cell"
                              onClick={() => startEdit(familia.id, 'nucleoId', familia.nucleoId || '')}
                            >
                              {familia.nucleoRel?.nombre || '-'}
                            </td>
                          )}

                          {/* Miembros Count - Readonly (automático basado en miembros ligados) */}
                          <td className="px-4 py-2 text-sm text-gray-700 text-center bg-gray-50" title="Count automático de miembros ligados">
                            {familia.miembros.length}
                          </td>

                          {/* Devocional (FAM-007) */}
                          <td className="px-4 py-2 text-sm">
                            {tieneDevocional ? (
                              <span className="text-green-600 font-semibold">Sí</span>
                            ) : (
                              <span className="text-gray-400">No</span>
                            )}
                          </td>

                          {/* Estatus */}
                          {editing.familiaId === familia.id && editing.field === 'estatus' ? (
                            <td className="px-4 py-2">
                              <select
                                value={editing.value}
                                onChange={(e) =>
                                  setEditing({ ...editing, value: e.target.value })
                                }
                                onKeyDown={(e) => {
                                  const cell = e.currentTarget.parentElement as HTMLTableCellElement;
                                  handleKeyDown(e, familia.id, 'estatus', cell);
                                }}
                                onBlur={() => saveEdit(familia.id, 'estatus')}
                                autoFocus
                                className="select select-sm w-full border-2 border-green-600"
                              >
                                <option value="active">Activa</option>
                                <option value="inactive">Inactiva</option>
                              </select>
                            </td>
                          ) : (
                            <td
                              className="px-4 py-2 cursor-pointer hover:bg-gray-100 editable-cell"
                              onClick={() => startEdit(familia.id, 'estatus', familia.estatus)}
                            >
                              {familia.estatus === 'active' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Activa
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Inactiva
                                </span>
                              )}
                            </td>
                          )}

                          {/* Notas */}
                          {editing.familiaId === familia.id && editing.field === 'notas' ? (
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={editing.value}
                                onChange={(e) =>
                                  setEditing({ ...editing, value: e.target.value })
                                }
                                onKeyDown={(e) => {
                                  const cell = e.currentTarget.parentElement as HTMLTableCellElement;
                                  handleKeyDown(e, familia.id, 'notas', cell);
                                }}
                                onBlur={() => saveEdit(familia.id, 'notas')}
                                autoFocus
                                className="input input-sm w-full border-2 border-green-600"
                              />
                            </td>
                          ) : (
                            <td
                              className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm text-gray-700 truncate max-w-[200px] editable-cell"
                              onClick={() => startEdit(familia.id, 'notas', familia.notas)}
                              title={familia.notas || ''}
                            >
                              {familia.notas || '-'}
                            </td>
                          )}

                          {/* Fecha Creación (no editable) */}
                          <td
                            className="px-4 py-2 text-sm bg-gray-50 text-gray-600"
                            title="Campo automático - No se puede editar"
                          >
                            {formatDate(familia.createdAt)}
                          </td>

                          {/* Acciones */}
                          <td className="px-4 py-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openLigarMiembrosModal(familia.id, familia)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                Ligar
                              </button>
                              <button
                                onClick={() => handleEliminar(familia.id, familia.nombre)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Rows - Members (FAM-006) */}
                        {isExpanded &&
                          familia.miembros.map((miembro: any) => (
                            <tr key={`member-${miembro.id}`} className="bg-gray-50">
                              <td className="px-4 py-2"></td>
                              <td colSpan={11} className="px-4 py-2">
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="text-gray-600">↳</span>
                                  <span className="font-medium text-gray-900">
                                    {miembro.nombre} {miembro.apellidos}
                                    {miembro.rolFamiliar && (
                                      <span className="text-gray-500">
                                        {' '}
                                        ({miembro.rolFamiliar})
                                      </span>
                                    )}
                                  </span>
                                  {miembro.telefono && (
                                    <span className="text-gray-600">
                                      📞 {miembro.telefono}
                                    </span>
                                  )}
                                  {miembro.tieneDevocional && (
                                    <span className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                                      <CheckCircle className="w-3 h-3" />
                                      Devocional
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginación */}
        {totalFamilias > 0 && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              {/* Info de paginación */}
              <div className="text-sm text-gray-600">
                Mostrando {startIndex + 1} - {endIndex} de {totalFamilias} familias
              </div>

              {/* Controles de paginación */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
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
                        onClick={() => goToPage(pageNum)}
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
                  onClick={() => goToPage(currentPage + 1)}
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
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
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
              <strong>Tip:</strong> Haz clic en cualquier celda para editarla. Usa Tab para navegar entre celdas. Presiona ▶ para ver los miembros de cada familia.
            </p>
          </div>
        </div>
      </div>

      {/* Modal para Ligar Miembros (FAM-002, FAM-003, FAM-004, FAM-005) */}
      {modal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Ligar Miembros a Familia
              </h2>

              {/* Sección de Datos Compartidos (FAM-003, FAM-004) */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Datos Compartidos de la Familia
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Estos datos se aplicarán a todos los miembros ligados a la familia.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Selector de Dirección (FAM-003) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección: <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={modal.selectedAddress}
                      onChange={(e) =>
                        setModal({ ...modal, selectedAddress: e.target.value })
                      }
                      className="select select-bordered w-full select-sm"
                    >
                      <option value="">Seleccionar dirección...</option>
                      {uniqueAddresses.map((addr) => (
                        <option key={addr} value={addr}>
                          📍 {addr}
                        </option>
                      ))}
                      <option value="manual">✏️ Escribir manualmente...</option>
                    </select>
                    {modal.selectedAddress === 'manual' && (
                      <input
                        type="text"
                        placeholder="Escribe la dirección"
                        onChange={(e) =>
                          setModal({ ...modal, selectedAddress: e.target.value })
                        }
                        className="input input-bordered w-full input-sm mt-2"
                        autoFocus
                      />
                    )}
                  </div>

                  {/* Selector de Barrio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Barrio: <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={modal.selectedBarrioId}
                      onChange={(e) =>
                        setModal({
                          ...modal,
                          selectedBarrioId: e.target.value,
                          selectedNucleoId: null,
                        })
                      }
                      className="select select-bordered w-full select-sm"
                    >
                      <option value="">Seleccionar barrio...</option>
                      {barrios.map((b: any) => (
                        <option key={b.id} value={b.id}>
                          {b.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selector de Núcleo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Núcleo:
                    </label>
                    <select
                      value={modal.selectedNucleoId || ''}
                      onChange={(e) =>
                        setModal({
                          ...modal,
                          selectedNucleoId: e.target.value || null,
                        })
                      }
                      className="select select-bordered w-full select-sm"
                      disabled={!modal.selectedBarrioId}
                    >
                      <option value="">Sin núcleo</option>
                      {nucleos
                        .filter((n: any) => n.barrioId === modal.selectedBarrioId)
                        .map((n: any) => (
                          <option key={n.id} value={n.id}>
                            {n.nombre}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Buscador de Miembros */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="🔍 Buscar por nombre..."
                  value={modal.searchMember}
                  onChange={(e) => setModal({ ...modal, searchMember: e.target.value })}
                  className="input input-bordered w-full"
                />
              </div>

              {/* Member Selection */}
              <div className="space-y-2 mb-6 max-h-[400px] overflow-y-auto border border-gray-200 rounded-lg">
                {availableMiembros.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">
                    {modal.searchMember
                      ? 'No se encontraron miembros con ese nombre.'
                      : 'No hay miembros disponibles. Todos los miembros ya están ligados a otras familias.'}
                  </p>
                ) : (
                  <table className="min-w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Seleccionar
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Nombre
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Dirección Actual
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Rol Familiar
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {availableMiembros.map((miembro: any) => (
                        <tr
                          key={miembro.id}
                          className={`hover:bg-gray-50 ${
                            modal.selectedMiembros.has(miembro.id) ? 'bg-blue-50' : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={modal.selectedMiembros.has(miembro.id)}
                              onChange={() => toggleMiembroSelection(miembro.id)}
                              className="checkbox checkbox-sm"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">
                              {miembro.nombre} {miembro.apellidos}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {miembro.direccion || '-'}
                          </td>
                          <td className="px-4 py-3">
                            {/* FAM-005: Rol Familiar */}
                            {modal.selectedMiembros.has(miembro.id) && (
                              <select
                                value={modal.roles[miembro.id] || ''}
                                onChange={(e) => setMiembroRol(miembro.id, e.target.value)}
                                className="select select-sm select-bordered w-32"
                              >
                                <option value="">Sin rol</option>
                                {ROLES_FAMILIARES.map((rol) => (
                                  <option key={rol} value={rol}>
                                    {rol}
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {modal.selectedMiembros.size} miembro(s) seleccionado(s)
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      setModal({
                        isOpen: false,
                        familiaId: null,
                        selectedMiembros: new Set(),
                        roles: {},
                        selectedAddress: '',
                        selectedBarrioId: '',
                        selectedNucleoId: null,
                        searchMember: '',
                      })
                    }
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleLigarMiembros}
                    disabled={modal.selectedMiembros.size === 0}
                    className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Ligar Miembros ({modal.selectedMiembros.size})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Conflictos de Edición (OCC) */}
      <EditConflictModal
        isOpen={conflictModal.isOpen}
        onClose={handleConflictClose}
        onReload={handleConflictReload}
        onOverwrite={handleConflictOverwrite}
        entityType="familia"
        fieldName={conflictModal.field || undefined}
      />
    </>
  );
}
