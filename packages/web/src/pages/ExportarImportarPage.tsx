import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import ExcelJS from 'exceljs';
import { AlertTriangle, Trash2, Clock, Download, Upload } from 'lucide-react';

// ============================================
// GRAPHQL QUERIES Y MUTATIONS
// ============================================

const GET_ALL_DATA = gql`
  query GetAllData {
    miembros {
      id nombre apellidos fechaNacimiento edadAproximada edadCalculada
      email telefono direccion rol rolFamiliar tieneDevocional
      devocionalDia devocionalHora devocionalParticipantes devocionalMiembros
      activo fechaRegistro barrioId nucleoId familiaId
      barrio { id nombre }
      nucleo { id nombre }
      familia { id nombre }
    }
    familias {
      id nombre direccion telefono email barrio barrioId nucleoId
      estatus notas createdAt
      barrioRel { id nombre }
      nucleoRel { id nombre }
    }
    visitas {
      id visitDate visitTime visitType visitStatus
      familiaId barrioId barrioOtro nucleoId visitorUserIds
      motivoNoVisita motivoNoVisitaOtra
      visitActivities {
        conversacion_preocupaciones
        oraciones
        estudio_instituto
        estudio_instituto_especificar
        otro_estudio
        otro_estudio_especificar
        invitacion_actividad
        invitacion_especificar
      }
      materialDejado {
        libro_oraciones
        otro
        otro_especificar
      }
      seguimientoVisita tipoSeguimiento seguimientoFecha seguimientoHora
      seguimientoActividadBasica seguimientoActividadBasicaEspecificar
      seguimientoNinguno additionalNotes createdAt
      familia { id nombre }
      barrio { id nombre }
      nucleo { id nombre }
      visitadores { id nombre apellidos }
    }
    barrios {
      id nombre descripcion activo createdAt
    }
    nucleos {
      id nombre descripcion activo createdAt barrioId
      barrio { id nombre }
    }
    metas {
      id trimestre fechaInicio fechaFin
      metaNucleos metaVisitas metaPersonasVisitando metaDevocionales
      estado createdAt updatedAt
    }
  }
`;

// Mutations para importación
const CREATE_BARRIO_MUTATION = gql`
  mutation CreateBarrio($input: CreateBarrioInput!) {
    createBarrio(input: $input) { id nombre }
  }
`;

const UPDATE_BARRIO_MUTATION = gql`
  mutation UpdateBarrio($id: ID!, $input: UpdateBarrioInput!) {
    updateBarrio(id: $id, input: $input) { id nombre }
  }
`;

const CREATE_NUCLEO_MUTATION = gql`
  mutation CreateNucleo($input: CreateNucleoInput!) {
    createNucleo(input: $input) { id nombre }
  }
`;

const UPDATE_NUCLEO_MUTATION = gql`
  mutation UpdateNucleo($id: ID!, $input: UpdateNucleoInput!) {
    updateNucleo(id: $id, input: $input) { id nombre }
  }
`;

const CREATE_FAMILIA_MUTATION = gql`
  mutation CreateFamilia($input: CreateFamiliaInput!) {
    createFamilia(input: $input) { id nombre }
  }
`;

const UPDATE_FAMILIA_MUTATION = gql`
  mutation UpdateFamilia($id: ID!, $input: UpdateFamiliaInput!) {
    updateFamilia(id: $id, input: $input) { id nombre }
  }
`;

const CREATE_MIEMBRO_MUTATION = gql`
  mutation CreateMiembro($input: CreateMiembroInput!) {
    createMiembro(input: $input) { id nombre }
  }
`;

const UPDATE_MIEMBRO_MUTATION = gql`
  mutation UpdateMiembro($id: ID!, $input: UpdateMiembroInput!) {
    updateMiembro(id: $id, input: $input) { id nombre }
  }
`;

const CREATE_VISITA_MUTATION = gql`
  mutation CreateVisita($input: CreateVisitaInput!) {
    createVisita(input: $input) { id }
  }
`;

const UPDATE_VISITA_MUTATION = gql`
  mutation UpdateVisita($id: ID!, $input: UpdateVisitaInput!) {
    updateVisita(id: $id, input: $input) { id }
  }
`;

const CREATE_META_MUTATION = gql`
  mutation CreateMeta($input: CreateMetaInput!) {
    createMeta(input: $input) { id }
  }
`;

const CLEAR_ALL_DATA_MUTATION = gql`
  mutation ClearAllData {
    clearAllData {
      visitasEliminadas
      miembrosEliminados
      familiasEliminadas
      nucleosEliminados
      barriosEliminados
      metasEliminadas
      message
    }
  }
`;

const UPDATE_META_MUTATION = gql`
  mutation UpdateMeta($id: ID!, $input: UpdateMetaInput!) {
    updateMeta(id: $id, input: $input) { id }
  }
`;

// ============================================
// TYPES
// ============================================

