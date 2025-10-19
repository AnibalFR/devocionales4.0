import { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useAuth } from '../contexts/AuthContext';
import { AlertTriangle, Lightbulb, Info, CheckCircle, Lock, Mail, XCircle } from 'lucide-react';

const MIEMBROS_QUERY = gql`
  query Miembros {
    miembros {
      id
      nombre
      apellidos
      fechaNacimiento
      edadAproximada
      edadCalculada
      fechaActualizacionEdad
      telefono
      email
      direccion
      barrioId
      nucleoId
      familiaId
      rol
      rolFamiliar
      tieneDevocional
      devocionalDia
      devocionalHora
      devocionalParticipantes
      activo
      fechaRegistro
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
      usuario {
        id
        email
        rol
        activo
      }
    }
  }
`;

const BARRIOS_QUERY = gql`
  query Barrios {
    barrios {
      id
      nombre
    }
  }
`;

const NUCLEOS_QUERY = gql`
  query Nucleos {
    nucleos {
      id
      nombre
    }
  }
`;

const CREATE_MIEMBRO = gql`
  mutation CreateMiembro($input: CreateMiembroInput!) {
    createMiembro(input: $input) {
      id
      nombre
    }
  }
`;

const UPDATE_MIEMBRO = gql`
  mutation UpdateMiembro($id: ID!, $input: UpdateMiembroInput!) {
    updateMiembro(id: $id, input: $input) {
      id
    }
  }
`;

const DELETE_MIEMBRO = gql`
  mutation DeleteMiembro($id: ID!) {
    deleteMiembro(id: $id)
  }
`;

const CREATE_USUARIO_FROM_MIEMBRO = gql`
  mutation CreateUsuarioFromMiembro($input: CreateUsuarioFromMiembroInput!) {
    createUsuarioFromMiembro(input: $input) {
      usuario {
        id
        email
        rol
      }
      passwordTemporal
    }
  }
`;

const REGENERAR_CREDENCIALES = gql`
  mutation RegenerarCredenciales($input: RegenerarCredencialesInput!) {
    regenerarCredenciales(input: $input) {
      usuario {
        id
        email
        rol
      }
      passwordTemporal
    }
  }
`;

const ROLES = ['CEA', 'COLABORADOR', 'MIEMBRO'];
const ROLES_FAMILIARES = ['Padre', 'Madre', 'Hijo', 'Hija', 'Abuelo', 'Abuela', 'Otro'];

interface EditingState {
  miembroId: string | null;
  field: string | null;
  value: any;
}

// Helper para formatear fechas
const formatDate = (dateInput: string | number | null | undefined): string => {
  if (!dateInput) return '-';
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'America/Mexico_City'
    });
  } catch {
    return '-';
  }
};

