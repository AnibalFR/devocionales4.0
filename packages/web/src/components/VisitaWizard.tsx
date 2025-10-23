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
    }
  }
`;

const MIEMBROS_QUERY = gql`
  query Miembros {
    miembros {
      id
      nombre
      apellidos
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

  const { data: barriosData } = useQuery(BARRIOS_QUERY);
  const { data: nucleosData } = useQuery(NUCLEOS_QUERY);
  const { data: familiasData } = useQuery(FAMILIAS_QUERY);
  const { data: miembrosData } = useQuery(MIEMBROS_QUERY);

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

  // Initialize formData from initialData when editing
  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        barrioId: initialData.barrioId || '',
        barrioOtro: initialData.barrioOtro || '',
        nucleoId: initialData.nucleoId || '',
        familiaId: initialData.familiaId || '',
        visitDate: initialData.visitDate || new Date().toISOString().split('T')[0],
        visitTime: initialData.visitTime || '18:00',
        visitorUserIds: initialData.visitorUserIds || [],
        visitType: initialData.visitType || '',
        motivoNoVisita: initialData.motivoNoVisita || '',
        motivoNoVisitaOtra: initialData.motivoNoVisitaOtra || '',
        visitActivities: initialData.visitActivities || {
          conversacion_preocupaciones: false,
          oraciones: false,
          estudio_instituto: false,
          estudio_instituto_especificar: '',
          otro_estudio: false,
          otro_estudio_especificar: '',
          invitacion_actividad: false,
          invitacion_especificar: '',
        },
        materialDejado: initialData.materialDejado || {
          libro_oraciones: false,
          otro: false,
          otro_especificar: '',
        },
        seguimientoVisita: initialData.seguimientoVisita || false,
        tipoSeguimiento: initialData.tipoSeguimiento || '',
        seguimientoFecha: initialData.seguimientoFecha || '',
        seguimientoHora: initialData.seguimientoHora || '',
        seguimientoActividadBasica: initialData.seguimientoActividadBasica || false,
        seguimientoActividadBasicaEspecificar: initialData.seguimientoActividadBasicaEspecificar || '',
        seguimientoNinguno: initialData.seguimientoNinguno || false,
        additionalNotes: initialData.additionalNotes || '',
      });
    }
  }, [initialData, isOpen]);

  const barrios = barriosData?.barrios || [];
  const nucleos = nucleosData?.nucleos || [];
  const familias = familiasData?.familias || [];
  const miembros = miembrosData?.miembros || [];

  const updateFormData = (updates: Partial<VisitaFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleClose = () => {
    setCurrentStep(1);
    setFormData(INITIAL_FORM_DATA);
    onClose();
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Barrio
        return formData.barrioId !== '' || formData.barrioOtro !== '';
      case 2: // Familia
        return formData.familiaId !== '';
      case 3: // Fecha y Hora
        return formData.visitDate !== '' && formData.visitTime !== '';
      case 4: // Visitadores
        return formData.visitorUserIds.length > 0;
      case 5: // Tipo
        return formData.visitType !== '';
      case 6: // Materiales (opcional)
        return true;
      case 7: // Seguimiento (opcional)
        return true;
      case 8: // Notas (opcional)
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 8) {
        setCurrentStep(prev => prev + 1);
      } else {
        handleSubmit();
      }
    } else {
      alert('Por favor completa los campos requeridos');
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
      visitActivities: formData.visitActivities,
      materialDejado: formData.materialDejado,
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
              <h3 className="text-lg font-semibold text-gray-900">Paso 2: Selecciona la Familia</h3>

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
                  {familias.map((familia: any) => (
                    <option key={familia.id} value={familia.id}>
                      {familia.nombre} {familia.direccion ? `- ${familia.direccion}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex items-start gap-2 text-sm text-blue-700">
                  <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>Si la familia no aparece en la lista, deberás crearla desde el módulo de Familias primero.</p>
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
