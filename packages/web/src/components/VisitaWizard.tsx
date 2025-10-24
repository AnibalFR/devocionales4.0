import { useState, useEffect } from 'react';
import { useMutation, useQuery, gql } from '@apollo/client';
import { Lightbulb, CheckCircle, Info } from 'lucide-react';

// GraphQL Queries
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

const FAMILIAS_QUERY = gql`
  query Familias {
    familias {
      id
      nombre
      direccion
      barrioId
      nucleoId
    }
  }
`;

const MIEMBROS_QUERY = gql`
  query Miembros {
    miembros {
      id
      nombre
      apellidos
      familiaId
    }
  }
`;

const CREATE_FAMILIA_MUTATION = gql`
  mutation CreateFamilia($input: CreateFamiliaInput!) {
    createFamilia(input: $input) {
      id
      nombre
      direccion
      telefono
      email
      barrioId
      nucleoId
    }
  }
`;

const CREATE_MIEMBRO_MUTATION = gql`
  mutation CreateMiembro($input: CreateMiembroInput!) {
    createMiembro(input: $input) {
      id
      nombre
      apellidos
      familiaId
    }
  }
`;

const UPDATE_MIEMBRO_MUTATION = gql`
  mutation UpdateMiembro($id: ID!, $input: UpdateMiembroInput!) {
    updateMiembro(id: $id, input: $input) {
      id
      nombre
      apellidos
      familiaId
    }
  }
`;

const CREATE_VISITA_MUTATION = gql`
  mutation CreateVisita($input: CreateVisitaInput!) {
    createVisita(input: $input) {
      id
      visitDate
      visitTime
      visitType
      visitStatus
    }
  }
`;

const UPDATE_VISITA_MUTATION = gql`
  mutation UpdateVisita($id: ID!, $input: UpdateVisitaInput!) {
    updateVisita(id: $id, input: $input) {
      id
      visitDate
      visitTime
      visitType
      visitStatus
    }
  }
`;

interface VisitaWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any; // Datos de la visita para editar
  visitaId?: string; // ID de la visita para editar
}

interface VisitaFormData {
  // Paso 1: Ubicación
  barrioId: string;
  barrioOtro: string;
  nucleoId: string;

  // Paso 2: Familia
  familiaId: string;

  // Paso 3: Fecha y Hora
  visitDate: string;
  visitTime: string;

  // Paso 4: Visitadores
  visitorUserIds: string[];

  // Paso 5: Tipo y Actividades
  visitType: string;
  motivoNoVisita: string;
  motivoNoVisitaOtra: string;
  visitActivities: {
    conversacion_preocupaciones: boolean;
    oraciones: boolean;
    estudio_instituto: boolean;
    estudio_instituto_especificar: string;
    otro_estudio: boolean;
    otro_estudio_especificar: string;
    invitacion_actividad: boolean;
    invitacion_especificar: string;
  };

  // Paso 6: Materiales
  materialDejado: {
    libro_oraciones: boolean;
    otro: boolean;
    otro_especificar: string;
  };

  // Paso 7: Seguimiento
  seguimientoVisita: boolean;
  tipoSeguimiento: string;
  seguimientoFecha: string;
  seguimientoHora: string;
  seguimientoActividadBasica: boolean;
  seguimientoActividadBasicaEspecificar: string;
  seguimientoNinguno: boolean;

  // Paso 8: Notas
  additionalNotes: string;
}

const INITIAL_FORM_DATA: VisitaFormData = {
  barrioId: '',
  barrioOtro: '',
  nucleoId: '',
  familiaId: '',
  visitDate: new Date().toISOString().split('T')[0],
  visitTime: '18:00',
  visitorUserIds: [],
  visitType: '',
  motivoNoVisita: '',
  motivoNoVisitaOtra: '',
  visitActivities: {
    conversacion_preocupaciones: false,
    oraciones: false,
    estudio_instituto: false,
    estudio_instituto_especificar: '',
    otro_estudio: false,
    otro_estudio_especificar: '',
    invitacion_actividad: false,
    invitacion_especificar: '',
  },
  materialDejado: {
    libro_oraciones: false,
    otro: false,
    otro_especificar: '',
  },
  seguimientoVisita: false,
  tipoSeguimiento: '',
  seguimientoFecha: '',
  seguimientoHora: '',
  seguimientoActividadBasica: false,
  seguimientoActividadBasicaEspecificar: '',
  seguimientoNinguno: false,
  additionalNotes: '',
};