// Helper para formatear fecha ISO a input date (YYYY-MM-DD)
const formatDateToInput = (dateInput: string | null | undefined): string => {
  if (!dateInput) return '';
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

export function MiembrosPage() {
  const { user } = useAuth();
  const [editing, setEditing] = useState<EditingState>({
    miembroId: null,
    field: null,
    value: null,
  });

  const [filtroFamilia, setFiltroFamilia] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState('');
  const [ordenamiento, setOrdenamiento] = useState('fecha');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modal de invitación
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invitingMiembro, setInvitingMiembro] = useState<any>(null);
  const [isRegenerar, setIsRegenerar] = useState(false); // true = regenerar, false = crear nuevo
  const [selectedRol, setSelectedRol] = useState<'CEA' | 'COLABORADOR' | 'VISITANTE'>('COLABORADOR');
  const [credencialesGeneradas, setCredencialesGeneradas] = useState<{ email: string; password: string; rol: string } | null>(null);

  const tableRef = useRef<HTMLTableElement>(null);

  const { data, loading, error, refetch } = useQuery(MIEMBROS_QUERY);
  const { data: barriosData } = useQuery(BARRIOS_QUERY);
  const { data: nucleosData } = useQuery(NUCLEOS_QUERY);

  const [createMiembro] = useMutation(CREATE_MIEMBRO);
  const [updateMiembro] = useMutation(UPDATE_MIEMBRO);
  const [deleteMiembro] = useMutation(DELETE_MIEMBRO);
  const [createUsuarioFromMiembro] = useMutation(CREATE_USUARIO_FROM_MIEMBRO);
  const [regenerarCredenciales] = useMutation(REGENERAR_CREDENCIALES);

  const miembros = data?.miembros || [];
  const barrios = barriosData?.barrios || [];
  const nucleos = nucleosData?.nucleos || [];

  // MEM-001: Validación de barrios al crear nuevo miembro
  const handleNuevoMiembro = async () => {
    if (barrios.length === 0) {
      alert('Primero debes crear al menos un barrio.\n\nVe al Catálogo de Barrios y crea un barrio antes de agregar miembros.');
      return;
    }

    try {
      await createMiembro({
        variables: {
          input: {
            nombre: 'Nuevo Miembro',
            rol: 'MIEMBRO',
            barrioId: barrios[0].id, // MEM-001: Asignar primer barrio automáticamente
            tieneDevocional: false,
          },
        },
      });
      refetch();
    } catch (err: any) {
      alert(`Error al crear miembro: ${err.message}`);
    }
  };

  // Filtrado y ordenamiento
  const miembrosFiltrados = useMemo(() => {
    let resultado = [...miembros];

    // Filtrar por familia
    if (filtroFamilia) {
      resultado = resultado.filter((m: any) =>
        m.familia?.nombre.toLowerCase().includes(filtroFamilia.toLowerCase())
      );
    }

    // Filtrar por rol
    if (filtroRol) {
      resultado = resultado.filter((m: any) => m.rol === filtroRol);
    }

    // Filtrar por estatus
    if (filtroEstatus === 'activo') {
      resultado = resultado.filter((m: any) => m.activo === true);
    } else if (filtroEstatus === 'inactivo') {
      resultado = resultado.filter((m: any) => m.activo === false);
    }

    // Ordenar según MEM-002: por defecto fecha (más recientes primero)
    if (ordenamiento === 'fecha') {
      resultado.sort((a: any, b: any) => {
        const fechaA = new Date(a.fechaRegistro).getTime();
        const fechaB = new Date(b.fechaRegistro).getTime();
        return fechaB - fechaA;
      });
    } else if (ordenamiento === 'nombre') {
      resultado.sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));
    } else if (ordenamiento === 'edad') {
      resultado.sort((a: any, b: any) => (b.edadCalculada || 0) - (a.edadCalculada || 0));
    } else if (ordenamiento === 'rol') {
      resultado.sort((a: any, b: any) => a.rol.localeCompare(b.rol));
    }

    return resultado;
  }, [miembros, filtroFamilia, filtroRol, filtroEstatus, ordenamiento]);

  // Paginación
  const totalPages = Math.ceil(miembrosFiltrados.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, miembrosFiltrados.length);
  const miembrosPaginados = miembrosFiltrados.slice(startIndex, endIndex);

  // Funciones de navegación con Tab
  const findNextEditableCell = (currentCell: HTMLTableCellElement): HTMLTableCellElement | null => {
    const row = currentCell.parentElement as HTMLTableRowElement;
    if (!row) return null;

    const cells = Array.from(row.cells);
    const currentIndex = cells.indexOf(currentCell);

    // Buscar siguiente celda editable en la misma fila
    for (let i = currentIndex + 1; i < cells.length; i++) {
      const cell = cells[i];
      if (cell.onclick || cell.querySelector('input[type="checkbox"]')) {
        return cell as HTMLTableCellElement;
      }
    }

    return null;
  };

  const startEdit = (miembroId: string, field: string, currentValue: any) => {
    setEditing({ miembroId, field, value: currentValue });
  };

  const cancelEdit = () => {
    setEditing({ miembroId: null, field: null, value: null });
  };

  const saveEdit = async (miembroId: string, moveToNext = false, currentCellElement?: HTMLTableCellElement) => {
    if (!editing.field) return;

    try {
      const input: any = {};

      // Si se está editando edad aproximada, guardar también fecha de actualización
      if (editing.field === 'edadAproximada') {
        input.edadAproximada = parseInt(editing.value);
      } else {
        input[editing.field] = editing.value || null;
      }

      await updateMiembro({
        variables: { id: miembroId, input },
      });

      await refetch();
      cancelEdit();

      // Si se presionó Tab, mover a la siguiente celda
      if (moveToNext && currentCellElement) {
        setTimeout(() => {
          const nextCell = findNextEditableCell(currentCellElement);
          if (nextCell) {
            nextCell.click();
          }
        }, 50);
      }
    } catch (err: any) {
      alert(`Error al actualizar: ${err.message}`);
      cancelEdit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, miembroId: string, cellElement?: HTMLTableCellElement) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit(miembroId, false);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      saveEdit(miembroId, true, cellElement);
    }
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar miembro "${nombre}"?\n\nEsta acción no se puede deshacer.`)) return;

    try {
      await deleteMiembro({ variables: { id } });
      refetch();
    } catch (err: any) {
      alert(`Error al eliminar: ${err.message}`);
    }
  };

  const handleInvitar = (miembro: any) => {
    // Validar que el miembro tenga email
    if (!miembro.email) {
      alert('Este miembro no tiene un email.\n\nAgrega un email antes de enviar la invitación.');
      return;
    }

    setInvitingMiembro(miembro);
    setIsRegenerar(false); // Crear nuevo usuario
    setSelectedRol('COLABORADOR');
    setCredencialesGeneradas(null);
    setShowInviteModal(true);
  };

  const handleRegenerar = (miembro: any) => {
    setInvitingMiembro(miembro);
    setIsRegenerar(true); // Regenerar credenciales
    setCredencialesGeneradas(null);
    setShowInviteModal(true);
  };

  const handleConfirmInvitar = async () => {
    if (!invitingMiembro) return;

    try {
      if (isRegenerar) {
        // Regenerar credenciales para usuario existente
        const { data } = await regenerarCredenciales({
          variables: {
            input: {
              miembroId: invitingMiembro.id,
            },
          },
        });

        setCredencialesGeneradas({
          email: data.regenerarCredenciales.usuario.email,
          password: data.regenerarCredenciales.passwordTemporal,
          rol: data.regenerarCredenciales.usuario.rol,
        });
      } else {
        // Crear nuevo usuario
        const { data } = await createUsuarioFromMiembro({
          variables: {
            input: {
              miembroId: invitingMiembro.id,
              rol: selectedRol,
            },
          },
        });

        setCredencialesGeneradas({
          email: data.createUsuarioFromMiembro.usuario.email,
          password: data.createUsuarioFromMiembro.passwordTemporal,
          rol: data.createUsuarioFromMiembro.usuario.rol,
        });
      }

      await refetch();
    } catch (err: any) {
      alert(`Error al ${isRegenerar ? 'regenerar credenciales' : 'crear usuario'}: ${err.message}`);
      setShowInviteModal(false);
    }
  };

  const handleCerrarModal = () => {
    setShowInviteModal(false);
    setInvitingMiembro(null);
    setCredencialesGeneradas(null);
  };

  // Renderizado de edad según MEM-003
  const renderEdad = (miembro: any, cellRef?: (el: HTMLTableCellElement | null) => void) => {
    // Si tiene fecha de nacimiento, edad no es editable
    if (miembro.fechaNacimiento) {
      return (
        <td className="px-4 py-2 bg-gray-50 text-gray-900 text-sm" title="Edad calculada desde fecha de nacimiento (no editable)">
          {miembro.edadCalculada || '-'}
        </td>
      );
    }

    // Si no tiene fecha de nacimiento, es editable
    if (editing.miembroId === miembro.id && editing.field === 'edadAproximada') {
      return (
        <td className="px-4 py-2" ref={cellRef}>
          <input
            type="number"
            min="0"
            max="120"
            value={editing.value || ''}
            onChange={(e) => setEditing({ ...editing, value: e.target.value })}
            onKeyDown={(e) => {
              const cell = e.currentTarget.parentElement as HTMLTableCellElement;
              handleKeyDown(e, miembro.id, cell);
            }}
            onBlur={() => saveEdit(miembro.id)}
            className="w-full border border-primary-500 rounded px-2 py-1 text-sm"
            autoFocus
          />
        </td>
      );
    }

    const tooltipText = miembro.edadAproximada
      ? `Edad aproximada: ${miembro.edadAproximada} (actualizada ${miembro.fechaActualizacionEdad || 'nunca'})\nEdad calculada actual: ${miembro.edadCalculada || 0}`
      : 'Click para ingresar edad aproximada';

    return (
      <td
        ref={cellRef}
        className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm"
        onClick={() => startEdit(miembro.id, 'edadAproximada', miembro.edadAproximada || '')}
        title={tooltipText}
      >
        {miembro.edadCalculada || '-'}
      </td>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="mt-2 text-gray-600">Cargando miembros...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-red-50 border-red-200">
        <p className="text-red-700">Error al cargar miembros: {error.message}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Catálogo de Miembros</h1>
          <p className="text-gray-600 mt-2">
            Gestión completa de miembros con edición inline tipo Excel
          </p>
        </div>
        <button
          onClick={handleNuevoMiembro}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Nuevo Miembro</span>
        </button>
      </div>

      {/* Estadísticas */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Total de miembros: <span className="font-semibold text-gray-900">{miembrosFiltrados.length}</span>
          </div>
          {miembrosFiltrados.length > pageSize && (
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1} - {endIndex} de {miembrosFiltrados.length}
            </div>
          )}
        </div>
      </div>

      {/* Filtros y Ordenamiento */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ordenar por</label>
            <select
              value={ordenamiento}
              onChange={(e) => setOrdenamiento(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="fecha">Fecha de Registro</option>
              <option value="nombre">Nombre (A-Z)</option>
              <option value="rol">Rol</option>
              <option value="edad">Edad (mayor a menor)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Rol</label>
            <select
              value={filtroRol}
              onChange={(e) => {
                setFiltroRol(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              {ROLES.map(rol => (
                <option key={rol} value={rol}>{rol}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Estatus</label>
            <select
              value={filtroEstatus}
              onChange={(e) => {
                setFiltroEstatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar Familia</label>
            <input
              type="text"
              value={filtroFamilia}
              onChange={(e) => {
                setFiltroFamilia(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Nombre de familia..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Tabla */}
      {miembrosFiltrados.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600">No hay miembros registrados</p>
        </div>
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table ref={tableRef} className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ minWidth: '150px' }}>Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ minWidth: '150px' }}>Apellidos</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ minWidth: '130px' }}>Fecha Nac.</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ minWidth: '60px' }}>Edad</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ minWidth: '180px' }}>Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ minWidth: '110px' }}>Teléfono</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ minWidth: '200px' }}>Dirección</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ minWidth: '100px' }}>Rol</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ minWidth: '130px' }}>Estado de Cuenta</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ minWidth: '120px' }}>Barrio</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ minWidth: '120px' }}>Núcleo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ minWidth: '150px' }}>Familia</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ minWidth: '100px' }}>Rol Familiar</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ minWidth: '90px' }}>Devocional</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ minWidth: '90px' }}>Estatus</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ minWidth: '120px' }}>Fecha Registro</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ minWidth: '100px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {miembrosPaginados.map((miembro: any) => (
                  <tr key={miembro.id} className="hover:bg-gray-50">
                    {/* Nombre - Editable con badges de validación */}
                    <td className="px-4 py-2">
                      {editing.miembroId === miembro.id && editing.field === 'nombre' ? (
                        <input
                          type="text"
                          value={editing.value}
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          onKeyDown={(e) => {
                            const cell = e.currentTarget.parentElement as HTMLTableCellElement;
                            handleKeyDown(e, miembro.id, cell);
                          }}
                          onBlur={() => saveEdit(miembro.id)}
                          className="w-full border border-primary-500 rounded px-2 py-1 text-sm"
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span
                            className="cursor-pointer hover:underline text-sm"
                            onClick={() => startEdit(miembro.id, 'nombre', miembro.nombre)}
                          >
                            {miembro.nombre}
                          </span>
                          {/* Badge amarillo: sin familia asignada */}
                          {!miembro.familiaId && (
                            <span
                              title="Sin familia asignada. Ligar en: Catálogo de Familias"
                              className="inline-flex items-center justify-center w-6 h-6 rounded-full cursor-help bg-yellow-100 text-yellow-600"
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </span>
                          )}
                          {/* Badge gris: miembro inactivo */}
                          {miembro.activo === false && (
                            <span
                              title="Miembro inactivo. Cambiar estatus en: Catálogo de Miembros"
                              className="inline-flex items-center justify-center w-6 h-6 rounded-full cursor-help bg-gray-200 text-gray-600"
                            >
                              <XCircle className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Apellidos - Editable */}
                    <td className="px-4 py-2">
                      {editing.miembroId === miembro.id && editing.field === 'apellidos' ? (
                        <input
                          type="text"
                          value={editing.value || ''}
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          onKeyDown={(e) => {
                            const cell = e.currentTarget.parentElement as HTMLTableCellElement;
                            handleKeyDown(e, miembro.id, cell);
                          }}
                          onBlur={() => saveEdit(miembro.id)}
                          className="w-full border border-primary-500 rounded px-2 py-1 text-sm"
                          autoFocus
                        />
                      ) : (
                        <span
                          className="cursor-pointer hover:underline text-sm"
                          onClick={() => startEdit(miembro.id, 'apellidos', miembro.apellidos)}
                        >
                          {miembro.apellidos || '-'}
                        </span>
                      )}
                    </td>

                    {/* Fecha Nacimiento - Editable */}
                    <td className="px-4 py-2">
                      {editing.miembroId === miembro.id && editing.field === 'fechaNacimiento' ? (
                        <input
                          type="date"
                          value={editing.value || ''}
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          onKeyDown={(e) => {
                            const cell = e.currentTarget.parentElement as HTMLTableCellElement;
                            handleKeyDown(e, miembro.id, cell);
                          }}
                          onBlur={() => saveEdit(miembro.id)}
                          className="w-full border border-primary-500 rounded px-2 py-1 text-sm"
                          autoFocus
                        />
                      ) : (
                        <span
                          className="cursor-pointer hover:underline text-sm"
                          onClick={() => startEdit(miembro.id, 'fechaNacimiento', formatDateToInput(miembro.fechaNacimiento))}
                        >
                          {formatDate(miembro.fechaNacimiento)}
                        </span>
                      )}
                    </td>

                    {/* Edad - MEM-003 Sistema dual */}
                    {renderEdad(miembro)}

                    {/* Email - Editable */}
                    <td className="px-4 py-2">
                      {editing.miembroId === miembro.id && editing.field === 'email' ? (
                        <input
                          type="email"
                          value={editing.value || ''}
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          onKeyDown={(e) => {
                            const cell = e.currentTarget.parentElement as HTMLTableCellElement;
                            handleKeyDown(e, miembro.id, cell);
                          }}
                          onBlur={() => saveEdit(miembro.id)}
                          className="w-full border border-primary-500 rounded px-2 py-1 text-sm"
                          autoFocus
                        />
                      ) : (
                        <span
                          className="cursor-pointer hover:underline text-sm"
                          onClick={() => startEdit(miembro.id, 'email', miembro.email)}
                        >
                          {miembro.email || '-'}
                        </span>
                      )}
                    </td>

                    {/* Teléfono - Editable */}
                    <td className="px-4 py-2">
                      {editing.miembroId === miembro.id && editing.field === 'telefono' ? (
                        <input
                          type="tel"
                          value={editing.value || ''}
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          onKeyDown={(e) => {
                            const cell = e.currentTarget.parentElement as HTMLTableCellElement;
                            handleKeyDown(e, miembro.id, cell);
                          }}
                          onBlur={() => saveEdit(miembro.id)}
                          className="w-full border border-primary-500 rounded px-2 py-1 text-sm"
                          autoFocus
                        />
                      ) : (
                        <span
                          className="cursor-pointer hover:underline text-sm"
                          onClick={() => startEdit(miembro.id, 'telefono', miembro.telefono)}
                        >
                          {miembro.telefono || '-'}
                        </span>
                      )}
                    </td>

                    {/* Dirección - Editable */}
                    <td className="px-4 py-2">
                      {editing.miembroId === miembro.id && editing.field === 'direccion' ? (
                        <input
                          type="text"
                          value={editing.value || ''}
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          onKeyDown={(e) => {
                            const cell = e.currentTarget.parentElement as HTMLTableCellElement;
                            handleKeyDown(e, miembro.id, cell);
                          }}
                          onBlur={() => saveEdit(miembro.id)}
                          className="w-full border border-primary-500 rounded px-2 py-1 text-sm"
                          autoFocus
                        />
                      ) : (
                        <span
                          className="cursor-pointer hover:underline text-sm"
                          onClick={() => startEdit(miembro.id, 'direccion', miembro.direccion)}
                        >
                          {miembro.direccion || '-'}
                        </span>
                      )}
                    </td>

                    {/* Rol - MEM-005 Dropdown */}
                    <td className="px-4 py-2">
                      {editing.miembroId === miembro.id && editing.field === 'rol' ? (
                        <select
                          value={editing.value}
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          onBlur={() => saveEdit(miembro.id)}
                          onKeyDown={(e) => {
                            const cell = e.currentTarget.parentElement as HTMLTableCellElement;
                            handleKeyDown(e, miembro.id, cell);
                          }}
                          className="w-full border border-primary-500 rounded px-2 py-1 text-sm"
                          autoFocus
                        >
                          {ROLES.map(rol => (
                            <option key={rol} value={rol}>{rol}</option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className="cursor-pointer hover:underline text-sm"
                          onClick={() => startEdit(miembro.id, 'rol', miembro.rol)}
                        >
                          {miembro.rol}
                        </span>
                      )}
                    </td>

                    {/* Estado de Cuenta */}
                    <td className="px-4 py-2">
                      {miembro.usuario ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          {miembro.usuario.rol}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                          Sin acceso
                        </span>
                      )}
                    </td>

                    {/* Barrio - readonly */}
                    <td className="px-4 py-2 bg-gray-50 text-gray-600 text-sm" title="Sincronizado con familia">
                      {miembro.barrio?.nombre || '-'}
                    </td>

                    {/* Núcleo - Editable Dropdown */}
                    <td className="px-4 py-2">
                      {editing.miembroId === miembro.id && editing.field === 'nucleoId' ? (
                        <select
                          value={editing.value || ''}
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          onBlur={() => saveEdit(miembro.id)}
                          onKeyDown={(e) => {
                            const cell = e.currentTarget.parentElement as HTMLTableCellElement;
                            handleKeyDown(e, miembro.id, cell);
                          }}
                          className="w-full border border-primary-500 rounded px-2 py-1 text-sm"
                          autoFocus
                        >
                          <option value="">-</option>
                          {nucleos.map((n: any) => (
                            <option key={n.id} value={n.id}>{n.nombre}</option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className="cursor-pointer hover:underline text-sm"
                          onClick={() => startEdit(miembro.id, 'nucleoId', miembro.nucleoId)}
                        >
                          {miembro.nucleo?.nombre || '-'}
                        </span>
                      )}
                    </td>

                    {/* Familia - MEM-004 readonly */}
                    <td className="px-4 py-2 bg-gray-50 text-gray-600 text-sm" title="Editar en: Catálogo de Familias">
                      {miembro.familia?.nombre || 'N/A'}
                    </td>

                    {/* Rol Familiar - Dropdown */}
                    <td className="px-4 py-2">
                      {editing.miembroId === miembro.id && editing.field === 'rolFamiliar' ? (
                        <select
                          value={editing.value || ''}
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          onBlur={() => saveEdit(miembro.id)}
                          onKeyDown={(e) => {
                            const cell = e.currentTarget.parentElement as HTMLTableCellElement;
                            handleKeyDown(e, miembro.id, cell);
                          }}
                          className="w-full border border-primary-500 rounded px-2 py-1 text-sm"
                          autoFocus
                        >
                          <option value="">Ninguno</option>
                          {ROLES_FAMILIARES.map(rol => (
                            <option key={rol} value={rol}>{rol}</option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className="cursor-pointer hover:underline text-sm"
                          onClick={() => startEdit(miembro.id, 'rolFamiliar', miembro.rolFamiliar)}
                        >
                          {miembro.rolFamiliar || '-'}
                        </span>
                      )}
                    </td>

                    {/* Devocional - MEM-006 Checkbox */}
                    <td className="px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={miembro.tieneDevocional}
                        onChange={async (e) => {
                          try {
                            await updateMiembro({
                              variables: {
                                id: miembro.id,
                                input: { tieneDevocional: e.target.checked },
                              },
                            });
                            refetch();
                          } catch (err: any) {
                            alert(`Error: ${err.message}`);
                          }
                        }}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        title={miembro.tieneDevocional ? 'Quitar devocional' : 'Marcar como anfitrión de devocional'}
                      />
                    </td>

                    {/* Estatus - Editable */}
                    <td className="px-4 py-2">
                      {editing.miembroId === miembro.id && editing.field === 'activo' ? (
                        <select
                          value={editing.value ? 'true' : 'false'}
                          onChange={(e) => setEditing({ ...editing, value: e.target.value === 'true' })}
                          onBlur={() => saveEdit(miembro.id)}
                          onKeyDown={(e) => {
                            const cell = e.currentTarget.parentElement as HTMLTableCellElement;
                            handleKeyDown(e, miembro.id, cell);
                          }}
                          className="w-full border border-primary-500 rounded px-2 py-1 text-sm"
                          autoFocus
                        >
                          <option value="true">Activo</option>
                          <option value="false">Inactivo</option>
                        </select>
                      ) : (
                        <span
                          className="cursor-pointer hover:underline text-sm"
                          onClick={() => startEdit(miembro.id, 'activo', miembro.activo)}
                        >
                          {miembro.activo ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Inactivo
                            </span>
                          )}
                        </span>
                      )}
                    </td>

                    {/* Fecha Registro - Readonly */}
                    <td className="px-4 py-2 bg-gray-50 text-gray-600 text-sm" title="Campo automático - No se puede editar">
                      {formatDate(miembro.fechaRegistro)}
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        {/* Botón Invitar / Reenviar - Solo visible para CEA y COLABORADOR */}
                        {(user?.rol === 'CEA' || user?.rol === 'COLABORADOR') && (
                          <>
                            {!miembro.usuario ? (
                              // Botón "Invitar" cuando no tiene usuario
                              <button
                                onClick={() => handleInvitar(miembro)}
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                                title="Enviar invitación"
                              >
                                <Mail className="w-4 h-4" />
                                Invitar
                              </button>
                            ) : (
                              // Botón "Reenviar" cuando ya tiene usuario
                              <button
                                onClick={() => handleRegenerar(miembro)}
                                className="flex items-center gap-1 text-green-600 hover:text-green-800 text-sm font-medium"
                                title="Regenerar credenciales y reenviar invitación"
                              >
                                <Mail className="w-4 h-4" />
                                Reenviar
                              </button>
                            )}
                          </>
                        )}

                        {/* Botón Eliminar */}
                        <button
                          onClick={() => handleDelete(miembro.id, miembro.nombre)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                          title="Eliminar miembro"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="card mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">Por página:</label>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    ← Anterior
                  </button>

                  <div className="flex items-center space-x-1">
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
                          className={`px-3 py-1 border rounded text-sm ${
                            currentPage === pageNum
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'border-gray-300 hover:bg-gray-50'
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
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Siguiente →
                  </button>
                </div>

                <div className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Help text */}
      <div className="card mt-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3 text-sm text-blue-800">
          <Lightbulb className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>
            <strong>Tip:</strong> Haz clic en cualquier celda para editarla. Presiona <kbd className="px-1 py-0.5 bg-white border border-blue-300 rounded text-xs">Enter</kbd> para guardar, <kbd className="px-1 py-0.5 bg-white border border-blue-300 rounded text-xs">Tab</kbd> para ir a la siguiente celda, o <kbd className="px-1 py-0.5 bg-white border border-blue-300 rounded text-xs">Escape</kbd> para cancelar.
          </p>
        </div>
      </div>

      {/* Modal de Invitación */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            {credencialesGeneradas ? (
              // Vista de credenciales generadas
              <>
                <div className="text-center mb-6">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {isRegenerar ? '¡Credenciales Regeneradas!' : '¡Usuario Creado Exitosamente!'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-2">
                    {isRegenerar
                      ? `Se han regenerado las credenciales para ${invitingMiembro?.nombre}`
                      : `Se ha creado la cuenta para ${invitingMiembro?.nombre}`
                    }
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <p className="text-sm font-semibold text-yellow-800">Guarda estas credenciales</p>
                  </div>
                  <p className="text-xs text-yellow-700 mb-3">Esta es la única vez que verás la contraseña. Cópiala y envíala al usuario de forma segura.</p>

                  <div className="space-y-2 bg-white rounded p-3 border border-yellow-300">
                    <div>
                      <label className="text-xs font-medium text-gray-600">Email:</label>
                      <p className="text-sm font-mono text-gray-900">{credencialesGeneradas.email}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">Contraseña temporal:</label>
                      <p className="text-sm font-mono text-gray-900 bg-gray-50 p-2 rounded border break-all">{credencialesGeneradas.password}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">Rol:</label>
                      <p className="text-sm font-semibold text-gray-900">{credencialesGeneradas.rol}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                  <div className="flex items-start gap-2 text-xs text-blue-800">
                    <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>
                      <strong>Próximos pasos:</strong> Envía estas credenciales al usuario por email o mensaje seguro. El usuario podrá cambiar su contraseña en el primer inicio de sesión.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleCerrarModal}
                  className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  Cerrar
                </button>
              </>
            ) : (
              // Vista de selección de rol (solo para nuevos usuarios) o confirmación (para regenerar)
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {isRegenerar ? 'Regenerar Credenciales' : 'Enviar Invitación'}
                </h3>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    {isRegenerar
                      ? 'Vas a regenerar la contraseña para:'
                      : 'Vas a crear una cuenta de acceso para:'
                    }
                  </p>
                  <div className="bg-gray-50 rounded p-3 border border-gray-200">
                    <p className="font-semibold text-gray-900">{invitingMiembro?.nombre} {invitingMiembro?.apellidos}</p>
                    <p className="text-sm text-gray-600">{invitingMiembro?.email}</p>
                    {isRegenerar && invitingMiembro?.usuario && (
                      <p className="text-xs text-gray-500 mt-1">
                        Rol actual: <span className="font-semibold">{invitingMiembro.usuario.rol}</span>
                      </p>
                    )}
                  </div>
                </div>

                {isRegenerar && (
                  <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2 text-xs text-blue-800">
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p>
                        Se generará una nueva contraseña temporal. El usuario deberá cambiarla en su primer inicio de sesión.
                      </p>
                    </div>
                  </div>
                )}

                {!isRegenerar && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selecciona el rol de acceso:
                    </label>
                    <select
                      value={selectedRol}
                      onChange={(e) => setSelectedRol(e.target.value as any)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="CEA">CEA (Administrador total)</option>
                      <option value="COLABORADOR">COLABORADOR (Puede crear y editar)</option>
                      <option value="VISITANTE">VISITANTE (Solo lectura)</option>
                    </select>
                    <div className="flex items-start gap-1.5 text-xs text-gray-500 mt-1">
                      <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <p>
                        {selectedRol === 'CEA' && 'Acceso completo a todas las funciones'}
                        {selectedRol === 'COLABORADOR' && 'Puede crear, editar y enviar invitaciones'}
                        {selectedRol === 'VISITANTE' && 'Solo puede ver información, sin editar'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleCerrarModal}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmInvitar}
                    className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors font-medium"
                  >
                    {isRegenerar ? 'Regenerar Contraseña' : 'Crear Usuario'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