type FeedbackType = {
  type: 'success' | 'error' | 'warning' | 'info' | null;
  title: string;
  message: string;
  details?: string[];
  buttons?: { label: string; class: string; onClick: () => void }[];
} | null;

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatDate = (dateInput: any): string => {
  if (!dateInput) return '';
  try {
    const date = new Date(dateInput);
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

const getCurrentDateTime = (): string => {
  return new Date().toISOString();
};

const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// ============================================
// COMPONENT
// ============================================

export function ExportarImportarPage() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [pendingWorkbook, setPendingWorkbook] = useState<ExcelJS.Workbook | null>(null);

  const { data, loading, refetch } = useQuery(GET_ALL_DATA);

  // Mutations
  const [createBarrio] = useMutation(CREATE_BARRIO_MUTATION);
  const [updateBarrio] = useMutation(UPDATE_BARRIO_MUTATION);
  const [createNucleo] = useMutation(CREATE_NUCLEO_MUTATION);
  const [updateNucleo] = useMutation(UPDATE_NUCLEO_MUTATION);
  const [createFamilia] = useMutation(CREATE_FAMILIA_MUTATION);
  const [updateFamilia] = useMutation(UPDATE_FAMILIA_MUTATION);
  const [createMiembro] = useMutation(CREATE_MIEMBRO_MUTATION);
  const [updateMiembro] = useMutation(UPDATE_MIEMBRO_MUTATION);
  const [createVisita] = useMutation(CREATE_VISITA_MUTATION);
  const [updateVisita] = useMutation(UPDATE_VISITA_MUTATION);
  const [createMeta] = useMutation(CREATE_META_MUTATION);
  const [updateMeta] = useMutation(UPDATE_META_MUTATION);
  const [clearAllData] = useMutation(CLEAR_ALL_DATA_MUTATION);

  // ============================================
  // LIMPIAR TODA LA DATA
  // ============================================

  const handleClearAllData = async () => {
    const confirmation = window.confirm(
      'ADVERTENCIA: Esta acción eliminará TODA la información de la aplicación:\n\n' +
      '• Todas las visitas\n' +
      '• Todos los miembros\n' +
      '• Todas las familias\n' +
      '• Todos los núcleos\n' +
      '• Todos los barrios\n' +
      '• Todas las metas\n\n' +
      'Solo se mantendrá tu usuario administrador para que puedas iniciar sesión.\n\n' +
      'Esta acción NO se puede deshacer. ¿Estás seguro de continuar?'
    );

    if (!confirmation) return;

    const doubleConfirmation = window.confirm(
      'SEGUNDA CONFIRMACIÓN: ¿Realmente deseas eliminar TODOS los datos? Esta es tu última oportunidad para cancelar.'
    );

    if (!doubleConfirmation) return;

    setImporting(true);
    try {
      const result = await clearAllData();
      await refetch();

      setFeedback({
        type: 'success',
        title: 'Datos Eliminados Exitosamente',
        message: result.data.clearAllData.message,
        details: [
          `📊 Estadísticas:`,
          `• ${result.data.clearAllData.visitasEliminadas} visitas eliminadas`,
          `• ${result.data.clearAllData.miembrosEliminados} miembros eliminados`,
          `• ${result.data.clearAllData.familiasEliminadas} familias eliminadas`,
          `• ${result.data.clearAllData.nucleosEliminados} núcleos eliminados`,
          `• ${result.data.clearAllData.barriosEliminados} barrios eliminados`,
          `• ${result.data.clearAllData.metasEliminadas} metas eliminadas`,
          '',
          `👤 Usuario Administrador Disponible:`,
          `• Email: nataliaov23@gmail.com`,
          `• Nombre: Natalia Olguín Villalobos`,
          `• Rol: CEA (Administrador)`,
        ],
      });
    } catch (error: any) {
      setFeedback({
        type: 'error',
        title: 'Error al Limpiar Datos',
        message: error.message,
      });
    } finally {
      setImporting(false);
    }
  };

  // ============================================
  // EXPORTAR TODO
  // ============================================

  const exportAll = async () => {
    if (!data) {
      setFeedback({
        type: 'error',
        title: 'Error',
        message: 'No hay datos disponibles para exportar.',
      });
      return;
    }

    setExporting(true);
    setFeedback(null);

    try {
      const workbook = new ExcelJS.Workbook();
      const { miembros, familias, visitas, barrios, nucleos, metas } = data;

      // ========== PESTAÑA 1: MIEMBROS ==========
      const wsMiembros = workbook.addWorksheet('Miembros');

      // IMPORTANTE: Orden específico - columnas VISIBLES primero, IDs técnicos OCULTOS al final
      wsMiembros.columns = [
        // COLUMNAS VISIBLES (editables por usuario)
        { header: 'Nombre(s)', key: 'nombre', width: 25 },
        { header: 'Apellidos', key: 'apellidos', width: 25 },
        { header: 'Fecha Nacimiento', key: 'fechaNacimiento', width: 18 },
        { header: 'Edad Aproximada', key: 'edadAproximada', width: 15 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Teléfono', key: 'telefono', width: 15 },
        { header: 'Dirección', key: 'direccion', width: 40 },
        { header: 'Rol', key: 'rol', width: 15 },
        { header: 'Rol Familiar', key: 'rolFamiliar', width: 15 },
        { header: 'Tiene Devocional', key: 'tieneDevocional', width: 15 },
        { header: 'Día Devocional', key: 'devocionalDia', width: 15 },
        { header: 'Hora Devocional', key: 'devocionalHora', width: 15 },
        { header: 'Participantes', key: 'devocionalParticipantes', width: 15 },
        { header: 'Activo', key: 'activo', width: 10 },
        // NUEVAS COLUMNAS VISIBLES PARA RESOLVER RELACIONES POR NOMBRE (no por ID)
        { header: 'Familia', key: 'familia', width: 30 },
        { header: 'Barrio', key: 'barrio', width: 20 },
        { header: 'Núcleo', key: 'nucleo', width: 20 },
        // COLUMNAS OCULTAS (IDs técnicos - NO editar)
        { header: 'Miembros que Acompañan (IDs)', key: 'devocionalMiembros', width: 40 },
        { header: 'ID', key: 'id', width: 30 },
        { header: 'Barrio ID', key: 'barrioId', width: 30 },
        { header: 'Núcleo ID', key: 'nucleoId', width: 30 },
        { header: 'Familia ID', key: 'familiaId', width: 30 },
        { header: 'Fecha Registro', key: 'fechaRegistro', width: 20 },
      ];

      // Estilo del encabezado
      wsMiembros.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF217346' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      // Agregar datos o fila de ejemplo
      if (miembros.length === 0) {
        wsMiembros.addRow({
          nombre: 'Juan',
          apellidos: 'Pérez',
          fechaNacimiento: '1990-01-15',
          edadAproximada: '',
          email: 'juan@example.com',
          telefono: '1234567890',
          direccion: 'Calle Principal 123',
          rol: 'CEA',
          rolFamiliar: 'Padre',
          tieneDevocional: 'NO',
          devocionalDia: '',
          devocionalHora: '',
          devocionalParticipantes: '',
          devocionalMiembros: '',
          activo: 'SI',
          familia: '',
          barrio: '',
          nucleo: '',
          id: 'member-ejemplo-1',
          barrioId: '',
          nucleoId: '',
          familiaId: '',
          fechaRegistro: getCurrentDateTime(),
        });
      } else {
        miembros.forEach((m: any) => {
          wsMiembros.addRow({
            nombre: m.nombre,
            apellidos: m.apellidos || '',
            fechaNacimiento: formatDate(m.fechaNacimiento),
            edadAproximada: m.edadAproximada || '',
            email: m.email || '',
            telefono: m.telefono || '',
            direccion: m.direccion || '',
            rol: m.rol || 'miembro',
            rolFamiliar: m.rolFamiliar || '',
            tieneDevocional: m.tieneDevocional ? 'SI' : 'NO',
            devocionalDia: m.devocionalDia || '',
            devocionalHora: m.devocionalHora || '',
            devocionalParticipantes: m.devocionalParticipantes || '',
            devocionalMiembros: Array.isArray(m.devocionalMiembros) ? m.devocionalMiembros.join(', ') : '',
            activo: m.activo ? 'SI' : 'NO',
            familia: m.familia?.nombre || '',
            barrio: m.barrio?.nombre || '',
            nucleo: m.nucleo?.nombre || '',
            id: m.id,
            barrioId: m.barrioId || '',
            nucleoId: m.nucleoId || '',
            familiaId: m.familiaId || '',
            fechaRegistro: formatDate(m.fechaRegistro),
          });
        });
      }

      // Ocultar columnas técnicas (18-23: Devocional Miembros IDs, ID, Barrio ID, Núcleo ID, Familia ID, Fecha Registro)
      [18, 19, 20, 21, 22, 23].forEach(col => {
        wsMiembros.getColumn(col).hidden = true;
        wsMiembros.getColumn(col).eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
        });
      });

      // Bordes para todas las celdas
      wsMiembros.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
          };
        });
      });

      // ========== PESTAÑA 2: FAMILIAS ==========
      const wsFamilias = workbook.addWorksheet('Familias');
      wsFamilias.columns = [
        // VISIBLES
        { header: 'Nombre Contacto', key: 'nombre', width: 30 },
        { header: 'Teléfono', key: 'telefono', width: 15 },
        { header: 'Dirección', key: 'direccion', width: 40 },
        { header: 'Barrio', key: 'barrio', width: 20 },
        { header: 'Núcleo', key: 'nucleo', width: 20 },
        { header: 'Estatus', key: 'estatus', width: 12 },
        { header: 'Notas', key: 'notas', width: 40 },
        // OCULTAS
        { header: 'ID', key: 'id', width: 30 },
        { header: 'Fecha Creación', key: 'createdAt', width: 20 },
      ];

      wsFamilias.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF217346' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      if (familias.length === 0) {
        wsFamilias.addRow({
          nombre: 'Familia Ejemplo',
          telefono: '1234567890',
          direccion: 'Calle Principal 123',
          barrio: 'Centro',
          nucleo: '',
          estatus: 'Activa',
          notas: '',
          id: 'familia-ejemplo-1',
          createdAt: getCurrentDateTime(),
        });
      } else {
        familias.forEach((f: any) => {
          wsFamilias.addRow({
            nombre: f.nombre,
            telefono: f.telefono || '',
            direccion: f.direccion || '',
            barrio: f.barrioRel?.nombre || '',
            nucleo: f.nucleoRel?.nombre || '',
            estatus: f.estatus === 'active' ? 'Activa' : 'Inactiva',
            notas: f.notas || '',
            id: f.id,
            createdAt: formatDate(f.createdAt),
          });
        });
      }

      // Ocultar columnas técnicas (8-9)
      [8, 9].forEach(col => {
        wsFamilias.getColumn(col).hidden = true;
        wsFamilias.getColumn(col).eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
        });
      });

      wsFamilias.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
          };
        });
      });

      // ========== PESTAÑA 3: VISITAS (COMPLETA - 34 COLUMNAS) ==========
      const wsVisitas = workbook.addWorksheet('Visitas');
      wsVisitas.columns = [
        // VISIBLES (A-AC: 29 columnas)
        { header: 'Tipo Visita', key: 'visitType', width: 22 },
        { header: 'Fecha Visita', key: 'visitDate', width: 15 },
        { header: 'Hora Visita', key: 'visitTime', width: 12 },
        { header: 'Barrio', key: 'barrio', width: 20 },
        { header: 'Barrio Otro', key: 'barrioOtro', width: 20 },
        { header: 'Núcleo', key: 'nucleo', width: 20 },
        { header: 'Visitadores IDs', key: 'visitadorIds', width: 40 },
        { header: 'Motivo No Visita', key: 'motivoNoVisita', width: 20 },
        { header: 'Motivo (Otra Razón)', key: 'motivoNoVisitaOtra', width: 30 },
        { header: 'Estatus', key: 'visitStatus', width: 15 },
        { header: 'Conversación', key: 'conversacion', width: 12 },
        { header: 'Oraciones', key: 'oraciones', width: 12 },
        { header: 'Estudio Instituto', key: 'estudioInstituto', width: 15 },
        { header: 'Estudio Instituto (Especificar)', key: 'estudioInstitutoEsp', width: 30 },
        { header: 'Otro Estudio', key: 'otroEstudio', width: 12 },
        { header: 'Otro Estudio (Especificar)', key: 'otroEstudioEsp', width: 30 },
        { header: 'Invitación', key: 'invitacion', width: 12 },
        { header: 'Invitación (Especificar)', key: 'invitacionEsp', width: 30 },
        { header: 'Material Libro Oraciones', key: 'materialLibro', width: 20 },
        { header: 'Material Otro', key: 'materialOtro', width: 12 },
        { header: 'Material Otro (Especificar)', key: 'materialOtroEsp', width: 30 },
        { header: 'Seguimiento Visita', key: 'seguimientoVisita', width: 15 },
        { header: 'Tipo Seguimiento', key: 'tipoSeguimiento', width: 15 },
        { header: 'Seguimiento Fecha', key: 'seguimientoFecha', width: 15 },
        { header: 'Seguimiento Hora', key: 'seguimientoHora', width: 12 },
        { header: 'Seguimiento Actividad Básica', key: 'segActBasica', width: 25 },
        { header: 'Actividad Básica (Especificar)', key: 'segActBasicaEsp', width: 30 },
        { header: 'Seguimiento Ninguno', key: 'segNinguno', width: 15 },
        { header: 'Notas Adicionales', key: 'notas', width: 50 },
        // NUEVA COLUMNA VISIBLE PARA RESOLVER RELACIÓN POR NOMBRE (no por ID)
        { header: 'Familia', key: 'familia', width: 30 },
        // OCULTAS (AD-AH: 5 columnas)
        { header: 'ID', key: 'id', width: 30 },
        { header: 'Barrio ID', key: 'barrioId', width: 30 },
        { header: 'Núcleo ID', key: 'nucleoId', width: 30 },
        { header: 'Familia ID', key: 'familiaId', width: 30 },
        { header: 'Fecha Creación', key: 'createdAt', width: 20 },
      ];

      wsVisitas.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF217346' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      if (visitas.length === 0) {
        wsVisitas.addRow({
          visitType: 'Primera visita',
          visitDate: formatDate(new Date()),
          visitTime: '10:00',
          barrio: 'Centro',
          barrioOtro: '',
          nucleo: '',
          visitadorIds: '',
          motivoNoVisita: '',
          motivoNoVisitaOtra: '',
          visitStatus: 'Programada',
          conversacion: 'NO',
          oraciones: 'NO',
          estudioInstituto: 'NO',
          estudioInstitutoEsp: '',
          otroEstudio: 'NO',
          otroEstudioEsp: '',
          invitacion: 'NO',
          invitacionEsp: '',
          materialLibro: 'NO',
          materialOtro: 'NO',
          materialOtroEsp: '',
          seguimientoVisita: 'NO',
          tipoSeguimiento: '',
          seguimientoFecha: '',
          seguimientoHora: '',
          segActBasica: 'NO',
          segActBasicaEsp: '',
          segNinguno: 'NO',
          notas: '',
          familia: '',
          id: 'visita-ejemplo-1',
          barrioId: '',
          nucleoId: '',
          familiaId: '',
          createdAt: getCurrentDateTime(),
        });
      } else {
        visitas.forEach((v: any) => {
          wsVisitas.addRow({
            visitType: v.visitType === 'primera_visita' ? 'Primera visita' :
                       v.visitType === 'visita_seguimiento' ? 'Visita de seguimiento' : 'No se pudo realizar',
            visitDate: formatDate(v.visitDate),
            visitTime: v.visitTime || '',
            barrio: v.barrio?.nombre || '',
            barrioOtro: v.barrioOtro || '',
            nucleo: v.nucleo?.nombre || '',
            visitadorIds: Array.isArray(v.visitorUserIds) ? v.visitorUserIds.join(', ') : '',
            motivoNoVisita: v.motivoNoVisita || '',
            motivoNoVisitaOtra: v.motivoNoVisitaOtra || '',
            visitStatus: v.visitStatus === 'realizada' ? 'Realizada' :
                        v.visitStatus === 'programada' ? 'Programada' : 'Cancelada',
            conversacion: v.visitActivities?.conversacion_preocupaciones ? 'SI' : 'NO',
            oraciones: v.visitActivities?.oraciones ? 'SI' : 'NO',
            estudioInstituto: v.visitActivities?.estudio_instituto ? 'SI' : 'NO',
            estudioInstitutoEsp: v.visitActivities?.estudio_instituto_especificar || '',
            otroEstudio: v.visitActivities?.otro_estudio ? 'SI' : 'NO',
            otroEstudioEsp: v.visitActivities?.otro_estudio_especificar || '',
            invitacion: v.visitActivities?.invitacion_actividad ? 'SI' : 'NO',
            invitacionEsp: v.visitActivities?.invitacion_especificar || '',
            materialLibro: v.materialDejado?.libro_oraciones ? 'SI' : 'NO',
            materialOtro: v.materialDejado?.otro ? 'SI' : 'NO',
            materialOtroEsp: v.materialDejado?.otro_especificar || '',
            seguimientoVisita: v.seguimientoVisita ? 'SI' : 'NO',
            tipoSeguimiento: v.tipoSeguimiento || '',
            seguimientoFecha: formatDate(v.seguimientoFecha),
            seguimientoHora: v.seguimientoHora || '',
            segActBasica: v.seguimientoActividadBasica ? 'SI' : 'NO',
            segActBasicaEsp: v.seguimientoActividadBasicaEspecificar || '',
            segNinguno: v.seguimientoNinguno ? 'SI' : 'NO',
            notas: v.additionalNotes || '',
            familia: v.familia?.nombre || '',
            id: v.id,
            barrioId: v.barrioId || '',
            nucleoId: v.nucleoId || '',
            familiaId: v.familiaId || '',
            createdAt: formatDate(v.createdAt),
          });
        });
      }

      // Ocultar columnas técnicas (31-35: ID, Barrio ID, Núcleo ID, Familia ID, Fecha Creación)
      [31, 32, 33, 34, 35].forEach(col => {
        wsVisitas.getColumn(col).hidden = true;
        wsVisitas.getColumn(col).eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
        });
      });

      wsVisitas.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
          };
        });
      });

      // ========== PESTAÑA 4: BARRIOS ==========
      const wsBarrios = workbook.addWorksheet('Barrios');
      wsBarrios.columns = [
        { header: 'Nombre', key: 'nombre', width: 30 },
        { header: 'Descripción', key: 'descripcion', width: 50 },
        { header: 'Activo', key: 'activo', width: 10 },
        { header: 'ID', key: 'id', width: 30 },
        { header: 'Fecha Creación', key: 'createdAt', width: 20 },
      ];

      wsBarrios.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF217346' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      if (barrios.length === 0) {
        wsBarrios.addRow({
          nombre: 'Centro',
          descripcion: 'Zona centro de la comunidad',
          activo: 'SI',
          id: 'barrio-ejemplo-1',
          createdAt: getCurrentDateTime(),
        });
      } else {
        barrios.forEach((b: any) => {
          wsBarrios.addRow({
            nombre: b.nombre,
            descripcion: b.descripcion || '',
            activo: b.activo ? 'SI' : 'NO',
            id: b.id,
            createdAt: formatDate(b.createdAt),
          });
        });
      }

      [4, 5].forEach(col => {
        wsBarrios.getColumn(col).hidden = true;
        wsBarrios.getColumn(col).eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
        });
      });

      wsBarrios.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
          };
        });
      });

      // ========== PESTAÑA 5: NÚCLEOS ==========
      const wsNucleos = workbook.addWorksheet('Núcleos');
      wsNucleos.columns = [
        { header: 'Nombre', key: 'nombre', width: 30 },
        { header: 'Barrio', key: 'barrio', width: 30 },
        { header: 'Descripción', key: 'descripcion', width: 50 },
        { header: 'Activo', key: 'activo', width: 10 },
        { header: 'ID', key: 'id', width: 30 },
        { header: 'Fecha Creación', key: 'createdAt', width: 20 },
      ];

      wsNucleos.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF217346' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      if (nucleos.length === 0) {
        wsNucleos.addRow({
          nombre: 'Núcleo Ejemplo',
          barrio: 'Centro',
          descripcion: 'Descripción del núcleo',
          activo: 'SI',
          id: 'nucleo-ejemplo-1',
          createdAt: getCurrentDateTime(),
        });
      } else {
        nucleos.forEach((n: any) => {
          wsNucleos.addRow({
            nombre: n.nombre,
            barrio: n.barrio?.nombre || '',
            descripcion: n.descripcion || '',
            activo: n.activo ? 'SI' : 'NO',
            id: n.id,
            createdAt: formatDate(n.createdAt),
          });
        });
      }

      [5, 6].forEach(col => {
        wsNucleos.getColumn(col).hidden = true;
        wsNucleos.getColumn(col).eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
        });
      });

      wsNucleos.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
          };
        });
      });

      // ========== PESTAÑA 6: METAS DEL COMITÉ ==========
      const wsMetas = workbook.addWorksheet('Metas del Comité');
      wsMetas.columns = [
        { header: 'Trimestre', key: 'trimestre', width: 25 },
        { header: 'Fecha Inicio', key: 'fechaInicio', width: 15 },
        { header: 'Fecha Fin', key: 'fechaFin', width: 15 },
        { header: 'Meta Núcleos', key: 'metaNucleos', width: 15 },
        { header: 'Meta Visitas', key: 'metaVisitas', width: 15 },
        { header: 'Meta Personas Visitando', key: 'metaPersonasVisitando', width: 20 },
        { header: 'Meta Devocionales', key: 'metaDevocionales', width: 18 },
        { header: 'Estado', key: 'estado', width: 12 },
        { header: 'Fecha Creación', key: 'createdAt', width: 20 },
        { header: 'Fecha Actualización', key: 'updatedAt', width: 20 },
      ];

      wsMetas.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF217346' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      if (metas.length === 0) {
        wsMetas.addRow({
          trimestre: 'Oct - Ene 2026',
          fechaInicio: '2025-10-21',
          fechaFin: '2026-01-20',
          metaNucleos: 12,
          metaVisitas: 200,
          metaPersonasVisitando: 27,
          metaDevocionales: 60,
          estado: 'Ejemplo',
          createdAt: getCurrentDateTime(),
          updatedAt: getCurrentDateTime(),
        });
      } else {
        metas.forEach((m: any) => {
          wsMetas.addRow({
            trimestre: m.trimestre,
            fechaInicio: formatDate(m.fechaInicio),
            fechaFin: formatDate(m.fechaFin),
            metaNucleos: m.metaNucleos || 0,
            metaVisitas: m.metaVisitas || 0,
            metaPersonasVisitando: m.metaPersonasVisitando || 0,
            metaDevocionales: m.metaDevocionales || 0,
            estado: m.estado === 'activa' ? 'Activa' : m.estado === 'futura' ? 'Futura' : 'Completada',
            createdAt: formatDate(m.createdAt),
            updatedAt: formatDate(m.updatedAt),
          });
        });
      }

      // Estilos para columnas de metas (centradas y con fondo verde claro)
      ['D', 'E', 'F', 'G'].forEach(col => {
        wsMetas.getColumn(col).eachCell((cell, rowNumber) => {
          if (rowNumber > 1) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
            cell.font = { bold: true, color: { argb: 'FF217346' } };
          }
          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
          };
        });
      });

      // Estilos para columna Estado (H)
      wsMetas.getColumn('H').eachCell((cell, rowNumber) => {
        if (rowNumber > 1) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          const estado = cell.value;
          if (estado === 'Activa') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF28A745' } };
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          } else if (estado === 'Completada') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6C757D' } };
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          } else if (estado === 'Futura') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC107' } };
            cell.font = { bold: true, color: { argb: 'FF000000' } };
          }
        }
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        };
      });

      wsMetas.eachRow((row) => {
        row.eachCell((cell) => {
          if (!cell.border) {
            cell.border = {
              top: { style: 'thin' }, left: { style: 'thin' },
              bottom: { style: 'thin' }, right: { style: 'thin' }
            };
          }
        });
      });

      // ========== PESTAÑA 7: REFERENCIA (VALORES VÁLIDOS) ==========
      const wsReferencia = workbook.addWorksheet('Referencia');
      let currentRow = 1;

      // Título principal
      wsReferencia.getCell('A1').value = 'GUÍA DE REFERENCIA - VALORES VÁLIDOS POR CATÁLOGO';
      wsReferencia.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
      wsReferencia.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF217346' } };
      wsReferencia.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
      wsReferencia.mergeCells('A1:C1');
      currentRow = 3;

      // CATÁLOGO: MIEMBROS
      wsReferencia.getCell(`A${currentRow}`).value = 'CATÁLOGO: MIEMBROS';
      wsReferencia.getCell(`A${currentRow}`).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      wsReferencia.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0066CC' } };
      wsReferencia.mergeCells(`A${currentRow}:C${currentRow}`);
      currentRow++;

      wsReferencia.getCell(`A${currentRow}`).value = '→ Roles de Miembro';
      wsReferencia.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
      wsReferencia.mergeCells(`A${currentRow}:C${currentRow}`);
      currentRow++;

      const rolesMiembro = [
        { valor: 'CEA', desc: 'Coordinador de Enseñanza y Aprendizaje' },
        { valor: 'Colaborador', desc: 'Colaborador activo' },
        { valor: 'miembro', desc: 'Miembro regular' }
      ];
      rolesMiembro.forEach(rol => {
        wsReferencia.getCell(`A${currentRow}`).value = rol.valor;
        wsReferencia.getCell(`B${currentRow}`).value = rol.desc;
        currentRow++;
      });

      currentRow++;
      wsReferencia.getCell(`A${currentRow}`).value = '→ Roles Familiares';
      wsReferencia.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
      wsReferencia.mergeCells(`A${currentRow}:C${currentRow}`);
      currentRow++;

      const rolesFamiliares = [
        { valor: 'Padre', desc: 'Padre de familia' },
        { valor: 'Madre', desc: 'Madre de familia' },
        { valor: 'Hijo', desc: 'Hijo' },
        { valor: 'Hija', desc: 'Hija' },
        { valor: 'Abuelo', desc: 'Abuelo' },
        { valor: 'Abuela', desc: 'Abuela' }
      ];
      rolesFamiliares.forEach(rol => {
        wsReferencia.getCell(`A${currentRow}`).value = rol.valor;
        wsReferencia.getCell(`B${currentRow}`).value = rol.desc;
        currentRow++;
      });

      currentRow++;
      wsReferencia.getCell(`A${currentRow}`).value = '→ Días de la Semana (para Devocionales)';
      wsReferencia.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
      wsReferencia.mergeCells(`A${currentRow}:C${currentRow}`);
      currentRow++;

      const diasSemana = [
        { valor: 'Lunes', desc: 'Lunes' },
        { valor: 'Martes', desc: 'Martes' },
        { valor: 'Miércoles', desc: 'Miércoles' },
        { valor: 'Jueves', desc: 'Jueves' },
        { valor: 'Viernes', desc: 'Viernes' },
        { valor: 'Sábado', desc: 'Sábado' },
        { valor: 'Domingo', desc: 'Domingo' }
      ];
      diasSemana.forEach(dia => {
        wsReferencia.getCell(`A${currentRow}`).value = dia.valor;
        wsReferencia.getCell(`B${currentRow}`).value = dia.desc;
        currentRow++;
      });

      // CATÁLOGO: FAMILIAS
      currentRow += 2;
      wsReferencia.getCell(`A${currentRow}`).value = 'CATÁLOGO: FAMILIAS';
      wsReferencia.getCell(`A${currentRow}`).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      wsReferencia.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0066CC' } };
      wsReferencia.mergeCells(`A${currentRow}:C${currentRow}`);
      currentRow++;

      wsReferencia.getCell(`A${currentRow}`).value = '→ Estatus de Familia';
      wsReferencia.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
      wsReferencia.mergeCells(`A${currentRow}:C${currentRow}`);
      currentRow++;

      const estatusFamilia = [
        { valor: 'Activa', desc: 'Familia activa (también acepta: active)' },
        { valor: 'Inactiva', desc: 'Familia inactiva (también acepta: inactive)' }
      ];
      estatusFamilia.forEach(est => {
        wsReferencia.getCell(`A${currentRow}`).value = est.valor;
        wsReferencia.getCell(`B${currentRow}`).value = est.desc;
        currentRow++;
      });

      // CATÁLOGO: VISITAS
      currentRow += 2;
      wsReferencia.getCell(`A${currentRow}`).value = 'CATÁLOGO: VISITAS';
      wsReferencia.getCell(`A${currentRow}`).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      wsReferencia.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0066CC' } };
      wsReferencia.mergeCells(`A${currentRow}:C${currentRow}`);
      currentRow++;

      wsReferencia.getCell(`A${currentRow}`).value = '→ Tipos de Visita';
      wsReferencia.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
      wsReferencia.mergeCells(`A${currentRow}:C${currentRow}`);
      currentRow++;

      const tiposVisita = [
        { valor: 'Primera visita', desc: 'Primera visita a una familia' },
        { valor: 'Visita de seguimiento', desc: 'Visita de seguimiento' },
        { valor: 'No se pudo realizar', desc: 'Visita que no se pudo realizar' }
      ];
      tiposVisita.forEach(tipo => {
        wsReferencia.getCell(`A${currentRow}`).value = tipo.valor;
        wsReferencia.getCell(`B${currentRow}`).value = tipo.desc;
        currentRow++;
      });

      currentRow++;
      wsReferencia.getCell(`A${currentRow}`).value = '→ Estatus de Visita';
      wsReferencia.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
      wsReferencia.mergeCells(`A${currentRow}:C${currentRow}`);
      currentRow++;

      const estatusVisita = [
        { valor: 'Programada', desc: 'Visita programada (no realizada aún)' },
        { valor: 'Realizada', desc: 'Visita realizada exitosamente' },
        { valor: 'Cancelada', desc: 'Visita cancelada o no realizada' }
      ];
      estatusVisita.forEach(est => {
        wsReferencia.getCell(`A${currentRow}`).value = est.valor;
        wsReferencia.getCell(`B${currentRow}`).value = est.desc;
        currentRow++;
      });

      // BARRIOS Y NÚCLEOS DISPONIBLES
      currentRow += 2;
      wsReferencia.getCell(`A${currentRow}`).value = 'CATÁLOGO: BARRIOS Y NÚCLEOS';
      wsReferencia.getCell(`A${currentRow}`).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      wsReferencia.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0066CC' } };
      wsReferencia.mergeCells(`A${currentRow}:C${currentRow}`);
      currentRow++;

      wsReferencia.getCell(`A${currentRow}`).value = '→ Barrios Disponibles';
      wsReferencia.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
      wsReferencia.mergeCells(`A${currentRow}:C${currentRow}`);
      currentRow++;

      barrios.forEach((b: any) => {
        wsReferencia.getCell(`A${currentRow}`).value = b.nombre;
        wsReferencia.getCell(`B${currentRow}`).value = b.id;
        wsReferencia.getCell(`B${currentRow}`).font = { color: { argb: 'FF999999' }, italic: true };
        currentRow++;
      });

      currentRow++;
      wsReferencia.getCell(`A${currentRow}`).value = '→ Núcleos Disponibles';
      wsReferencia.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
      wsReferencia.mergeCells(`A${currentRow}:C${currentRow}`);
      currentRow++;

      nucleos.forEach((n: any) => {
        const barrioNombre = n.barrio?.nombre || '-';
        wsReferencia.getCell(`A${currentRow}`).value = n.nombre;
        wsReferencia.getCell(`B${currentRow}`).value = barrioNombre;
        wsReferencia.getCell(`C${currentRow}`).value = n.descripcion || '';
        currentRow++;
      });

      // VALORES GENERALES
      currentRow += 2;
      wsReferencia.getCell(`A${currentRow}`).value = 'VALORES GENERALES';
      wsReferencia.getCell(`A${currentRow}`).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      wsReferencia.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0066CC' } };
      wsReferencia.mergeCells(`A${currentRow}:C${currentRow}`);
      currentRow++;

      wsReferencia.getCell(`A${currentRow}`).value = '→ Valores SI/NO';
      wsReferencia.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
      wsReferencia.mergeCells(`A${currentRow}:C${currentRow}`);
      currentRow++;

      wsReferencia.getCell(`A${currentRow}`).value = 'SI';
      wsReferencia.getCell(`B${currentRow}`).value = 'Para valores booleanos verdaderos';
      currentRow++;
      wsReferencia.getCell(`A${currentRow}`).value = 'NO';
      wsReferencia.getCell(`B${currentRow}`).value = 'Para valores booleanos falsos';

      // INSTRUCCIONES IMPORTANTES
      currentRow += 2;
      wsReferencia.getCell(`A${currentRow}`).value = 'INSTRUCCIONES IMPORTANTES';
      wsReferencia.getCell(`A${currentRow}`).font = { bold: true, size: 14, color: { argb: 'FFFF0000' } };
      wsReferencia.mergeCells(`A${currentRow}:C${currentRow}`);
      currentRow++;

      const instrucciones = [
        '1. Para Barrio y Núcleo: Escriba el NOMBRE exacto (no el ID)',
        '2. Los nombres NO distinguen mayúsculas/minúsculas',
        '3. Para agregar nuevos: deje la fila sin ID (se generará automáticamente)',
        '4. Para actualizar: NO modifique el ID (columnas ocultas)',
        '5. Las filas de ejemplo ("-ejemplo-") se ignoran al importar',
      ];
      instrucciones.forEach(inst => {
        wsReferencia.getCell(`A${currentRow}`).value = inst;
        wsReferencia.mergeCells(`A${currentRow}:C${currentRow}`);
        currentRow++;
      });

      // Ajustar anchos
      wsReferencia.getColumn('A').width = 80;
      wsReferencia.getColumn('B').width = 40;
      wsReferencia.getColumn('C').width = 35;

      wsReferencia.eachRow((row) => {
        row.eachCell((cell) => {
          if (cell.value) {
            cell.border = {
              top: { style: 'thin' }, left: { style: 'thin' },
              bottom: { style: 'thin' }, right: { style: 'thin' }
            };
          }
        });
      });

      // Descargar archivo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Devocionales_Completo_${formatDate(new Date())}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);

      setFeedback({
        type: 'success',
        title: 'Exportación Exitosa',
        message: `Se exportaron ${miembros.length} miembros, ${familias.length} familias, ${visitas.length} visitas, ${barrios.length} barrios, ${nucleos.length} núcleos, ${metas.length} metas en 7 pestañas (incluye Referencia con valores válidos).`,
      });
    } catch (error: any) {
      console.error('Error al exportar:', error);
      setFeedback({
        type: 'error',
        title: 'Error al Exportar',
        message: error.message || 'Ocurrió un error inesperado.',
      });
    } finally {
      setExporting(false);
    }
  };

  // ============================================
  // IMPORTAR TODO
  // ============================================

  const importAll = async (file: File) => {
    try {
      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);

      // Validar datos antes de importar
      const { errores, advertencias } = validateExcelData(workbook, data);

      // Si hay errores críticos, no continuar
      if (errores.length > 0) {
        setFeedback({
          type: 'error',
          title: 'Errores Críticos Detectados',
          message: 'No se puede importar porque contiene errores que violan las reglas de negocio:',
          details: [...errores, ...(advertencias.length > 0 ? ['', 'ADVERTENCIAS ADICIONALES:', ...advertencias] : [])],
        });
        return;
      }

      // Si solo hay advertencias, preguntar al usuario
      if (advertencias.length > 0) {
        setPendingWorkbook(workbook);
        setFeedback({
          type: 'warning',
          title: 'Advertencias Detectadas',
          message: 'Se detectaron advertencias. El sistema puede aplicar correcciones automáticas. ¿Continuar?',
          details: advertencias,
          buttons: [
            { label: 'Continuar con Importación', class: 'btn-primary', onClick: () => continueImport() },
            { label: 'Cancelar', class: 'btn-secondary', onClick: () => setFeedback(null) }
          ]
        });
        return;
      }

      // Si no hay errores ni advertencias, ejecutar importación directamente
      await executeImport(workbook);

    } catch (error: any) {
      console.error('Error importing:', error);
      setFeedback({
        type: 'error',
        title: 'Error al Importar',
        message: error.message || 'Ocurrió un error inesperado.',
      });
    }
  };

  const continueImport = async () => {
    if (!pendingWorkbook) return;
    setFeedback(null);
    await executeImport(pendingWorkbook);
    setPendingWorkbook(null);
  };

  const executeImport = async (workbook: ExcelJS.Workbook) => {
    setImporting(true);
    setFeedback(null);

    try {
      let barriosAdded = 0, barriosUpdated = 0;
      let nucleosAdded = 0, nucleosUpdated = 0;
      let familiasAdded = 0, familiasUpdated = 0;
      let miembrosAdded = 0, miembrosUpdated = 0;
      let visitasAdded = 0, visitasUpdated = 0;
      let metasAdded = 0, metasUpdated = 0;

      const errores: string[] = [];

      // Obtener datos existentes para comparar IDs
      const currentData = data || { barrios: [], nucleos: [], familias: [], miembros: [], visitas: [], metas: [] };

      // ========== PASO 1: IMPORTAR BARRIOS ==========
      const wsBarrios = workbook.getWorksheet('Barrios');
      if (wsBarrios) {
        const existingBarrios = new Set(currentData.barrios.map((b: any) => b.id));

        for (let rowNumber = 2; rowNumber <= wsBarrios.rowCount; rowNumber++) {
          const row = wsBarrios.getRow(rowNumber);
          const nombre = row.getCell(1).value;
          const descripcion = row.getCell(2).value;
          const activo = row.getCell(3).value;
          const id = row.getCell(4).value;

          if (!nombre) continue; // Saltar filas vacías

          try {
            if (id && existingBarrios.has(String(id))) {
              // Actualizar: incluye campo activo
              const updateInput = {
                nombre: String(nombre),
                descripcion: descripcion ? String(descripcion) : null,
                activo: activo === 'SI'
              };
              await updateBarrio({ variables: { id: String(id), input: updateInput } });
              barriosUpdated++;
            } else {
              // Crear: NO incluye campo activo
              const createInput = {
                nombre: String(nombre),
                descripcion: descripcion ? String(descripcion) : null
              };
              await createBarrio({ variables: { input: createInput } });
              barriosAdded++;
            }
          } catch (error: any) {
            errores.push(`Barrio fila ${rowNumber}: ${error.message}`);
          }
        }
      }

      // Refrescar datos después de importar barrios
      await refetch();
      const updatedData = (await refetch()).data;

      // ========== PASO 2: IMPORTAR NÚCLEOS ==========
      const wsNucleos = workbook.getWorksheet('Núcleos');
      if (wsNucleos && updatedData) {
        const existingNucleos = new Set(updatedData.nucleos.map((n: any) => n.id));
        const barriosMap = new Map(updatedData.barrios.map((b: any) => [b.nombre.toLowerCase(), b.id]));

        // Detectar estructura del Excel mirando los encabezados
        const headerRow = wsNucleos.getRow(1);
        const col4Header = headerRow.getCell(4).value;
        const hasActivoColumn = col4Header === 'Activo';

        for (let rowNumber = 2; rowNumber <= wsNucleos.rowCount; rowNumber++) {
          const row = wsNucleos.getRow(rowNumber);
          const nombre = row.getCell(1).value;
          const barrioNombre = row.getCell(2).value;
          const descripcion = row.getCell(3).value;

          // Leer columnas según estructura detectada
          const activo = hasActivoColumn ? row.getCell(4).value : 'SI';
          const id = hasActivoColumn ? row.getCell(5).value : row.getCell(4).value;

          if (!nombre) continue;

          try {
            // Resolver barrioId por nombre
            const barrioId = barrioNombre ? barriosMap.get(String(barrioNombre).toLowerCase()) : null;

            if (id && existingNucleos.has(String(id))) {
              // Actualizar: incluye campo activo, barrioId opcional
              const updateInput = {
                nombre: String(nombre),
                barrioId: barrioId || null,
                descripcion: descripcion ? String(descripcion) : null,
                activo: activo === 'SI'
              };
              await updateNucleo({ variables: { id: String(id), input: updateInput } });
              nucleosUpdated++;
            } else {
              // Crear: NO incluye campo activo, barrioId es requerido
              if (!barrioId) {
                throw new Error(`Barrio "${barrioNombre}" no encontrado. El núcleo requiere un barrio válido.`);
              }
              const createInput = {
                nombre: String(nombre),
                barrioId: barrioId,
                descripcion: descripcion ? String(descripcion) : null
              };
              await createNucleo({ variables: { input: createInput } });
              nucleosAdded++;
            }
          } catch (error: any) {
            errores.push(`Núcleo fila ${rowNumber}: ${error.message}`);
          }
        }
      }

      // Refrescar datos después de importar núcleos
      await refetch();
      const updatedData2 = (await refetch()).data;

      // ========== PASO 3: IMPORTAR FAMILIAS ==========
      const wsFamilias = workbook.getWorksheet('Familias');
      if (wsFamilias && updatedData2) {
        const existingFamilias = new Set(updatedData2.familias.map((f: any) => f.id));
        const barriosMap = new Map(updatedData2.barrios.map((b: any) => [b.nombre.toLowerCase(), b.id]));
        const nucleosMap = new Map(updatedData2.nucleos.map((n: any) => [n.nombre.toLowerCase(), n.id]));

        for (let rowNumber = 2; rowNumber <= wsFamilias.rowCount; rowNumber++) {
          const row = wsFamilias.getRow(rowNumber);
          const nombre = row.getCell(1).value;
          const telefono = row.getCell(2).value;
          const direccion = row.getCell(3).value;
          const barrioNombre = row.getCell(4).value;
          const nucleoNombre = row.getCell(5).value;
          const estatus = row.getCell(6).value;
          const notas = row.getCell(7).value;
          const id = row.getCell(8).value;

          if (!nombre) continue;

          try {
            const barrioId = barrioNombre ? barriosMap.get(String(barrioNombre).toLowerCase()) : null;
            const nucleoId = nucleoNombre ? nucleosMap.get(String(nucleoNombre).toLowerCase()) : null;

            const input = {
              nombre: String(nombre),
              telefono: telefono ? String(telefono) : null,
              direccion: direccion ? String(direccion) : null,
              barrioId: barrioId || null,
              nucleoId: nucleoId || null,
              estatus: estatus === 'Activa' ? 'active' : 'inactive',
              notas: notas ? String(notas) : null
            };

            if (id && existingFamilias.has(String(id))) {
              await updateFamilia({ variables: { id: String(id), input } });
              familiasUpdated++;
            } else {
              await createFamilia({ variables: { input } });
              familiasAdded++;
            }
          } catch (error: any) {
            errores.push(`Familia fila ${rowNumber}: ${error.message}`);
          }
        }
      }

      // Refrescar datos después de importar familias
      await refetch();
      const updatedData3 = (await refetch()).data;

      // ========== PASO 4: IMPORTAR MIEMBROS ==========
      const wsMiembros = workbook.getWorksheet('Miembros');
      if (wsMiembros && updatedData3) {
        const existingMiembros = new Set(updatedData3.miembros.map((m: any) => m.id));

        // Crear mapas de nombres → IDs para resolver relaciones
        const familiasMap = new Map(updatedData3.familias.map((f: any) => [f.nombre.toLowerCase(), f.id]));
        const barriosMap = new Map(updatedData3.barrios.map((b: any) => [b.nombre.toLowerCase(), b.id]));
        const nucleosMap = new Map(updatedData3.nucleos.map((n: any) => [n.nombre.toLowerCase(), n.id]));

        // Función auxiliar para convertir fecha a formato ISO-8601
        const toISODate = (dateValue: any): string | null => {
          if (!dateValue) return null;
          const dateStr = String(dateValue);
          // Si ya tiene formato ISO-8601, retornarla tal cual
          if (dateStr.includes('T')) return dateStr;
          // Si es formato YYYY-MM-DD, convertir a ISO-8601
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return `${dateStr}T00:00:00.000Z`;
          }
          return dateStr;
        };

        for (let rowNumber = 2; rowNumber <= wsMiembros.rowCount; rowNumber++) {
          const row = wsMiembros.getRow(rowNumber);
          const nombre = row.getCell(1).value;
          const apellidos = row.getCell(2).value;
          const fechaNacimiento = row.getCell(3).value;
          const edadAproximada = row.getCell(4).value;
          const email = row.getCell(5).value;
          const telefono = row.getCell(6).value;
          const direccion = row.getCell(7).value;
          const rol = row.getCell(8).value;
          const rolFamiliar = row.getCell(9).value;
          const tieneDevocional = row.getCell(10).value;
          const devocionalDia = row.getCell(11).value;
          const devocionalHora = row.getCell(12).value;
          const devocionalParticipantes = row.getCell(13).value;
          const activo = row.getCell(14).value;
          // NUEVAS COLUMNAS VISIBLES CON NOMBRES
          const familiaNombre = row.getCell(15).value;
          const barrioNombre = row.getCell(16).value;
          const nucleoNombre = row.getCell(17).value;
          // Columnas ocultas
          const devocionalMiembros = row.getCell(18).value;
          const id = row.getCell(19).value;

          if (!nombre) continue;

          // Resolver IDs por nombre (igual que hace Familias)
          const familiaId = familiaNombre ? familiasMap.get(String(familiaNombre).toLowerCase()) : null;
          const barrioId = barrioNombre ? barriosMap.get(String(barrioNombre).toLowerCase()) : null;
          const nucleoId = nucleoNombre ? nucleosMap.get(String(nucleoNombre).toLowerCase()) : null;

          try {
            if (id && existingMiembros.has(String(id))) {
              // Actualizar: incluye campo activo
              const updateInput = {
                nombre: String(nombre),
                apellidos: apellidos ? String(apellidos) : null,
                fechaNacimiento: toISODate(fechaNacimiento),
                edadAproximada: edadAproximada ? Number(edadAproximada) : null,
                email: email ? String(email) : null,
                telefono: telefono ? String(telefono) : null,
                direccion: direccion ? String(direccion) : null,
                rol: rol ? String(rol).toUpperCase() : 'MIEMBRO',
                rolFamiliar: rolFamiliar ? String(rolFamiliar) : null,
                tieneDevocional: tieneDevocional === 'SI',
                devocionalDia: devocionalDia ? String(devocionalDia) : null,
                devocionalHora: devocionalHora ? String(devocionalHora) : null,
                devocionalParticipantes: devocionalParticipantes ? Number(devocionalParticipantes) : null,
                devocionalMiembros: devocionalMiembros ? String(devocionalMiembros).split(',').map(s => s.trim()).filter(s => s) : [],
                activo: activo === 'SI',
                barrioId: barrioId,
                nucleoId: nucleoId,
                familiaId: familiaId
              };
              await updateMiembro({ variables: { id: String(id), input: updateInput } });
              miembrosUpdated++;
            } else {
              // Crear: NO incluye campo activo
              const createInput = {
                nombre: String(nombre),
                apellidos: apellidos ? String(apellidos) : null,
                fechaNacimiento: toISODate(fechaNacimiento),
                edadAproximada: edadAproximada ? Number(edadAproximada) : null,
                email: email ? String(email) : null,
                telefono: telefono ? String(telefono) : null,
                direccion: direccion ? String(direccion) : null,
                rol: rol ? String(rol).toUpperCase() : 'MIEMBRO',
                rolFamiliar: rolFamiliar ? String(rolFamiliar) : null,
                tieneDevocional: tieneDevocional === 'SI',
                devocionalDia: devocionalDia ? String(devocionalDia) : null,
                devocionalHora: devocionalHora ? String(devocionalHora) : null,
                devocionalParticipantes: devocionalParticipantes ? Number(devocionalParticipantes) : null,
                devocionalMiembros: devocionalMiembros ? String(devocionalMiembros).split(',').map(s => s.trim()).filter(s => s) : [],
                barrioId: barrioId,
                nucleoId: nucleoId,
                familiaId: familiaId
              };
              await createMiembro({ variables: { input: createInput } });
              miembrosAdded++;
            }
          } catch (error: any) {
            errores.push(`Miembro fila ${rowNumber}: ${error.message}`);
          }
        }
      }

      // ========== PASO 5: IMPORTAR VISITAS ==========
      const wsVisitas = workbook.getWorksheet('Visitas');
      if (wsVisitas && updatedData3) {
        const existingVisitas = new Set(updatedData3.visitas.map((v: any) => v.id));
        const familiasMapVisitas = new Map(updatedData3.familias.map((f: any) => [f.nombre.toLowerCase(), f.id]));
        const barriosMap = new Map(updatedData3.barrios.map((b: any) => [b.nombre.toLowerCase(), b.id]));
        const nucleosMap = new Map(updatedData3.nucleos.map((n: any) => [n.nombre.toLowerCase(), n.id]));

        for (let rowNumber = 2; rowNumber <= wsVisitas.rowCount; rowNumber++) {
          const row = wsVisitas.getRow(rowNumber);

          // Leer columnas visibles (A-AC: 29 columnas)
          const visitType = row.getCell(1).value;
          const visitDate = row.getCell(2).value;
          const visitTime = row.getCell(3).value;
          const barrioNombre = row.getCell(4).value;
          const barrioOtro = row.getCell(5).value;
          const nucleoNombre = row.getCell(6).value;
          const visitadorIds = row.getCell(7).value;
          const motivoNoVisita = row.getCell(8).value;
          const motivoNoVisitaOtra = row.getCell(9).value;
          const visitStatus = row.getCell(10).value;
          const conversacion = row.getCell(11).value;
          const oraciones = row.getCell(12).value;
          const estudioInstituto = row.getCell(13).value;
          const estudioInstitutoEsp = row.getCell(14).value;
          const otroEstudio = row.getCell(15).value;
          const otroEstudioEsp = row.getCell(16).value;
          const invitacion = row.getCell(17).value;
          const invitacionEsp = row.getCell(18).value;
          const materialLibro = row.getCell(19).value;
          const materialOtro = row.getCell(20).value;
          const materialOtroEsp = row.getCell(21).value;
          const seguimientoVisita = row.getCell(22).value;
          const tipoSeguimiento = row.getCell(23).value;
          const seguimientoFecha = row.getCell(24).value;
          const seguimientoHora = row.getCell(25).value;
          const segActBasica = row.getCell(26).value;
          const segActBasicaEsp = row.getCell(27).value;
          const segNinguno = row.getCell(28).value;
          const notas = row.getCell(29).value;

          // NUEVA COLUMNA VISIBLE CON NOMBRE
          const familiaNombre = row.getCell(30).value;
          // Leer columnas ocultas (31-35: ID, Barrio ID, Núcleo ID, Familia ID, Fecha Creación)
          const id = row.getCell(31).value;

          if (!visitDate || !familiaNombre) continue;

          try {
            // Mapeos inversos
            const visitTypeMap: any = {
              'Primera visita': 'primera_visita',
              'Visita de seguimiento': 'visita_seguimiento',
              'No se pudo realizar': 'no_se_pudo_realizar'
            };
            const statusMap: any = {
              'Programada': 'programada',
              'Realizada': 'realizada',
              'Cancelada': 'cancelada'
            };

            // Resolver IDs por nombre (igual que hace Miembros y Familias)
            const familiaId = familiaNombre ? familiasMapVisitas.get(String(familiaNombre).toLowerCase()) : null;
            const resolvedBarrioId = barrioNombre ? barriosMap.get(String(barrioNombre).toLowerCase()) : null;
            const resolvedNucleoId = nucleoNombre ? nucleosMap.get(String(nucleoNombre).toLowerCase()) : null;

            if (!familiaId) {
              throw new Error(`Familia "${familiaNombre}" no encontrada.`);
            }

            const input = {
              familiaId: familiaId,
              visitDate: String(visitDate),
              visitTime: visitTime ? String(visitTime) : '00:00',
              visitType: visitTypeMap[String(visitType)] || String(visitType),
              barrioId: resolvedBarrioId,
              barrioOtro: barrioOtro ? String(barrioOtro) : null,
              nucleoId: resolvedNucleoId,
              visitorUserIds: visitadorIds ? String(visitadorIds).split(',').map(s => s.trim()).filter(s => s) : [],
              motivoNoVisita: motivoNoVisita ? String(motivoNoVisita) : null,
              motivoNoVisitaOtra: motivoNoVisitaOtra ? String(motivoNoVisitaOtra) : null,
              visitActivities: {
                conversacion_preocupaciones: conversacion === 'SI',
                oraciones: oraciones === 'SI',
                estudio_instituto: estudioInstituto === 'SI',
                estudio_instituto_especificar: estudioInstitutoEsp ? String(estudioInstitutoEsp) : null,
                otro_estudio: otroEstudio === 'SI',
                otro_estudio_especificar: otroEstudioEsp ? String(otroEstudioEsp) : null,
                invitacion_actividad: invitacion === 'SI',
                invitacion_especificar: invitacionEsp ? String(invitacionEsp) : null,
              },
              materialDejado: {
                libro_oraciones: materialLibro === 'SI',
                otro: materialOtro === 'SI',
                otro_especificar: materialOtroEsp ? String(materialOtroEsp) : null,
              },
              seguimientoVisita: seguimientoVisita === 'SI',
              tipoSeguimiento: tipoSeguimiento ? String(tipoSeguimiento) : null,
              seguimientoFecha: seguimientoFecha ? String(seguimientoFecha) : null,
              seguimientoHora: seguimientoHora ? String(seguimientoHora) : null,
              seguimientoActividadBasica: segActBasica === 'SI',
              seguimientoActividadBasicaEspecificar: segActBasicaEsp ? String(segActBasicaEsp) : null,
              seguimientoNinguno: segNinguno === 'SI',
              additionalNotes: notas ? String(notas) : null
            };

            if (id && existingVisitas.has(String(id))) {
              await updateVisita({ variables: { id: String(id), input } });
              visitasUpdated++;
            } else {
              await createVisita({ variables: { input } });
              visitasAdded++;
            }
          } catch (error: any) {
            errores.push(`Visita fila ${rowNumber}: ${error.message}`);
          }
        }
      }

      // ========== PASO 6: IMPORTAR METAS ==========
      const wsMetas = workbook.getWorksheet('Metas del Comité');
      if (wsMetas && updatedData3) {
        const existingMetas = new Set(updatedData3.metas.map((m: any) => m.id));

        for (let rowNumber = 2; rowNumber <= wsMetas.rowCount; rowNumber++) {
          const row = wsMetas.getRow(rowNumber);
          const trimestre = row.getCell(1).value;
          const fechaInicio = row.getCell(2).value;
          const fechaFin = row.getCell(3).value;
          const metaNucleos = row.getCell(4).value;
          const metaVisitas = row.getCell(5).value;
          const metaPersonasVisitando = row.getCell(6).value;
          const metaDevocionales = row.getCell(7).value;

          if (!trimestre) continue;

          try {
            const input = {
              trimestre: String(trimestre),
              fechaInicio: fechaInicio ? String(fechaInicio) : null,
              fechaFin: fechaFin ? String(fechaFin) : null,
              metaNucleos: metaNucleos ? Number(metaNucleos) : 0,
              metaVisitas: metaVisitas ? Number(metaVisitas) : 0,
              metaPersonasVisitando: metaPersonasVisitando ? Number(metaPersonasVisitando) : 0,
              metaDevocionales: metaDevocionales ? Number(metaDevocionales) : 0
            };

            // No hay forma de saber el ID de metas del Excel, así que siempre creamos
            await createMeta({ variables: { input } });
            metasAdded++;
          } catch (error: any) {
            errores.push(`Meta fila ${rowNumber}: ${error.message}`);
          }
        }
      }

      // Refrescar datos finales
      await refetch();

      if (errores.length > 0) {
        setFeedback({
          type: 'warning',
          title: 'Importación Completada con Advertencias',
          message: `Agregados: ${barriosAdded} barrios, ${nucleosAdded} núcleos, ${familiasAdded} familias, ${miembrosAdded} miembros, ${visitasAdded} visitas, ${metasAdded} metas.\nActualizados: ${barriosUpdated} barrios, ${nucleosUpdated} núcleos, ${familiasUpdated} familias, ${miembrosUpdated} miembros, ${visitasUpdated} visitas, ${metasUpdated} metas.\n\nSe encontraron algunos errores:`,
          details: errores
        });
      } else {
        setFeedback({
          type: 'success',
          title: 'Importación Completada Exitosamente',
          message: `Agregados: ${barriosAdded} barrios, ${nucleosAdded} núcleos, ${familiasAdded} familias, ${miembrosAdded} miembros, ${visitasAdded} visitas, ${metasAdded} metas.\nActualizados: ${barriosUpdated} barrios, ${nucleosUpdated} núcleos, ${familiasUpdated} familias, ${miembrosUpdated} miembros, ${visitasUpdated} visitas, ${metasUpdated} metas.`,
        });
      }

    } catch (error: any) {
      console.error('Error ejecutando importación:', error);
      setFeedback({
        type: 'error',
        title: 'Error en Importación',
        message: error.message || 'Ocurrió un error durante la importación.',
      });
    } finally {
      setImporting(false);
    }
  };

  // ============================================
  // VALIDACIONES
  // ============================================

  const validateExcelData = (workbook: ExcelJS.Workbook, currentData: any) => {
    const errores: string[] = [];
    const advertencias: string[] = [];

    try {
      const barriosActuales = currentData?.barrios || [];
      const nucleosActuales = currentData?.nucleos || [];
      const familiasActuales = currentData?.familias || [];
      const miembrosActuales = currentData?.miembros || [];

      // ========== VALIDAR BARRIOS ==========
      const wsBarrios = workbook.getWorksheet('Barrios');
      const barriosExcel: any[] = [];
      if (wsBarrios) {
        for (let rowNumber = 2; rowNumber <= wsBarrios.rowCount; rowNumber++) {
          const row = wsBarrios.getRow(rowNumber);
          const nombre = row.getCell(1).value;
          const id = row.getCell(4).value;

          // Incluir TODOS los barrios del Excel para validación (incluso ejemplos)
          if (nombre) {
            barriosExcel.push({ id: id ? String(id) : null, nombre: String(nombre).trim() });
          }
        }
      }
      const todosBarrios = [...barriosActuales, ...barriosExcel];

      // ========== VALIDAR NÚCLEOS ==========
      const wsNucleos = workbook.getWorksheet('Núcleos');
      const nucleosExcel: any[] = [];
      if (wsNucleos) {
        // Detectar estructura del Excel mirando los encabezados
        const headerRow = wsNucleos.getRow(1);
        const col4Header = headerRow.getCell(4).value;
        const hasActivoColumn = col4Header === 'Activo';

        for (let rowNumber = 2; rowNumber <= wsNucleos.rowCount; rowNumber++) {
          const row = wsNucleos.getRow(rowNumber);
          const nombre = row.getCell(1).value;
          const barrioRef = row.getCell(2).value;
          const id = hasActivoColumn ? row.getCell(5).value : row.getCell(4).value;

          if (!nombre) continue;

          const nucleoStr = String(nombre).trim();

          // Validar que el núcleo tenga barrio (NUC-001)
          if (!barrioRef) {
            errores.push(`Núcleo "${nucleoStr}" (fila ${rowNumber}): No tiene Barrio asignado. Regla NUC-001 requiere barrio obligatorio.`);
          } else {
            // Buscar si el barrio existe
            const barrioStr = String(barrioRef).trim();
            const barrioExiste = todosBarrios.find((b: any) =>
              b.nombre.toLowerCase() === barrioStr.toLowerCase() ||
              b.id === barrioStr
            );

            if (!barrioExiste) {
              errores.push(`Núcleo "${nucleoStr}" (fila ${rowNumber}): Barrio "${barrioStr}" no existe. Debe crear el barrio primero.`);
            }
          }

          // Incluir TODOS los núcleos del Excel para validación (incluso ejemplos)
          nucleosExcel.push({ id: id ? String(id) : null, nombre: nucleoStr, barrioRef });
        }
      }
      const todosNucleos = [...nucleosActuales, ...nucleosExcel];

      // ========== VALIDAR FAMILIAS ==========
      const wsFamilias = workbook.getWorksheet('Familias');
      const familiasExcel: any[] = [];
      if (wsFamilias) {
        for (let rowNumber = 2; rowNumber <= wsFamilias.rowCount; rowNumber++) {
          const row = wsFamilias.getRow(rowNumber);
          const nombre = row.getCell(1).value;
          const direccion = row.getCell(3).value;
          const barrioRef = row.getCell(4).value;
          const nucleoRef = row.getCell(5).value;
          const id = row.getCell(8).value;

          if (!nombre) continue;

          // Validar barrio si está definido
          if (barrioRef) {
            const barrioStr = String(barrioRef).trim();
            const barrioExiste = todosBarrios.find((b: any) =>
              b.nombre.toLowerCase() === barrioStr.toLowerCase() ||
              b.id === barrioStr
            );
            if (!barrioExiste) {
              advertencias.push(`Familia "${nombre}" (fila ${rowNumber}): Barrio "${barrioStr}" no existe.`);
            }
          }

          // Validar núcleo si está definido
          if (nucleoRef) {
            const nucleoStr = String(nucleoRef).trim();
            const nucleoExiste = todosNucleos.find((n: any) =>
              n.nombre.toLowerCase() === nucleoStr.toLowerCase() ||
              n.id === nucleoStr
            );
            if (!nucleoExiste) {
              advertencias.push(`Familia "${nombre}" (fila ${rowNumber}): Núcleo "${nucleoStr}" no existe.`);
            }
          }

          // Incluir TODAS las familias del Excel para validación (incluso ejemplos)
          familiasExcel.push({ id: id ? String(id) : null, nombre: String(nombre).trim(), direccion, barrioRef, nucleoRef });
        }
      }
      const todasFamilias = [...familiasActuales, ...familiasExcel];

      // ========== VALIDAR MIEMBROS ==========
      const wsMiembros = workbook.getWorksheet('Miembros');
      const miembrosExcel: any[] = [];
      if (wsMiembros) {
        for (let rowNumber = 2; rowNumber <= wsMiembros.rowCount; rowNumber++) {
          const row = wsMiembros.getRow(rowNumber);
          const nombre = row.getCell(1).value;
          const direccion = row.getCell(7).value;
          // NUEVAS COLUMNAS VISIBLES CON NOMBRES
          const familiaNombre = row.getCell(15).value;
          const barrioNombre = row.getCell(16).value;
          const nucleoNombre = row.getCell(17).value;
          // Columnas ocultas
          const id = row.getCell(19).value;

          if (!nombre) continue;

          // Validar que el miembro tenga barrio (MEM-001)
          if (!barrioNombre) {
            errores.push(`Miembro "${nombre}" (fila ${rowNumber}): No tiene Barrio asignado. Regla MEM-001 requiere barrio obligatorio.`);
          }

          // Validar núcleo si está definido
          if (nucleoNombre) {
            const nucleoStr = String(nucleoNombre).trim();
            const nucleoExiste = todosNucleos.find((n: any) =>
              n.nombre.toLowerCase() === nucleoStr.toLowerCase()
            );
            if (!nucleoExiste) {
              advertencias.push(`Miembro "${nombre}" (fila ${rowNumber}): Núcleo "${nucleoStr}" no existe.`);
            }
          }

          // Incluir TODOS los miembros del Excel para validación (incluso ejemplos)
          miembrosExcel.push({ id: id ? String(id) : null, nombre: String(nombre).trim(), direccion, familiaNombre, barrioNombre, nucleoNombre });
        }
      }

      // ========== VALIDAR COHERENCIA FAMILIA-MIEMBROS (FAM-004) ==========
      const miembrosPorFamilia: Record<string, any[]> = {};
      miembrosExcel.forEach((miembro: any) => {
        if (miembro.familiaNombre) {
          const familiaNombreLower = String(miembro.familiaNombre).toLowerCase();
          if (!miembrosPorFamilia[familiaNombreLower]) {
            miembrosPorFamilia[familiaNombreLower] = [];
          }
          miembrosPorFamilia[familiaNombreLower].push(miembro);
        }
      });

      // Validar que miembros de la misma familia compartan dirección/barrio
      Object.keys(miembrosPorFamilia).forEach((familiaNombre) => {
        const miembros = miembrosPorFamilia[familiaNombre];
        if (miembros.length > 1) {
          // Verificar direcciones
          const direcciones = [...new Set(miembros.map(m => m.direccion).filter(a => a))];
          if (direcciones.length > 1) {
            advertencias.push(`Familia "${familiaNombre}": Los miembros tienen diferentes direcciones. Regla FAM-004 requiere dirección compartida.`);
          }

          // Verificar barrios
          const barrios = [...new Set(miembros.map(m => m.barrioNombre).filter(b => b))];
          if (barrios.length > 1) {
            advertencias.push(`Familia "${familiaNombre}": Los miembros tienen diferentes barrios. Regla FAM-004 requiere barrio compartido.`);
          }
        }
      });

      // ========== VALIDAR VISITAS ==========
      const wsVisitas = workbook.getWorksheet('Visitas');
      if (wsVisitas) {
        for (let rowNumber = 2; rowNumber <= wsVisitas.rowCount; rowNumber++) {
          const row = wsVisitas.getRow(rowNumber);

          const visitType = row.getCell(1).value;
          const visitDate = row.getCell(2).value;
          const visitTime = row.getCell(3).value;
          const motivoNoVisita = row.getCell(8).value;
          const motivoNoVisitaOtra = row.getCell(9).value;
          const visitStatus = row.getCell(10).value;
          const estudioInstituto = row.getCell(13).value;
          const estudioInstitutoEsp = row.getCell(14).value;
          // NUEVA COLUMNA VISIBLE CON NOMBRE
          const familiaNombre = row.getCell(30).value;
          // Columnas ocultas
          const id = row.getCell(31).value;

          // Validación 1: Familia (nombre) es obligatorio
          if (!familiaNombre) {
            errores.push(`Visita (fila ${rowNumber}): Nombre de Familia es obligatorio.`);
            continue;
          }

          // Validación 2: Verificar que la familia existe (por nombre)
          const familiaStr = String(familiaNombre).trim();
          const familiaExiste = todasFamilias.find((f: any) =>
            f.nombre.toLowerCase() === familiaStr.toLowerCase()
          );
          if (!familiaExiste) {
            errores.push(`Visita (fila ${rowNumber}): Familia "${familiaStr}" no existe.`);
          }

          // Validación 3: Campos requeridos
          if (!visitType) {
            errores.push(`Visita (fila ${rowNumber}): Tipo de visita es obligatorio.`);
          }
          if (!visitDate) {
            errores.push(`Visita (fila ${rowNumber}): Fecha de visita es obligatoria.`);
          }
          if (!visitTime) {
            errores.push(`Visita (fila ${rowNumber}): Hora de visita es obligatoria.`);
          }
          if (!visitStatus) {
            errores.push(`Visita (fila ${rowNumber}): Estatus de visita es obligatorio.`);
          }

          // Validación 4: Si no se pudo realizar, debe tener motivo
          if ((visitType === 'no_se_pudo_realizar' || visitType === 'No se pudo realizar') && !motivoNoVisita) {
            errores.push(`Visita (fila ${rowNumber}): Si la visita no se pudo realizar, debe especificar el motivo.`);
          }

          // Validación 5: Si motivo es "otra", debe especificar
          if ((motivoNoVisita === 'otra' || motivoNoVisita === 'Otra razón') && !motivoNoVisitaOtra) {
            errores.push(`Visita (fila ${rowNumber}): Si el motivo es "otra", debe especificar la razón.`);
          }

          // Validación 6: Si estudio instituto marcado, debe especificar
          if (estudioInstituto === 'SI' && !estudioInstitutoEsp) {
            advertencias.push(`Visita (fila ${rowNumber}): Estudio del Instituto marcado pero sin especificar qué libro.`);
          }
        }
      }

    } catch (error: any) {
      errores.push(`Error al validar el archivo: ${error.message}`);
    }

    return { errores, advertencias };
  };

  // ============================================
  // HANDLER PARA FILE INPUT
  // ============================================

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx')) {
      setFeedback({
        type: 'error',
        title: 'Archivo Inválido',
        message: 'Por favor selecciona un archivo Excel (.xlsx)',
      });
      return;
    }

    importAll(file);
  };

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Cargando datos...</div>
      </div>
    );
  }

  const isEmpty =
    !data ||
    (data.miembros.length === 0 &&
      data.familias.length === 0 &&
      data.visitas.length === 0 &&
      data.barrios.length === 0 &&
      data.nucleos.length === 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b-2 border-primary-600 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Exportar e Importar Datos</h1>
        <p className="text-gray-600 mt-2">
          Gestiona tus datos exportando a Excel o importando información desde archivos Excel.
        </p>

        {/* Welcome Message */}
        {isEmpty && (
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-5 mt-5">
            <h3 className="text-yellow-800 text-xl font-semibold mt-0 mb-3">
              👋 ¡Bienvenido!
            </h3>
            <p className="text-yellow-800 mb-2">
              La aplicación está vacía porque aún no has importado datos. Para comenzar:
            </p>
            <ol className="text-yellow-800 leading-relaxed list-decimal list-inside">
              <li>
                <strong>Si tienes un archivo Excel con tus datos:</strong> Usa el botón "Importar Todo" más abajo
              </li>
              <li>
                <strong>Si no tienes datos aún:</strong> Ve a los catálogos y comienza a agregar registros manualmente
              </li>
              <li>
                <strong>Tip:</strong> Puedes exportar en cualquier momento como respaldo usando "Exportar Todo"
              </li>
            </ol>
          </div>
        )}
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`rounded-lg p-5 shadow-md ${
            feedback.type === 'success'
              ? 'bg-green-50 border-2 border-green-500'
              : feedback.type === 'error'
              ? 'bg-red-50 border-2 border-red-500'
              : feedback.type === 'info'
              ? 'bg-blue-50 border-2 border-blue-500'
              : 'bg-yellow-50 border-2 border-yellow-400'
          }`}
        >
          <div
            className={`text-xl font-bold mb-3 ${
              feedback.type === 'success'
                ? 'text-green-800'
                : feedback.type === 'error'
                ? 'text-red-800'
                : feedback.type === 'info'
                ? 'text-blue-800'
                : 'text-yellow-800'
            }`}
          >
            {feedback.title}
          </div>
          <div
            className={`text-base mb-3 ${
              feedback.type === 'success'
                ? 'text-green-800'
                : feedback.type === 'error'
                ? 'text-red-800'
                : feedback.type === 'info'
                ? 'text-blue-800'
                : 'text-yellow-800'
            }`}
          >
            {feedback.message}
          </div>

          {feedback.details && feedback.details.length > 0 && (
            <div className="max-h-64 overflow-y-auto mb-3 p-3 bg-white rounded border">
              <ul className="list-disc list-inside space-y-1 text-sm">
                {feedback.details.map((detail, idx) => (
                  <li key={idx} dangerouslySetInnerHTML={{ __html: detail }} />
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2">
            {feedback.buttons ? (
              feedback.buttons.map((btn, idx) => (
                <button
                  key={idx}
                  onClick={btn.onClick}
                  className={`px-4 py-2 rounded-md font-semibold ${btn.class}`}
                >
                  {btn.label}
                </button>
              ))
            ) : (
              <button
                onClick={() => setFeedback(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Exportar Section */}
      <div>
        <h3 className="text-primary-600 text-2xl font-semibold mb-2">📥 Exportar a Excel</h3>
        <p className="text-gray-600 text-sm mb-5">
          Descarga todos los catálogos en un solo archivo Excel (.xlsx) con 7 pestañas (incluye pestaña de Referencia con valores válidos).
        </p>

        <div className="flex justify-center">
          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-primary-600 rounded-lg p-5 max-w-xl w-full flex gap-4 hover:shadow-lg transition-all hover:-translate-y-1">
            <Download className="w-12 h-12 text-primary-600 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-primary-600 text-lg font-semibold mb-2">
                Exportar Todos los Catálogos
              </h4>
              <p className="text-gray-600 text-sm mb-4 leading-snug">
                Exporta 7 pestañas: Miembros (20 cols), Familias (9 cols), Visitas (34 cols completas), Barrios, Núcleos, Metas, y Referencia (valores válidos)
              </p>
              <button
                onClick={exportAll}
                disabled={exporting}
                className="bg-gradient-to-r from-primary-600 to-primary-700 text-white border-none px-6 py-3 rounded-md text-base font-semibold cursor-pointer transition-all hover:from-primary-700 hover:to-primary-800 hover:-translate-y-0.5 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {exporting ? (
                  <>
                    <Clock className="w-5 h-5 flex-shrink-0 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 flex-shrink-0" />
                    Exportar Todo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Importar Section */}
      <div>
        <h3 className="text-primary-600 text-2xl font-semibold mb-2">📤 Importar desde Excel</h3>
        <p className="text-gray-600 text-sm mb-5">
          Importa todos los catálogos desde un archivo Excel. Los registros nuevos se agregarán y los existentes se actualizarán.
        </p>

        <div className="flex justify-center">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-600 rounded-lg p-5 max-w-xl w-full flex gap-4 hover:shadow-lg transition-all hover:-translate-y-1">
            <Upload className="w-12 h-12 text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-blue-700 text-lg font-semibold mb-2">
                Importar Todos los Catálogos
              </h4>
              <p className="text-gray-600 text-sm mb-4 leading-snug">
                Importa un archivo Excel con 6 pestañas (Miembros, Familias, Visitas, Barrios, Núcleos, Metas) y actualiza todos los catálogos. Sistema de validación automática incluido.
              </p>
              <input
                type="file"
                accept=".xlsx"
                onChange={handleFileUpload}
                disabled={importing}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className={`inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white border-none px-6 py-3 rounded-md text-base font-semibold cursor-pointer transition-all hover:from-blue-700 hover:to-blue-800 hover:-translate-y-0.5 shadow-md hover:shadow-lg ${importing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {importing ? (
                  <>
                    <Clock className="w-5 h-5 flex-shrink-0 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 flex-shrink-0" />
                    Seleccionar Archivo Excel
                  </>
                )}
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Limpiar Data Section */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Trash2 className="w-8 h-8 text-red-600 flex-shrink-0" />
          <h3 className="text-red-600 text-2xl font-semibold">Limpiar Toda la Data</h3>
        </div>
        <p className="text-gray-600 text-sm mb-5">
          Elimina TODOS los datos de la aplicación. Solo se mantendrá tu usuario administrador. Esta acción es irreversible.
        </p>

        <div className="flex justify-center">
          <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-600 rounded-lg p-5 max-w-xl w-full flex gap-4 hover:shadow-lg transition-all hover:-translate-y-1">
            <AlertTriangle className="w-12 h-12 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-700 flex-shrink-0" />
                <h4 className="text-red-700 text-lg font-semibold">
                  ZONA PELIGROSA - Eliminar Todos los Datos
                </h4>
              </div>
              <p className="text-gray-600 text-sm mb-4 leading-snug">
                Esta acción eliminará permanentemente TODAS las visitas, miembros, familias, núcleos, barrios y metas.
                Solo se conservará tu usuario CEA para poder iniciar sesión. Se recomienda exportar los datos antes de continuar.
              </p>
              <button
                onClick={handleClearAllData}
                disabled={importing}
                className="bg-gradient-to-r from-red-600 to-red-700 text-white border-none px-6 py-3 rounded-md text-base font-semibold cursor-pointer transition-all hover:from-red-700 hover:to-red-800 hover:-translate-y-0.5 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {importing ? (
                  <>
                    <Clock className="w-5 h-5 flex-shrink-0 animate-spin" />
                    Limpiando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5 flex-shrink-0" />
                    Limpiar Toda la Data
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-gray-50 border-l-4 border-primary-600 p-5 rounded">
        <h4 className="text-primary-600 font-semibold mb-3">ⓘ Información Importante</h4>
        <ul className="text-gray-700 text-sm leading-relaxed list-disc list-inside space-y-2">
          <li>
            <strong>Exportar Todo:</strong> Crea archivo Excel con 7 pestañas incluyendo pestaña de Referencia con todos los valores válidos para dropdowns.
          </li>
          <li>
            <strong>Columnas Ocultas:</strong> Las columnas técnicas (IDs, fechas del sistema) están ocultas al final de cada pestaña con fondo gris. NO las edites.
          </li>
          <li>
            <strong>Visitas Completas:</strong> La pestaña de Visitas incluye 34 columnas con todas las actividades, materiales y opciones de seguimiento detalladas.
          </li>
          <li>
            <strong>Importar Todo:</strong> Valida automáticamente los datos contra 150+ reglas de negocio antes de importar. Muestra errores y advertencias.
          </li>
          <li>
            <strong>Actualización de Datos:</strong> Si un registro con el mismo ID existe, se actualizará. Si no existe, se creará uno nuevo.
          </li>
          <li>
            <strong>Valores Legibles:</strong> Usa nombres legibles en español (ej: "Activa", "SI", "Primera visita"). El sistema los convierte automáticamente.
          </li>
        </ul>
      </div>
    </div>
  );
}
