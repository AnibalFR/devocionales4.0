import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Button, TextInput, RadioButton, Checkbox, ProgressBar, Portal, Modal } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../src/constants/colors';
import { VISITAS_QUERY } from '../src/graphql/visitas';

// GraphQL Queries y Mutations
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

const STEPS = [
  'Barrio',
  'Familia',
  'Fecha y Hora',
  'Visitadores',
  'Tipo de Visita',
  'Materiales',
  'Seguimiento',
  'Notas',
];

export default function NuevaVisitaScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<VisitaFormData>(INITIAL_FORM_DATA);
  const [validationError, setValidationError] = useState<string>('');

  // Queries
  const { data: barriosData } = useQuery(BARRIOS_QUERY);
  const { data: nucleosData } = useQuery(NUCLEOS_QUERY);
  const { data: familiasData } = useQuery(FAMILIAS_QUERY);
  const { data: miembrosData } = useQuery(MIEMBROS_QUERY);

  // Mutation
  const [createVisita, { loading }] = useMutation(CREATE_VISITA_MUTATION, {
    refetchQueries: [{ query: VISITAS_QUERY }],
    awaitRefetchQueries: true,
    onCompleted: () => {
      router.back();
    },
    onError: (error) => {
      setValidationError(`Error al crear visita: ${error.message}`);
    },
  });

  const barrios = barriosData?.barrios || [];
  const nucleos = nucleosData?.nucleos || [];
  const familias = familiasData?.familias || [];
  const miembros = miembrosData?.miembros || [];

  // Filtrar familias según barrio y núcleo seleccionados
  const familiasFiltradas = familias.filter((familia: any) => {
    if (!formData.barrioId) return true;
    if (formData.barrioId === 'OTRO') return true;
    const coincideBarrio = familia.barrioId === formData.barrioId;
    if (!formData.nucleoId) return coincideBarrio;
    return coincideBarrio && familia.nucleoId === formData.nucleoId;
  });

  const updateFormData = (updates: Partial<VisitaFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    setValidationError('');
  };

  const validateStep = (step: number): { isValid: boolean; message?: string } => {
    switch (step) {
      case 1:
        if (formData.barrioId === '' && formData.barrioOtro === '') {
          return { isValid: false, message: 'Selecciona un barrio' };
        }
        return { isValid: true };
      case 2:
        if (formData.familiaId === '') {
          return { isValid: false, message: 'Selecciona una familia' };
        }
        return { isValid: true };
      case 3:
        if (formData.visitDate === '') {
          return { isValid: false, message: 'Ingresa la fecha de la visita' };
        }
        if (formData.visitTime === '') {
          return { isValid: false, message: 'Ingresa la hora de la visita' };
        }
        return { isValid: true };
      case 4:
        if (formData.visitorUserIds.length === 0) {
          return { isValid: false, message: 'Selecciona al menos un visitador' };
        }
        return { isValid: true };
      case 5:
        if (formData.visitType === '') {
          return { isValid: false, message: 'Selecciona el tipo de visita' };
        }
        if (formData.visitActivities.estudio_instituto && !formData.visitActivities.estudio_instituto_especificar.trim()) {
          return { isValid: false, message: 'Especifica cuál estudio del instituto' };
        }
        if (formData.visitActivities.otro_estudio && !formData.visitActivities.otro_estudio_especificar.trim()) {
          return { isValid: false, message: 'Especifica cuál otro estudio' };
        }
        if (formData.visitActivities.invitacion_actividad && !formData.visitActivities.invitacion_especificar.trim()) {
          return { isValid: false, message: 'Especifica a cuál actividad se invitó' };
        }
        return { isValid: true };
      case 6:
        if (formData.materialDejado.otro && !formData.materialDejado.otro_especificar.trim()) {
          return { isValid: false, message: 'Especifica cuál otro material' };
        }
        return { isValid: true };
      default:
        return { isValid: true };
    }
  };

  const handleNext = () => {
    const validation = validateStep(currentStep);
    if (!validation.isValid) {
      setValidationError(validation.message || 'Por favor completa los campos requeridos');
      return;
    }

    if (currentStep < STEPS.length) {
      setCurrentStep((prev) => prev + 1);
      setValidationError('');
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      setValidationError('');
    }
  };

  const handleSubmit = () => {
    const tieneSeguimiento = formData.tipoSeguimiento !== '' || formData.seguimientoActividadBasica;

    const input = {
      familiaId: formData.familiaId,
      visitDate: formData.visitDate,
      visitTime: formData.visitTime,
      barrioId: formData.barrioId !== 'OTRO' ? formData.barrioId : undefined,
      barrioOtro: formData.barrioOtro || undefined,
      nucleoId: formData.nucleoId || undefined,
      visitorUserIds: formData.visitorUserIds,
      visitType: formData.visitType,
      motivoNoVisita: formData.motivoNoVisita || undefined,
      motivoNoVisitaOtra: formData.motivoNoVisitaOtra || undefined,
      visitActivities: {
        conversacion_preocupaciones: formData.visitActivities.conversacion_preocupaciones,
        oraciones: formData.visitActivities.oraciones,
        estudio_instituto: formData.visitActivities.estudio_instituto,
        estudio_instituto_especificar: formData.visitActivities.estudio_instituto_especificar,
        otro_estudio: formData.visitActivities.otro_estudio,
        otro_estudio_especificar: formData.visitActivities.otro_estudio_especificar,
        invitacion_actividad: formData.visitActivities.invitacion_actividad,
        invitacion_especificar: formData.visitActivities.invitacion_especificar,
      },
      materialDejado: {
        libro_oraciones: formData.materialDejado.libro_oraciones,
        otro: formData.materialDejado.otro,
        otro_especificar: formData.materialDejado.otro_especificar,
      },
      seguimientoVisita: tieneSeguimiento,
      tipoSeguimiento: formData.tipoSeguimiento || undefined,
      seguimientoFecha: formData.seguimientoFecha || undefined,
      seguimientoHora: formData.seguimientoHora || undefined,
      seguimientoActividadBasica: formData.seguimientoActividadBasica,
      seguimientoActividadBasicaEspecificar: formData.seguimientoActividadBasicaEspecificar || undefined,
      seguimientoNinguno: formData.seguimientoNinguno,
      additionalNotes: formData.additionalNotes || undefined,
    };

    createVisita({ variables: { input } });
  };

  const progress = currentStep / STEPS.length;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <Button mode="text" onPress={() => router.back()} textColor="#fff" icon="close">
          Cancelar
        </Button>
        <Text variant="headlineSmall" style={styles.title}>
          Nueva Visita
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <ProgressBar progress={progress} color={colors.primary} style={styles.progressBar} />
        <Text variant="bodySmall" style={styles.stepText}>
          Paso {currentStep} de {STEPS.length}: {STEPS[currentStep - 1]}
        </Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Error Message */}
        {validationError !== '' && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error" size={20} color={colors.error} />
            <Text style={styles.errorText}>{validationError}</Text>
          </View>
        )}

        {/* Paso 1: Barrio */}
        {currentStep === 1 && (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <MaterialCommunityIcons name="home-group" size={32} color={colors.primary} />
              <Text variant="titleLarge" style={styles.stepTitle}>
                Selecciona el Barrio
              </Text>
            </View>

            <View style={styles.radioGroup}>
              <Text variant="labelLarge" style={styles.label}>
                Barrio <Text style={styles.required}>*</Text>
              </Text>
              {barrios.map((barrio: any) => (
                <TouchableOpacity
                  key={barrio.id}
                  style={styles.radioItem}
                  onPress={() => updateFormData({ barrioId: barrio.id, barrioOtro: '' })}
                >
                  <RadioButton
                    value={barrio.id}
                    status={formData.barrioId === barrio.id ? 'checked' : 'unchecked'}
                    color={colors.primary}
                  />
                  <Text variant="bodyLarge">{barrio.nombre}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.radioItem}
                onPress={() => updateFormData({ barrioId: 'OTRO' })}
              >
                <RadioButton
                  value="OTRO"
                  status={formData.barrioId === 'OTRO' ? 'checked' : 'unchecked'}
                  color={colors.primary}
                />
                <Text variant="bodyLarge">Otro (especificar)</Text>
              </TouchableOpacity>
            </View>

            {formData.barrioId === 'OTRO' && (
              <TextInput
                mode="outlined"
                label="Especificar barrio"
                value={formData.barrioOtro}
                onChangeText={(text) => updateFormData({ barrioOtro: text })}
                style={styles.input}
                outlineColor={colors.gray300}
                activeOutlineColor={colors.primary}
              />
            )}

            {barrios.find((b: any) => b.id === formData.barrioId)?.nombre === 'Santa Mónica' && (
              <View style={styles.radioGroup}>
                <Text variant="labelLarge" style={styles.label}>
                  Núcleo (opcional)
                </Text>
                {nucleos.map((nucleo: any) => (
                  <TouchableOpacity
                    key={nucleo.id}
                    style={styles.radioItem}
                    onPress={() => updateFormData({ nucleoId: nucleo.id })}
                  >
                    <RadioButton
                      value={nucleo.id}
                      status={formData.nucleoId === nucleo.id ? 'checked' : 'unchecked'}
                      color={colors.primary}
                    />
                    <Text variant="bodyLarge">{nucleo.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Paso 2: Familia */}
        {currentStep === 2 && (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <MaterialCommunityIcons name="account-group" size={32} color={colors.primary} />
              <Text variant="titleLarge" style={styles.stepTitle}>
                Selecciona la Familia
              </Text>
            </View>

            <View style={styles.radioGroup}>
              <Text variant="labelLarge" style={styles.label}>
                Familia <Text style={styles.required}>*</Text>
              </Text>
              {familiasFiltradas.length === 0 ? (
                <View style={styles.emptyMessage}>
                  <MaterialIcons name="info" size={24} color={colors.info} />
                  <Text variant="bodyMedium" style={styles.emptyText}>
                    No hay familias para el barrio{formData.nucleoId ? ' y núcleo' : ''} seleccionado
                  </Text>
                </View>
              ) : (
                <ScrollView style={styles.familiasList}>
                  {familiasFiltradas.map((familia: any) => (
                    <TouchableOpacity
                      key={familia.id}
                      style={styles.radioItem}
                      onPress={() => updateFormData({ familiaId: familia.id })}
                    >
                      <RadioButton
                        value={familia.id}
                        status={formData.familiaId === familia.id ? 'checked' : 'unchecked'}
                        color={colors.primary}
                      />
                      <View style={styles.familiaInfo}>
                        <Text variant="bodyLarge">{familia.nombre}</Text>
                        {familia.direccion && (
                          <Text variant="bodySmall" style={styles.familiaAddress}>
                            {familia.direccion}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        )}

        {/* Paso 3: Fecha y Hora */}
        {currentStep === 3 && (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <MaterialIcons name="event" size={32} color={colors.primary} />
              <Text variant="titleLarge" style={styles.stepTitle}>
                Fecha y Hora de la Visita
              </Text>
            </View>

            <TextInput
              mode="outlined"
              label="Fecha *"
              value={formData.visitDate}
              onChangeText={(text) => updateFormData({ visitDate: text })}
              style={styles.input}
              outlineColor={colors.gray300}
              activeOutlineColor={colors.primary}
              placeholder="YYYY-MM-DD"
              keyboardType="numeric"
            />

            <TextInput
              mode="outlined"
              label="Hora *"
              value={formData.visitTime}
              onChangeText={(text) => updateFormData({ visitTime: text })}
              style={styles.input}
              outlineColor={colors.gray300}
              activeOutlineColor={colors.primary}
              placeholder="HH:MM"
              keyboardType="numeric"
            />
          </View>
        )}

        {/* Paso 4: Visitadores */}
        {currentStep === 4 && (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <MaterialIcons name="people" size={32} color={colors.primary} />
              <Text variant="titleLarge" style={styles.stepTitle}>
                Selecciona Visitadores
              </Text>
            </View>

            <Text variant="labelLarge" style={styles.label}>
              Visitadores <Text style={styles.required}>*</Text>
            </Text>
            <ScrollView style={styles.checkboxList}>
              {miembros.map((miembro: any) => (
                <TouchableOpacity
                  key={miembro.id}
                  style={styles.checkboxItem}
                  onPress={() => {
                    const isSelected = formData.visitorUserIds.includes(miembro.id);
                    if (isSelected) {
                      updateFormData({
                        visitorUserIds: formData.visitorUserIds.filter((id) => id !== miembro.id),
                      });
                    } else {
                      updateFormData({
                        visitorUserIds: [...formData.visitorUserIds, miembro.id],
                      });
                    }
                  }}
                >
                  <Checkbox
                    status={formData.visitorUserIds.includes(miembro.id) ? 'checked' : 'unchecked'}
                    color={colors.primary}
                  />
                  <Text variant="bodyLarge">
                    {miembro.nombre} {miembro.apellidos}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text variant="bodySmall" style={styles.helperText}>
              Seleccionados: {formData.visitorUserIds.length}
            </Text>
          </View>
        )}

        {/* Paso 5: Tipo y Actividades */}
        {currentStep === 5 && (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <MaterialIcons name="label" size={32} color={colors.primary} />
              <Text variant="titleLarge" style={styles.stepTitle}>
                Tipo de Visita
              </Text>
            </View>

            <View style={styles.radioGroup}>
              <Text variant="labelLarge" style={styles.label}>
                Tipo de Visita <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.radioItem}
                onPress={() => updateFormData({ visitType: 'primera_visita' })}
              >
                <RadioButton
                  value="primera_visita"
                  status={formData.visitType === 'primera_visita' ? 'checked' : 'unchecked'}
                  color={colors.primary}
                />
                <Text variant="bodyLarge">Primera Visita</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioItem}
                onPress={() => updateFormData({ visitType: 'visita_seguimiento' })}
              >
                <RadioButton
                  value="visita_seguimiento"
                  status={formData.visitType === 'visita_seguimiento' ? 'checked' : 'unchecked'}
                  color={colors.primary}
                />
                <Text variant="bodyLarge">Visita de Seguimiento</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioItem}
                onPress={() => updateFormData({ visitType: 'no_se_pudo_realizar' })}
              >
                <RadioButton
                  value="no_se_pudo_realizar"
                  status={formData.visitType === 'no_se_pudo_realizar' ? 'checked' : 'unchecked'}
                  color={colors.primary}
                />
                <Text variant="bodyLarge">No se pudo realizar</Text>
              </TouchableOpacity>
            </View>

            {formData.visitType === 'no_se_pudo_realizar' && (
              <View style={styles.radioGroup}>
                <Text variant="labelLarge" style={styles.label}>
                  Motivo
                </Text>
                <TouchableOpacity
                  style={styles.radioItem}
                  onPress={() => updateFormData({ motivoNoVisita: 'no_abrieron' })}
                >
                  <RadioButton
                    value="no_abrieron"
                    status={formData.motivoNoVisita === 'no_abrieron' ? 'checked' : 'unchecked'}
                    color={colors.primary}
                  />
                  <Text variant="bodyLarge">No abrieron la puerta</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.radioItem}
                  onPress={() => updateFormData({ motivoNoVisita: 'sin_tiempo' })}
                >
                  <RadioButton
                    value="sin_tiempo"
                    status={formData.motivoNoVisita === 'sin_tiempo' ? 'checked' : 'unchecked'}
                    color={colors.primary}
                  />
                  <Text variant="bodyLarge">No tenían tiempo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.radioItem}
                  onPress={() => updateFormData({ motivoNoVisita: 'otra' })}
                >
                  <RadioButton
                    value="otra"
                    status={formData.motivoNoVisita === 'otra' ? 'checked' : 'unchecked'}
                    color={colors.primary}
                  />
                  <Text variant="bodyLarge">Otra razón</Text>
                </TouchableOpacity>

                {formData.motivoNoVisita === 'otra' && (
                  <TextInput
                    mode="outlined"
                    label="Especificar motivo"
                    value={formData.motivoNoVisitaOtra}
                    onChangeText={(text) => updateFormData({ motivoNoVisitaOtra: text })}
                    style={styles.input}
                    outlineColor={colors.gray300}
                    activeOutlineColor={colors.primary}
                  />
                )}
              </View>
            )}

            {formData.visitType && formData.visitType !== 'no_se_pudo_realizar' && (
              <View style={styles.checkboxGroup}>
                <Text variant="labelLarge" style={styles.label}>
                  Actividades realizadas
                </Text>

                <TouchableOpacity
                  style={styles.checkboxItem}
                  onPress={() =>
                    updateFormData({
                      visitActivities: {
                        ...formData.visitActivities,
                        conversacion_preocupaciones: !formData.visitActivities.conversacion_preocupaciones,
                      },
                    })
                  }
                >
                  <Checkbox
                    status={formData.visitActivities.conversacion_preocupaciones ? 'checked' : 'unchecked'}
                    color={colors.primary}
                  />
                  <Text variant="bodyLarge">Conversación sobre preocupaciones</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.checkboxItem}
                  onPress={() =>
                    updateFormData({
                      visitActivities: {
                        ...formData.visitActivities,
                        oraciones: !formData.visitActivities.oraciones,
                      },
                    })
                  }
                >
                  <Checkbox
                    status={formData.visitActivities.oraciones ? 'checked' : 'unchecked'}
                    color={colors.primary}
                  />
                  <Text variant="bodyLarge">Oraciones</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.checkboxItem}
                  onPress={() =>
                    updateFormData({
                      visitActivities: {
                        ...formData.visitActivities,
                        estudio_instituto: !formData.visitActivities.estudio_instituto,
                      },
                    })
                  }
                >
                  <Checkbox
                    status={formData.visitActivities.estudio_instituto ? 'checked' : 'unchecked'}
                    color={colors.primary}
                  />
                  <Text variant="bodyLarge">Estudio de instituto</Text>
                </TouchableOpacity>
                {formData.visitActivities.estudio_instituto && (
                  <TextInput
                    mode="outlined"
                    label="¿Cuál?"
                    value={formData.visitActivities.estudio_instituto_especificar}
                    onChangeText={(text) =>
                      updateFormData({
                        visitActivities: {
                          ...formData.visitActivities,
                          estudio_instituto_especificar: text,
                        },
                      })
                    }
                    style={[styles.input, styles.nestedInput]}
                    outlineColor={colors.gray300}
                    activeOutlineColor={colors.primary}
                  />
                )}

                <TouchableOpacity
                  style={styles.checkboxItem}
                  onPress={() =>
                    updateFormData({
                      visitActivities: {
                        ...formData.visitActivities,
                        otro_estudio: !formData.visitActivities.otro_estudio,
                      },
                    })
                  }
                >
                  <Checkbox
                    status={formData.visitActivities.otro_estudio ? 'checked' : 'unchecked'}
                    color={colors.primary}
                  />
                  <Text variant="bodyLarge">Otro estudio</Text>
                </TouchableOpacity>
                {formData.visitActivities.otro_estudio && (
                  <TextInput
                    mode="outlined"
                    label="Especificar"
                    value={formData.visitActivities.otro_estudio_especificar}
                    onChangeText={(text) =>
                      updateFormData({
                        visitActivities: {
                          ...formData.visitActivities,
                          otro_estudio_especificar: text,
                        },
                      })
                    }
                    style={[styles.input, styles.nestedInput]}
                    outlineColor={colors.gray300}
                    activeOutlineColor={colors.primary}
                  />
                )}

                <TouchableOpacity
                  style={styles.checkboxItem}
                  onPress={() =>
                    updateFormData({
                      visitActivities: {
                        ...formData.visitActivities,
                        invitacion_actividad: !formData.visitActivities.invitacion_actividad,
                      },
                    })
                  }
                >
                  <Checkbox
                    status={formData.visitActivities.invitacion_actividad ? 'checked' : 'unchecked'}
                    color={colors.primary}
                  />
                  <Text variant="bodyLarge">Invitación a alguna actividad</Text>
                </TouchableOpacity>
                {formData.visitActivities.invitacion_actividad && (
                  <TextInput
                    mode="outlined"
                    label="¿A cuál actividad?"
                    value={formData.visitActivities.invitacion_especificar}
                    onChangeText={(text) =>
                      updateFormData({
                        visitActivities: {
                          ...formData.visitActivities,
                          invitacion_especificar: text,
                        },
                      })
                    }
                    style={[styles.input, styles.nestedInput]}
                    outlineColor={colors.gray300}
                    activeOutlineColor={colors.primary}
                  />
                )}
              </View>
            )}
          </View>
        )}

        {/* Paso 6: Materiales */}
        {currentStep === 6 && (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <MaterialCommunityIcons name="book-open-variant" size={32} color={colors.primary} />
              <Text variant="titleLarge" style={styles.stepTitle}>
                Materiales Dejados
              </Text>
            </View>

            <View style={styles.checkboxGroup}>
              <Text variant="labelLarge" style={styles.label}>
                ¿Se dejó algún material? (opcional)
              </Text>

              <TouchableOpacity
                style={styles.checkboxItem}
                onPress={() =>
                  updateFormData({
                    materialDejado: {
                      ...formData.materialDejado,
                      libro_oraciones: !formData.materialDejado.libro_oraciones,
                    },
                  })
                }
              >
                <Checkbox
                  status={formData.materialDejado.libro_oraciones ? 'checked' : 'unchecked'}
                  color={colors.primary}
                />
                <Text variant="bodyLarge">Libro de oraciones</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxItem}
                onPress={() =>
                  updateFormData({
                    materialDejado: {
                      ...formData.materialDejado,
                      otro: !formData.materialDejado.otro,
                    },
                  })
                }
              >
                <Checkbox
                  status={formData.materialDejado.otro ? 'checked' : 'unchecked'}
                  color={colors.primary}
                />
                <Text variant="bodyLarge">Otro material</Text>
              </TouchableOpacity>
              {formData.materialDejado.otro && (
                <TextInput
                  mode="outlined"
                  label="Especificar material"
                  value={formData.materialDejado.otro_especificar}
                  onChangeText={(text) =>
                    updateFormData({
                      materialDejado: {
                        ...formData.materialDejado,
                        otro_especificar: text,
                      },
                    })
                  }
                  style={[styles.input, styles.nestedInput]}
                  outlineColor={colors.gray300}
                  activeOutlineColor={colors.primary}
                />
              )}
            </View>
          </View>
        )}

        {/* Paso 7: Seguimiento */}
        {currentStep === 7 && (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <MaterialCommunityIcons name="refresh" size={32} color={colors.primary} />
              <Text variant="titleLarge" style={styles.stepTitle}>
                Seguimiento
              </Text>
            </View>

            <View style={styles.radioGroup}>
              <Text variant="labelLarge" style={styles.label}>
                Tipo de seguimiento (opcional)
              </Text>

              <TouchableOpacity
                style={styles.radioItem}
                onPress={() =>
                  updateFormData({
                    tipoSeguimiento: 'por_agendar',
                    seguimientoActividadBasica: false,
                    seguimientoNinguno: false,
                  })
                }
              >
                <RadioButton
                  value="por_agendar"
                  status={formData.tipoSeguimiento === 'por_agendar' ? 'checked' : 'unchecked'}
                  color={colors.primary}
                />
                <Text variant="bodyLarge">Por agendar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.radioItem}
                onPress={() =>
                  updateFormData({
                    tipoSeguimiento: 'agendado',
                    seguimientoActividadBasica: false,
                    seguimientoNinguno: false,
                  })
                }
              >
                <RadioButton
                  value="agendado"
                  status={formData.tipoSeguimiento === 'agendado' ? 'checked' : 'unchecked'}
                  color={colors.primary}
                />
                <Text variant="bodyLarge">Agendado</Text>
              </TouchableOpacity>

              {formData.tipoSeguimiento === 'agendado' && (
                <>
                  <TextInput
                    mode="outlined"
                    label="Fecha"
                    value={formData.seguimientoFecha}
                    onChangeText={(text) => updateFormData({ seguimientoFecha: text })}
                    style={[styles.input, styles.nestedInput]}
                    outlineColor={colors.gray300}
                    activeOutlineColor={colors.primary}
                    placeholder="YYYY-MM-DD"
                    keyboardType="numeric"
                  />
                  <TextInput
                    mode="outlined"
                    label="Hora"
                    value={formData.seguimientoHora}
                    onChangeText={(text) => updateFormData({ seguimientoHora: text })}
                    style={[styles.input, styles.nestedInput]}
                    outlineColor={colors.gray300}
                    activeOutlineColor={colors.primary}
                    placeholder="HH:MM"
                    keyboardType="numeric"
                  />
                </>
              )}

              <TouchableOpacity
                style={styles.radioItem}
                onPress={() =>
                  updateFormData({
                    tipoSeguimiento: '',
                    seguimientoActividadBasica: true,
                    seguimientoNinguno: false,
                  })
                }
              >
                <RadioButton
                  value="actividad_basica"
                  status={formData.seguimientoActividadBasica ? 'checked' : 'unchecked'}
                  color={colors.primary}
                />
                <Text variant="bodyLarge">Invitar a actividad básica</Text>
              </TouchableOpacity>

              {formData.seguimientoActividadBasica && (
                <TextInput
                  mode="outlined"
                  label="¿Cuál actividad?"
                  value={formData.seguimientoActividadBasicaEspecificar}
                  onChangeText={(text) =>
                    updateFormData({ seguimientoActividadBasicaEspecificar: text })
                  }
                  style={[styles.input, styles.nestedInput]}
                  outlineColor={colors.gray300}
                  activeOutlineColor={colors.primary}
                />
              )}

              <TouchableOpacity
                style={styles.radioItem}
                onPress={() =>
                  updateFormData({
                    tipoSeguimiento: '',
                    seguimientoActividadBasica: false,
                    seguimientoNinguno: true,
                  })
                }
              >
                <RadioButton
                  value="ninguno"
                  status={formData.seguimientoNinguno ? 'checked' : 'unchecked'}
                  color={colors.primary}
                />
                <Text variant="bodyLarge">Ninguno</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Paso 8: Notas */}
        {currentStep === 8 && (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <MaterialIcons name="notes" size={32} color={colors.primary} />
              <Text variant="titleLarge" style={styles.stepTitle}>
                Notas Adicionales
              </Text>
            </View>

            <TextInput
              mode="outlined"
              label="Notas (opcional)"
              value={formData.additionalNotes}
              onChangeText={(text) => updateFormData({ additionalNotes: text })}
              style={styles.input}
              outlineColor={colors.gray300}
              activeOutlineColor={colors.primary}
              multiline
              numberOfLines={6}
              placeholder="Escribe cualquier observación adicional sobre la visita..."
            />

            <View style={styles.successMessage}>
              <MaterialIcons name="check-circle" size={24} color={colors.success} />
              <Text variant="bodyMedium" style={styles.successText}>
                ¡Último paso! Revisa los datos y presiona "Guardar Visita"
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer Navigation */}
      <View style={styles.footer}>
        <Button
          mode="outlined"
          onPress={handlePrevious}
          disabled={currentStep === 1 || loading}
          style={styles.footerButton}
          textColor={colors.primary}
        >
          Anterior
        </Button>
        <Text variant="bodySmall" style={styles.footerText}>
          {currentStep} / {STEPS.length}
        </Text>
        <Button
          mode="contained"
          onPress={handleNext}
          disabled={loading}
          style={styles.footerButton}
          buttonColor={colors.primary}
          loading={loading}
        >
          {currentStep === STEPS.length ? 'Guardar' : 'Siguiente'}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 8,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gray200,
  },
  stepText: {
    marginTop: 8,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  stepContainer: {
    padding: 16,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  stepTitle: {
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
  },
  label: {
    marginBottom: 8,
    color: colors.textPrimary,
  },
  required: {
    color: colors.error,
  },
  radioGroup: {
    marginBottom: 16,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkboxGroup: {
    marginBottom: 16,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkboxList: {
    maxHeight: 300,
  },
  familiasList: {
    maxHeight: 400,
  },
  familiaInfo: {
    flex: 1,
  },
  familiaAddress: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  nestedInput: {
    marginLeft: 36,
  },
  helperText: {
    color: colors.textSecondary,
    marginTop: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFEBEE',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  errorText: {
    color: colors.error,
    flex: 1,
  },
  emptyMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: colors.gray100,
    borderRadius: 8,
  },
  emptyText: {
    flex: 1,
    color: colors.textSecondary,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  successText: {
    flex: 1,
    color: colors.success,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    backgroundColor: '#fff',
  },
  footerButton: {
    minWidth: 100,
  },
  footerText: {
    color: colors.textSecondary,
  },
});