export function VisitaWizard({ isOpen, onClose, onSuccess, initialData, visitaId }: VisitaWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<VisitaFormData>(INITIAL_FORM_DATA);

  // Estado para crear familia
  const [mostrarCrearFamilia, setMostrarCrearFamilia] = useState(false);
  const [nuevaFamilia, setNuevaFamilia] = useState({ nombre: '', direccion: '', telefono: '', email: '' });
  const [miembrosSeleccionados, setMiembrosSeleccionados] = useState<string[]>([]);
  const [nuevosMiembros, setNuevosMiembros] = useState<Array<{ nombre: string; apellidos: string; rolFamiliar: string }>>([]);

  const { data: barriosData } = useQuery(BARRIOS_QUERY);
  const { data: nucleosData } = useQuery(NUCLEOS_QUERY);
  const { data: familiasData, refetch: refetchFamilias } = useQuery(FAMILIAS_QUERY);
  const { data: miembrosData, refetch: refetchMiembros } = useQuery(MIEMBROS_QUERY);

  const [createVisita, { loading: creating }] = useMutation(CREATE_VISITA_MUTATION, {
    refetchQueries: ['Visitas'],
    awaitRefetchQueries: true,
    onCompleted: () => {
      onSuccess();
      handleClose();
    },
    onError: (error) => {
      alert(`Error al crear visita: ${error.message}`);
    },
  });

  const [updateVisita, { loading: updating }] = useMutation(UPDATE_VISITA_MUTATION, {
    refetchQueries: ['Visitas'],
    awaitRefetchQueries: true,
    onCompleted: () => {
      onSuccess();
      handleClose();
    },
    onError: (error) => {
      alert(`Error al actualizar visita: ${error.message}`);
    },
  });

  const [createFamilia, { loading: creandoFamilia }] = useMutation(CREATE_FAMILIA_MUTATION);
  const [createMiembro] = useMutation(CREATE_MIEMBRO_MUTATION);
  const [updateMiembro] = useMutation(UPDATE_MIEMBRO_MUTATION);

  // Initialize formData from initialData when editing
  useEffect(() => {
    if (initialData && isOpen) {
      // Mapear visitadores (array de objetos a array de IDs)
      const visitadorIds = initialData.visitadores
        ? initialData.visitadores.map((v: any) => v.id)
        : (initialData.visitorUserIds || []);

      setFormData({
        // Mapear IDs de objetos relacionados
        barrioId: initialData.barrio?.id || initialData.barrioId || '',
        barrioOtro: initialData.barrioOtro || '',
        nucleoId: initialData.nucleo?.id || initialData.nucleoId || '',
        familiaId: initialData.familia?.id || initialData.familiaId || '',

        // Fecha y hora
        visitDate: initialData.visitDate || new Date().toISOString().split('T')[0],
        visitTime: initialData.visitTime || '18:00',

        // Mapear visitadores (array de objetos a array de IDs)
        visitorUserIds: visitadorIds,

        // Tipo de visita
        visitType: initialData.visitType || '',
        motivoNoVisita: initialData.motivoNoVisita || '',
        motivoNoVisitaOtra: initialData.motivoNoVisitaOtra || '',

        // Actividades de la visita - mapear todos los campos
        visitActivities: {
          conversacion_preocupaciones: initialData.visitActivities?.conversacion_preocupaciones || false,
          oraciones: initialData.visitActivities?.oraciones || false,
          estudio_instituto: initialData.visitActivities?.estudio_instituto || false,
          estudio_instituto_especificar: initialData.visitActivities?.estudio_instituto_especificar || '',
          otro_estudio: initialData.visitActivities?.otro_estudio || false,
          otro_estudio_especificar: initialData.visitActivities?.otro_estudio_especificar || '',
          invitacion_actividad: initialData.visitActivities?.invitacion_actividad || false,
          invitacion_especificar: initialData.visitActivities?.invitacion_especificar || '',
        },

        // Materiales dejados - mapear todos los campos
        materialDejado: {
          libro_oraciones: initialData.materialDejado?.libro_oraciones || false,
          otro: initialData.materialDejado?.otro || false,
          otro_especificar: initialData.materialDejado?.otro_especificar || '',
        },

        // Seguimiento
        seguimientoVisita: initialData.seguimientoVisita || false,
        tipoSeguimiento: initialData.tipoSeguimiento || '',
        seguimientoFecha: initialData.seguimientoFecha || '',
        seguimientoHora: initialData.seguimientoHora || '',
        seguimientoActividadBasica: initialData.seguimientoActividadBasica || false,
        seguimientoActividadBasicaEspecificar: initialData.seguimientoActividadBasicaEspecificar || '',
        seguimientoNinguno: initialData.seguimientoNinguno || false,

        // Notas adicionales
        additionalNotes: initialData.additionalNotes || '',
      });
    }
  }, [initialData, isOpen]);

  const barrios = barriosData?.barrios || [];
  const nucleos = nucleosData?.nucleos || [];
  const familias = familiasData?.familias || [];
  const miembros = miembrosData?.miembros || [];

  // Filtrar familias según barrio y núcleo seleccionados en Paso 1
  const familiasFiltradas = familias.filter((familia: any) => {
    // Si no se ha seleccionado barrio, mostrar todas
    if (!formData.barrioId) return true;

    // Si se seleccionó "OTRO" en barrio, no filtrar (las familias no tienen "OTRO" como barrioId)
    if (formData.barrioId === 'OTRO') return true;

    // Filtrar por barrioId
    const coincideBarrio = familia.barrioId === formData.barrioId;

    // Si no hay núcleo seleccionado, solo filtrar por barrio
    if (!formData.nucleoId) return coincideBarrio;

    // Filtrar por barrio Y núcleo
    return coincideBarrio && familia.nucleoId === formData.nucleoId;
  });

  const updateFormData = (updates: Partial<VisitaFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleCrearFamilia = async () => {
    if (!nuevaFamilia.nombre.trim()) {
      alert('El nombre de la familia es requerido');
      return;
    }

    try {
      // Crear la familia
      const { data: familiaData } = await createFamilia({
        variables: {
          input: {
            nombre: nuevaFamilia.nombre.trim(),
            direccion: nuevaFamilia.direccion?.trim() || undefined,
            telefono: nuevaFamilia.telefono?.trim() || undefined,
            email: nuevaFamilia.email?.trim() || undefined,
            barrioId: formData.barrioId !== 'OTRO' ? formData.barrioId : undefined,
            nucleoId: formData.nucleoId || undefined,
          },
        },
      });

      const familiaId = familiaData.createFamilia.id;

      // Ligar miembros existentes seleccionados a la familia
      for (const miembroId of miembrosSeleccionados) {
        await updateMiembro({
          variables: {
            id: miembroId,
            input: { familiaId },
          },
        });
      }

      // Crear nuevos miembros para la familia
      for (const nuevoMiembro of nuevosMiembros) {
        if (nuevoMiembro.nombre.trim()) {
          await createMiembro({
            variables: {
              input: {
                nombre: nuevoMiembro.nombre.trim(),
                apellidos: nuevoMiembro.apellidos?.trim() || undefined,
                rolFamiliar: nuevoMiembro.rolFamiliar || undefined,
                familiaId,
                barrioId: formData.barrioId !== 'OTRO' ? formData.barrioId : undefined,
                nucleoId: formData.nucleoId || undefined,
              },
            },
          });
        }
      }

      // Refrescar datos y seleccionar la nueva familia
      await refetchFamilias();
      await refetchMiembros();

      updateFormData({ familiaId });
      setMostrarCrearFamilia(false);
      setNuevaFamilia({ nombre: '', direccion: '', telefono: '', email: '' });
      setMiembrosSeleccionados([]);
      setNuevosMiembros([]);

      alert('Familia creada exitosamente');
    } catch (error: any) {
      alert(`Error al crear familia: ${error.message}`);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setFormData(INITIAL_FORM_DATA);
    setMostrarCrearFamilia(false);
    setNuevaFamilia({ nombre: '', direccion: '', telefono: '', email: '' });
    setMiembrosSeleccionados([]);
    setNuevosMiembros([]);
    onClose();
  };

  const validateStep = (step: number): { isValid: boolean; message?: string } => {
    switch (step) {
      case 1: // Barrio
        if (formData.barrioId === '' && formData.barrioOtro === '') {
          return { isValid: false, message: 'Selecciona un barrio' };
        }
        return { isValid: true };

      case 2: // Familia
        if (formData.familiaId === '') {
          return { isValid: false, message: 'Selecciona una familia' };
        }
        return { isValid: true };

      case 3: // Fecha y Hora
        if (formData.visitDate === '') {
          return { isValid: false, message: 'Ingresa la fecha de la visita' };
        }
        if (formData.visitTime === '') {
          return { isValid: false, message: 'Ingresa la hora de la visita' };
        }
        return { isValid: true };

      case 4: // Visitadores
        if (formData.visitorUserIds.length === 0) {
          return { isValid: false, message: 'Selecciona al menos un visitador' };
        }
        return { isValid: true };

      case 5: // Tipo y Actividades
        if (formData.visitType === '') {
          return { isValid: false, message: 'Selecciona el tipo de visita' };
        }

        // Validar campos condicionales de actividades
        if (formData.visitActivities.estudio_instituto && (!formData.visitActivities.estudio_instituto_especificar || !formData.visitActivities.estudio_instituto_especificar.trim())) {
          return { isValid: false, message: 'Especifica cuál estudio del instituto se realizó' };
        }
        if (formData.visitActivities.otro_estudio && (!formData.visitActivities.otro_estudio_especificar || !formData.visitActivities.otro_estudio_especificar.trim())) {
          return { isValid: false, message: 'Especifica cuál otro estudio se realizó' };
        }
        if (formData.visitActivities.invitacion_actividad && (!formData.visitActivities.invitacion_especificar || !formData.visitActivities.invitacion_especificar.trim())) {
          return { isValid: false, message: 'Especifica a cuál actividad se invitó' };
        }
        return { isValid: true };

      case 6: // Materiales
        // Validar campo condicional de materiales
        if (formData.materialDejado.otro && (!formData.materialDejado.otro_especificar || !formData.materialDejado.otro_especificar.trim())) {
          return { isValid: false, message: 'Especifica cuál otro material se dejó' };
        }
        return { isValid: true };

      case 7: // Seguimiento (opcional)
        return { isValid: true };

      case 8: // Notas (opcional)
        return { isValid: true };

      default:
        return { isValid: true };
    }
  };

  const handleNext = () => {
    const validation = validateStep(currentStep);
    if (validation.isValid) {
      if (currentStep < 8) {
        setCurrentStep(prev => prev + 1);
      } else {
        handleSubmit();
      }
    } else {
      alert(validation.message || 'Por favor completa los campos requeridos');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    // Calcular seguimientoVisita basándose en las opciones seleccionadas
    const tieneSeguimiento = formData.tipoSeguimiento !== '' || formData.seguimientoActividadBasica;

    // Limpiar __typename de los objetos (agregado por Apollo Client)
    const cleanVisitActivities = {
      conversacion_preocupaciones: formData.visitActivities.conversacion_preocupaciones,
      oraciones: formData.visitActivities.oraciones,
      estudio_instituto: formData.visitActivities.estudio_instituto,
      estudio_instituto_especificar: formData.visitActivities.estudio_instituto_especificar,
      otro_estudio: formData.visitActivities.otro_estudio,
      otro_estudio_especificar: formData.visitActivities.otro_estudio_especificar,
      invitacion_actividad: formData.visitActivities.invitacion_actividad,
      invitacion_especificar: formData.visitActivities.invitacion_especificar,
    };

    const cleanMaterialDejado = {
      libro_oraciones: formData.materialDejado.libro_oraciones,
      otro: formData.materialDejado.otro,
      otro_especificar: formData.materialDejado.otro_especificar,
    };

    const input = {
      familiaId: formData.familiaId,
      visitDate: formData.visitDate,
      visitTime: formData.visitTime,
      barrioId: formData.barrioId || undefined,
      barrioOtro: formData.barrioOtro || undefined,
      nucleoId: formData.nucleoId || undefined,
      visitorUserIds: formData.visitorUserIds,
      visitType: formData.visitType,
      motivoNoVisita: formData.motivoNoVisita || undefined,
      motivoNoVisitaOtra: formData.motivoNoVisitaOtra || undefined,
      visitActivities: cleanVisitActivities,
      materialDejado: cleanMaterialDejado,
      seguimientoVisita: tieneSeguimiento,
      tipoSeguimiento: formData.tipoSeguimiento || undefined,
      seguimientoFecha: formData.seguimientoFecha || undefined,
      seguimientoHora: formData.seguimientoHora || undefined,
      seguimientoActividadBasica: formData.seguimientoActividadBasica,
      seguimientoActividadBasicaEspecificar: formData.seguimientoActividadBasicaEspecificar || undefined,
      seguimientoNinguno: formData.seguimientoNinguno,
      additionalNotes: formData.additionalNotes || undefined,
    };

    if (visitaId) {
      // UPDATE mode
      updateVisita({ variables: { id: visitaId, input } });
    } else {
      // CREATE mode
      createVisita({ variables: { input } });
    }
  };

  const isLoading = creating || updating;

  if (!isOpen) return null;

  const steps = [
    'Barrio',
    'Familia',
    'Fecha y Hora',
    'Visitadores',
    'Tipo de Visita',
    'Materiales',
    'Seguimiento',
    'Notas',
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-primary-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{visitaId ? 'Editar Visita' : 'Nueva Visita'}</h2>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200"
              disabled={isLoading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between mb-2">
            {steps.map((_step, index) => (
              <div
                key={index}
                className={`flex-1 ${index < steps.length - 1 ? 'mr-2' : ''}`}
              >
                <div
                  className={`h-2 rounded-full transition-colors ${
                    index + 1 <= currentStep
                      ? 'bg-primary-600'
                      : 'bg-gray-200'
                  }`}
                />
              </div>
            ))}
          </div>
          <div className="text-sm text-gray-600 text-center">
            Paso {currentStep} de {steps.length}: {steps[currentStep - 1]}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 250px)' }}>
          {/* Paso 1: Barrio */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Paso 1: Selecciona el Barrio</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Barrio <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.barrioId}
                  onChange={(e) => {
                    updateFormData({ barrioId: e.target.value, barrioOtro: '' });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Selecciona un barrio</option>
                  {barrios.map((barrio: any) => (
                    <option key={barrio.id} value={barrio.id}>
                      {barrio.nombre}
                    </option>
                  ))}
                  <option value="OTRO">Otro (especificar)</option>
                </select>
              </div>

              {formData.barrioId === 'OTRO' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Especificar barrio
                  </label>
                  <input
                    type="text"
                    value={formData.barrioOtro}
                    onChange={(e) => updateFormData({ barrioOtro: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Nombre del barrio"
                  />
                </div>
              )}

              {/* Núcleo solo si es Santa Mónica */}
              {barrios.find((b: any) => b.id === formData.barrioId)?.nombre === 'Santa Mónica' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Núcleo (opcional)
                  </label>
                  <select
                    value={formData.nucleoId}
                    onChange={(e) => updateFormData({ nucleoId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Selecciona un núcleo</option>
                    {nucleos.map((nucleo: any) => (
                      <option key={nucleo.id} value={nucleo.id}>
                        {nucleo.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Paso 2: Familia */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Paso 2: Selecciona la Familia</h3>
                <button
                  type="button"
                  onClick={() => setMostrarCrearFamilia(!mostrarCrearFamilia)}
                  className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  {mostrarCrearFamilia ? 'Cancelar' : '+ Crear Familia'}
                </button>
              </div>

              {!mostrarCrearFamilia ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Familia <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.familiaId}
                      onChange={(e) => updateFormData({ familiaId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Selecciona una familia</option>
                      {familiasFiltradas.map((familia: any) => (
                        <option key={familia.id} value={familia.id}>
                          {familia.nombre} {familia.direccion ? `- ${familia.direccion}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 space-y-4">
                  <h4 className="font-medium text-gray-900">Crear Nueva Familia</h4>

                  {/* Datos de la Familia */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre de la Familia <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={nuevaFamilia.nombre}
                        onChange={(e) => setNuevaFamilia({ ...nuevaFamilia, nombre: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Ej: Familia García"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                      <input
                        type="text"
                        value={nuevaFamilia.direccion}
                        onChange={(e) => setNuevaFamilia({ ...nuevaFamilia, direccion: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Calle 123"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                      <input
                        type="tel"
                        value={nuevaFamilia.telefono}
                        onChange={(e) => setNuevaFamilia({ ...nuevaFamilia, telefono: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="1234567890"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={nuevaFamilia.email}
                        onChange={(e) => setNuevaFamilia({ ...nuevaFamilia, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="familia@ejemplo.com"
                      />
                    </div>
                  </div>

                  {/* Miembros Existentes */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Ligar Miembros Existentes (opcional)</h5>
                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2 bg-white space-y-1">
                      {miembros.filter((m: any) => !m.familiaId).map((miembro: any) => (
                        <label key={miembro.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={miembrosSeleccionados.includes(miembro.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setMiembrosSeleccionados([...miembrosSeleccionados, miembro.id]);
                              } else {
                                setMiembrosSeleccionados(miembrosSeleccionados.filter(id => id !== miembro.id));
                              }
                            }}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm">{miembro.nombre} {miembro.apellidos}</span>
                        </label>
                      ))}
                      {miembros.filter((m: any) => !m.familiaId).length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-2">No hay miembros sin familia</p>
                      )}
                    </div>
                  </div>

                  {/* Nuevos Miembros */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="text-sm font-medium text-gray-900">Agregar Nuevos Miembros (opcional)</h5>
                      <button
                        type="button"
                        onClick={() => setNuevosMiembros([...nuevosMiembros, { nombre: '', apellidos: '', rolFamiliar: '' }])}
                        className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        + Agregar Miembro
                      </button>
                    </div>

                    {nuevosMiembros.length > 0 && (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {nuevosMiembros.map((miembro, index) => (
                          <div key={index} className="grid grid-cols-3 gap-2 p-2 bg-white border border-gray-200 rounded">
                            <input
                              type="text"
                              value={miembro.nombre}
                              onChange={(e) => {
                                const updated = [...nuevosMiembros];
                                updated[index].nombre = e.target.value;
                                setNuevosMiembros(updated);
                              }}
                              className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                              placeholder="Nombre *"
                            />
                            <input
                              type="text"
                              value={miembro.apellidos}
                              onChange={(e) => {
                                const updated = [...nuevosMiembros];
                                updated[index].apellidos = e.target.value;
                                setNuevosMiembros(updated);
                              }}
                              className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                              placeholder="Apellidos"
                            />
                            <div className="flex gap-1">
                              <select
                                value={miembro.rolFamiliar}
                                onChange={(e) => {
                                  const updated = [...nuevosMiembros];
                                  updated[index].rolFamiliar = e.target.value;
                                  setNuevosMiembros(updated);
                                }}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                              >
                                <option value="">Rol</option>
                                <option value="Padre">Padre</option>
                                <option value="Madre">Madre</option>
                                <option value="Hijo">Hijo</option>
                                <option value="Hija">Hija</option>
                                <option value="Abuelo">Abuelo</option>
                                <option value="Abuela">Abuela</option>
                                <option value="Otro">Otro</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => setNuevosMiembros(nuevosMiembros.filter((_, i) => i !== index))}
                                className="px-2 text-red-600 hover:text-red-800"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleCrearFamilia}
                    disabled={creandoFamilia}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {creandoFamilia ? 'Creando...' : 'Guardar Familia y Continuar'}
                  </button>
                </div>
              )}

              {formData.barrioId && formData.barrioId !== 'OTRO' && familiasFiltradas.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex items-start gap-2 text-sm text-yellow-700">
                    <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>No hay familias registradas para el barrio{formData.nucleoId ? ' y núcleo' : ''} seleccionado. Deberás crear la familia desde el módulo de Familias asignándola al barrio{formData.nucleoId ? ' y núcleo' : ''} correspondiente.</p>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex items-start gap-2 text-sm text-blue-700">
                  <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>Mostrando familias del {formData.nucleoId ? 'núcleo y ' : ''}barrio seleccionado. Si no encuentras la familia, verifica que esté asignada al barrio{formData.nucleoId ? ' y núcleo' : ''} correcto en el catálogo de familias.</p>
                </div>
              </div>
            </div>
          )}

          {/* Paso 3: Fecha y Hora */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Paso 3: Fecha y Hora de la Visita</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.visitDate}
                    onChange={(e) => updateFormData({ visitDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.visitTime}
                    onChange={(e) => updateFormData({ visitTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Paso 4: Visitadores */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Paso 4: Visitadores</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecciona los visitadores <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-300 rounded-md p-3">
                  {miembros.map((miembro: any) => (
                    <label key={miembro.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={formData.visitorUserIds.includes(miembro.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateFormData({
                              visitorUserIds: [...formData.visitorUserIds, miembro.id],
                            });
                          } else {
                            updateFormData({
                              visitorUserIds: formData.visitorUserIds.filter(id => id !== miembro.id),
                            });
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">
                        {miembro.nombre} {miembro.apellidos}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Info className="w-4 h-4 flex-shrink-0" />
                  <p>Seleccionados: {formData.visitorUserIds.length} visitador(es)</p>
                </div>
              </div>
            </div>
          )}

          {/* Paso 5: Tipo y Actividades */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Paso 5: Tipo de Visita y Actividades</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Visita <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="visitType"
                      value="primera_visita"
                      checked={formData.visitType === 'primera_visita'}
                      onChange={(e) => updateFormData({ visitType: e.target.value })}
                      className="border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Primera Visita</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="visitType"
                      value="visita_seguimiento"
                      checked={formData.visitType === 'visita_seguimiento'}
                      onChange={(e) => updateFormData({ visitType: e.target.value })}
                      className="border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Visita de Seguimiento</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="visitType"
                      value="no_se_pudo_realizar"
                      checked={formData.visitType === 'no_se_pudo_realizar'}
                      onChange={(e) => updateFormData({ visitType: e.target.value })}
                      className="border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">No se pudo realizar</span>
                  </label>
                </div>
              </div>

              {/* Si es "No se pudo realizar" */}
              {formData.visitType === 'no_se_pudo_realizar' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo
                  </label>
                  <select
                    value={formData.motivoNoVisita}
                    onChange={(e) => updateFormData({ motivoNoVisita: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Selecciona un motivo</option>
                    <option value="no_abrieron">No abrieron la puerta</option>
                    <option value="sin_tiempo">No tenían tiempo</option>
                    <option value="otra">Otra razón</option>
                  </select>

                  {formData.motivoNoVisita === 'otra' && (
                    <input
                      type="text"
                      value={formData.motivoNoVisitaOtra}
                      onChange={(e) => updateFormData({ motivoNoVisitaOtra: e.target.value })}
                      className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Especificar motivo"
                    />
                  )}
                </div>
              )}

              {/* Si NO es "No se pudo realizar" → mostrar actividades */}
              {formData.visitType && formData.visitType !== 'no_se_pudo_realizar' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Actividades realizadas
                  </label>
                  <div className="space-y-3 bg-gray-50 p-4 rounded-md">
                    <label className="flex items-start space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.visitActivities.conversacion_preocupaciones}
                        onChange={(e) =>
                          updateFormData({
                            visitActivities: {
                              ...formData.visitActivities,
                              conversacion_preocupaciones: e.target.checked,
                            },
                          })
                        }
                        className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">Conversación sobre preocupaciones</span>
                    </label>

                    <label className="flex items-start space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.visitActivities.oraciones}
                        onChange={(e) =>
                          updateFormData({
                            visitActivities: {
                              ...formData.visitActivities,
                              oraciones: e.target.checked,
                            },
                          })
                        }
                        className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">Oraciones</span>
                    </label>

                    <div>
                      <label className="flex items-start space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.visitActivities.estudio_instituto}
                          onChange={(e) =>
                            updateFormData({
                              visitActivities: {
                                ...formData.visitActivities,
                                estudio_instituto: e.target.checked,
                              },
                            })
                          }
                          className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">Estudio de instituto</span>
                      </label>
                      {formData.visitActivities.estudio_instituto && (
                        <input
                          type="text"
                          value={formData.visitActivities.estudio_instituto_especificar}
                          onChange={(e) =>
                            updateFormData({
                              visitActivities: {
                                ...formData.visitActivities,
                                estudio_instituto_especificar: e.target.value,
                              },
                            })
                          }
                          className="mt-2 ml-6 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          placeholder="¿Cuál?"
                        />
                      )}
                    </div>

                    <div>
                      <label className="flex items-start space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.visitActivities.otro_estudio}
                          onChange={(e) =>
                            updateFormData({
                              visitActivities: {
                                ...formData.visitActivities,
                                otro_estudio: e.target.checked,
                              },
                            })
                          }
                          className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">Otro estudio</span>
                      </label>
                      {formData.visitActivities.otro_estudio && (
                        <input
                          type="text"
                          value={formData.visitActivities.otro_estudio_especificar}
                          onChange={(e) =>
                            updateFormData({
                              visitActivities: {
                                ...formData.visitActivities,
                                otro_estudio_especificar: e.target.value,
                              },
                            })
                          }
                          className="mt-2 ml-6 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Especificar"
                        />
                      )}
                    </div>

                    <div>
                      <label className="flex items-start space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.visitActivities.invitacion_actividad}
                          onChange={(e) =>
                            updateFormData({
                              visitActivities: {
                                ...formData.visitActivities,
                                invitacion_actividad: e.target.checked,
                              },
                            })
                          }
                          className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">Invitación a alguna actividad</span>
                      </label>
                      {formData.visitActivities.invitacion_actividad && (
                        <input
                          type="text"
                          value={formData.visitActivities.invitacion_especificar}
                          onChange={(e) =>
                            updateFormData({
                              visitActivities: {
                                ...formData.visitActivities,
                                invitacion_especificar: e.target.value,
                              },
                            })
                          }
                          className="mt-2 ml-6 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          placeholder="¿A cuál actividad?"
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Paso 6: Materiales */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Paso 6: Materiales Dejados</h3>

              <div className="space-y-3">
                <label className="flex items-start space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.materialDejado.libro_oraciones}
                    onChange={(e) =>
                      updateFormData({
                        materialDejado: {
                          ...formData.materialDejado,
                          libro_oraciones: e.target.checked,
                        },
                      })
                    }
                    className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Libro de oraciones</span>
                </label>

                <div>
                  <label className="flex items-start space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.materialDejado.otro}
                      onChange={(e) =>
                        updateFormData({
                          materialDejado: {
                            ...formData.materialDejado,
                            otro: e.target.checked,
                          },
                        })
                      }
                      className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Otro material</span>
                  </label>
                  {formData.materialDejado.otro && (
                    <input
                      type="text"
                      value={formData.materialDejado.otro_especificar}
                      onChange={(e) =>
                        updateFormData({
                          materialDejado: {
                            ...formData.materialDejado,
                            otro_especificar: e.target.value,
                          },
                        })
                      }
                      className="mt-2 ml-6 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Especificar material"
                    />
                  )}
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>Este paso es opcional. Si no se dejó ningún material, simplemente continúa al siguiente paso.</p>
                </div>
              </div>
            </div>
          )}

          {/* Paso 7: Seguimiento */}
          {currentStep === 7 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Paso 7: Seguimiento</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de seguimiento
                </label>
                <div className="space-y-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="tipoSeguimiento"
                          value="por_agendar"
                          checked={formData.tipoSeguimiento === 'por_agendar'}
                          onChange={(e) => {
                            updateFormData({
                              tipoSeguimiento: e.target.value,
                              seguimientoActividadBasica: false,
                              seguimientoActividadBasicaEspecificar: '',
                              seguimientoNinguno: false
                            });
                          }}
                          className="border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">Por agendar</span>
                      </label>

                      <div>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="tipoSeguimiento"
                            value="agendado"
                            checked={formData.tipoSeguimiento === 'agendado'}
                            onChange={(e) => {
                              updateFormData({
                                tipoSeguimiento: e.target.value,
                                seguimientoActividadBasica: false,
                                seguimientoActividadBasicaEspecificar: '',
                                seguimientoNinguno: false
                              });
                            }}
                            className="border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-700">Agendado</span>
                        </label>
                        {formData.tipoSeguimiento === 'agendado' && (
                          <div className="grid grid-cols-2 gap-4 mt-2 ml-6">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                Fecha
                              </label>
                              <input
                                type="date"
                                value={formData.seguimientoFecha}
                                onChange={(e) => updateFormData({ seguimientoFecha: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                Hora
                              </label>
                              <input
                                type="time"
                                value={formData.seguimientoHora}
                                onChange={(e) => updateFormData({ seguimientoHora: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="flex items-start space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="tipoSeguimiento"
                            value="actividad_basica"
                            checked={formData.seguimientoActividadBasica}
                            onChange={(e) => {
                              if (e.target.checked) {
                                updateFormData({
                                  tipoSeguimiento: '',
                                  seguimientoActividadBasica: true,
                                  seguimientoNinguno: false
                                });
                              }
                            }}
                            className="mt-1 border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-700">Invitar a actividad básica</span>
                        </label>
                        {formData.seguimientoActividadBasica && (
                          <input
                            type="text"
                            value={formData.seguimientoActividadBasicaEspecificar}
                            onChange={(e) =>
                              updateFormData({ seguimientoActividadBasicaEspecificar: e.target.value })
                            }
                            className="mt-2 ml-6 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            placeholder="¿Cuál actividad?"
                          />
                        )}
                      </div>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tipoSeguimiento"
                      value="ninguno"
                      checked={formData.seguimientoNinguno}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateFormData({
                            tipoSeguimiento: '',
                            seguimientoActividadBasica: false,
                            seguimientoActividadBasicaEspecificar: '',
                            seguimientoNinguno: true
                          });
                        }
                      }}
                      className="border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Ninguno</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Paso 8: Notas */}
          {currentStep === 8 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Paso 8: Notas Adicionales</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  value={formData.additionalNotes}
                  onChange={(e) => updateFormData({ additionalNotes: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Escribe cualquier observación adicional sobre la visita..."
                />
              </div>

              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <p>¡Último paso! Revisa los datos y haz clic en "Guardar Visita" para finalizar.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1 || isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>

          <div className="text-sm text-gray-500">
            {currentStep} / {steps.length}
          </div>

          <button
            onClick={handleNext}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Guardando...
              </span>
            ) : currentStep === 8 ? (
              visitaId ? 'Actualizar Visita' : 'Guardar Visita'
            ) : (
              'Siguiente'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
