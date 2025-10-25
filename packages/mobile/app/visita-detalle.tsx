import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, ActivityIndicator, Divider, Chip, Button } from 'react-native-paper';
import { useQuery } from '@apollo/client/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { VISITA_QUERY } from '../src/graphql/visitas';
import type { VisitaDetalle } from '../src/types/visita';
import { colors } from '../src/constants/colors';
import { getVisitTypeLabel, getVisitStatusLabel } from '../src/utils/formatters';
import { getVisitTypeIcon, getVisitStatusIcon } from '../src/utils/iconHelpers';

export default function VisitaDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, loading, error } = useQuery(VISITA_QUERY, {
    variables: { id },
    skip: !id,
  });

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text variant="bodyLarge" style={styles.loadingText}>
          Cargando detalle...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="headlineSmall" style={styles.errorText}>
          Error al cargar visita
        </Text>
        <Text variant="bodyMedium" style={styles.errorDetail}>
          {error.message}
        </Text>
        <Button mode="contained" onPress={() => router.back()} style={styles.backButton}>
          Volver
        </Button>
      </View>
    );
  }

  const visita: VisitaDetalle = data?.visita;

  if (!visita) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="headlineSmall">Visita no encontrada</Text>
        <Button mode="contained" onPress={() => router.back()} style={styles.backButton}>
          Volver
        </Button>
      </View>
    );
  }

  // Formatear fecha
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  // Get icon configuration for visit type and status
  const typeIcon = visita ? getVisitTypeIcon(visita.visitType) : null;
  const statusIcon = visita ? getVisitStatusIcon(visita.visitStatus) : null;

  // Color del chip según tipo de visita
  const getVisitTypeColor = (type: string) => {
    switch (type) {
      case 'primera_visita':
        return colors.info;
      case 'visita_seguimiento':
        return colors.success;
      case 'no_se_pudo_realizar':
        return colors.error;
      default:
        return colors.gray400;
    }
  };

  // Color del chip según status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'realizada':
        return colors.success;
      case 'programada':
        return colors.warning;
      case 'cancelada':
        return colors.error;
      default:
        return colors.gray400;
    }
  };

  // Render icon component based on family
  const renderIcon = (iconConfig: { family: string; name: string } | null, size: number, color: string) => {
    if (!iconConfig) return null;
    if (iconConfig.family === 'MaterialIcons') {
      return <MaterialIcons name={iconConfig.name as any} size={size} color={color} />;
    } else if (iconConfig.family === 'MaterialCommunityIcons') {
      return <MaterialCommunityIcons name={iconConfig.name as any} size={size} color={color} />;
    }
    return null;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Button
          mode="text"
          onPress={() => router.back()}
          icon="arrow-left"
          style={styles.backButtonTop}
        >
          Volver
        </Button>
        <Text variant="headlineMedium" style={styles.title}>
          Detalle de Visita
        </Text>
      </View>

      {/* Familia */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <MaterialCommunityIcons name="account-group" size={24} color={colors.primary} />
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Familia
          </Text>
        </View>
        <Text variant="headlineSmall" style={styles.familyName}>
          {visita.familia.nombre}
        </Text>
        {visita.familia.direccion && (
          <View style={styles.infoRow}>
            <MaterialIcons name="location-on" size={18} color={colors.gray600} />
            <Text variant="bodyMedium" style={styles.info}>
              {visita.familia.direccion}
            </Text>
          </View>
        )}
        {visita.familia.telefono && (
          <View style={styles.infoRow}>
            <MaterialIcons name="phone" size={18} color={colors.gray600} />
            <Text variant="bodyMedium" style={styles.info}>
              {visita.familia.telefono}
            </Text>
          </View>
        )}
        {visita.familia.email && (
          <View style={styles.infoRow}>
            <MaterialIcons name="email" size={18} color={colors.gray600} />
            <Text variant="bodyMedium" style={styles.info}>
              {visita.familia.email}
            </Text>
          </View>
        )}
      </View>

      <Divider />

      {/* Fecha y Hora */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <MaterialIcons name="event" size={24} color={colors.primary} />
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Fecha y Hora
          </Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="calendar-today" size={18} color={colors.gray600} />
          <Text variant="bodyLarge" style={styles.info}>
            {formatDate(visita.visitDate)}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="access-time" size={18} color={colors.gray600} />
          <Text variant="bodyLarge" style={styles.info}>
            {visita.visitTime}
          </Text>
        </View>
      </View>

      <Divider />

      {/* Ubicación */}
      {(visita.barrio || visita.nucleo || visita.barrioOtro) && (
        <>
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="place" size={24} color={colors.primary} />
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Ubicación
              </Text>
            </View>
            {visita.barrio && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="home-group" size={18} color={colors.gray600} />
                <Text variant="bodyLarge" style={styles.info}>
                  Barrio: {visita.barrio.nombre}
                </Text>
              </View>
            )}
            {visita.nucleo && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="map-marker-circle" size={18} color={colors.gray600} />
                <Text variant="bodyLarge" style={styles.info}>
                  Núcleo: {visita.nucleo.nombre}
                </Text>
              </View>
            )}
            {visita.barrioOtro && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="home-outline" size={18} color={colors.gray600} />
                <Text variant="bodyLarge" style={styles.info}>
                  Otro barrio: {visita.barrioOtro}
                </Text>
              </View>
            )}
          </View>
          <Divider />
        </>
      )}

      {/* Tipo y Status */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <MaterialIcons name="label" size={24} color={colors.primary} />
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Tipo y Estado
          </Text>
        </View>
        <View style={styles.chips}>
          <Chip
            icon={() => renderIcon(typeIcon, 16, '#FFF')}
            style={[styles.chip, { backgroundColor: getVisitTypeColor(visita.visitType) }]}
            textStyle={styles.chipText}
          >
            {getVisitTypeLabel(visita.visitType)}
          </Chip>
          <Chip
            icon={() => renderIcon(statusIcon, 16, '#FFF')}
            style={[styles.chip, { backgroundColor: getStatusColor(visita.visitStatus) }]}
            textStyle={styles.chipText}
          >
            {getVisitStatusLabel(visita.visitStatus)}
          </Chip>
        </View>
      </View>

      <Divider />

      {/* Visitadores */}
      {visita.visitadores.length > 0 && (
        <>
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="people" size={24} color={colors.primary} />
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Visitadores
              </Text>
            </View>
            {visita.visitadores.map((visitador) => (
              <View key={visitador.id} style={styles.infoRow}>
                <MaterialIcons name="person" size={18} color={colors.gray600} />
                <Text variant="bodyLarge" style={styles.info}>
                  {visitador.nombre}
                </Text>
              </View>
            ))}
          </View>
          <Divider />
        </>
      )}

      {/* Motivo de No Visita */}
      {visita.visitType === 'no_se_pudo_realizar' && visita.motivoNoVisita && (
        <>
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="warning" size={24} color={colors.warning} />
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Motivo de No Realización
              </Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="info" size={18} color={colors.gray600} />
              <Text variant="bodyLarge" style={styles.info}>
                {visita.motivoNoVisita === 'no_abrieron' && 'No abrieron'}
                {visita.motivoNoVisita === 'sin_tiempo' && 'Sin tiempo'}
                {visita.motivoNoVisita === 'otra' && `Otra: ${visita.motivoNoVisitaOtra}`}
              </Text>
            </View>
          </View>
          <Divider />
        </>
      )}

      {/* Actividades */}
      {visita.visitActivities && (
        <>
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="check-circle" size={24} color={colors.success} />
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Actividades Realizadas
              </Text>
            </View>
            {visita.visitActivities.conversacion_preocupaciones && (
              <Text variant="bodyLarge" style={styles.info}>
                • Conversación sobre preocupaciones
              </Text>
            )}
            {visita.visitActivities.oraciones && (
              <Text variant="bodyLarge" style={styles.info}>
                • Oraciones
              </Text>
            )}
            {visita.visitActivities.estudio_instituto && (
              <Text variant="bodyLarge" style={styles.info}>
                • Estudio del Instituto
                {visita.visitActivities.estudio_instituto_especificar &&
                  `: ${visita.visitActivities.estudio_instituto_especificar}`}
              </Text>
            )}
            {visita.visitActivities.otro_estudio && (
              <Text variant="bodyLarge" style={styles.info}>
                • Otro estudio
                {visita.visitActivities.otro_estudio_especificar &&
                  `: ${visita.visitActivities.otro_estudio_especificar}`}
              </Text>
            )}
            {visita.visitActivities.invitacion_actividad && (
              <Text variant="bodyLarge" style={styles.info}>
                • Invitación a actividad
                {visita.visitActivities.invitacion_especificar &&
                  `: ${visita.visitActivities.invitacion_especificar}`}
              </Text>
            )}
          </View>
          <Divider />
        </>
      )}

      {/* Material Dejado */}
      {visita.materialDejado && (
        <>
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <MaterialCommunityIcons name="book-open-variant" size={24} color={colors.primary} />
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Material Dejado
              </Text>
            </View>
            {visita.materialDejado.libro_oraciones && (
              <Text variant="bodyLarge" style={styles.info}>
                • Libro de oraciones
              </Text>
            )}
            {visita.materialDejado.otro && (
              <Text variant="bodyLarge" style={styles.info}>
                • Otro
                {visita.materialDejado.otro_especificar &&
                  `: ${visita.materialDejado.otro_especificar}`}
              </Text>
            )}
          </View>
          <Divider />
        </>
      )}

      {/* Seguimiento */}
      {visita.seguimientoVisita && (
        <>
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <MaterialCommunityIcons name="refresh" size={24} color={colors.primary} />
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Seguimiento
              </Text>
            </View>
            {visita.tipoSeguimiento && (
              <Text variant="bodyLarge" style={styles.info}>
                Tipo: {visita.tipoSeguimiento === 'por_agendar' ? 'Por agendar' : 'Agendado'}
              </Text>
            )}
            {visita.seguimientoFecha && (
              <Text variant="bodyLarge" style={styles.info}>
                Fecha: {formatDate(visita.seguimientoFecha)} {visita.seguimientoHora}
              </Text>
            )}
            {visita.seguimientoActividadBasica && (
              <Text variant="bodyLarge" style={styles.info}>
                Actividad básica
                {visita.seguimientoActividadBasicaEspecificar &&
                  `: ${visita.seguimientoActividadBasicaEspecificar}`}
              </Text>
            )}
            {visita.seguimientoNinguno && (
              <Text variant="bodyLarge" style={styles.info}>
                Sin seguimiento
              </Text>
            )}
          </View>
          <Divider />
        </>
      )}

      {/* Notas Adicionales */}
      {visita.additionalNotes && (
        <>
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="notes" size={24} color={colors.primary} />
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Notas Adicionales
              </Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="description" size={18} color={colors.gray600} />
              <Text variant="bodyLarge" style={styles.notes}>
                {visita.additionalNotes}
              </Text>
            </View>
          </View>
          <Divider />
        </>
      )}

      {/* Información del Registro */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <MaterialIcons name="info" size={24} color={colors.info} />
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Información del Registro
          </Text>
        </View>
        <Text variant="bodyMedium" style={styles.info}>
          Creado por: {visita.creadoPor.nombre}
        </Text>
        {visita.createdAt && (
          <Text variant="bodyMedium" style={styles.info}>
            Fecha de creación: {new Date(visita.createdAt).toLocaleString('es-MX')}
          </Text>
        )}
        {visita.updatedAt && (
          <Text variant="bodyMedium" style={styles.info}>
            Última actualización: {new Date(visita.updatedAt).toLocaleString('es-MX')}
          </Text>
        )}
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    backgroundColor: colors.primary,
    padding: 16,
    paddingTop: 48,
  },
  backButtonTop: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
  },
  section: {
    padding: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
  },
  familyName: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  info: {
    flex: 1,
    lineHeight: 24,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    marginVertical: 4,
  },
  chipText: {
    color: '#FFF',
    fontWeight: '600',
  },
  notes: {
    fontStyle: 'italic',
    color: '#666',
    lineHeight: 22,
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  errorText: {
    color: '#F44336',
    marginBottom: 8,
  },
  errorDetail: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  backButton: {
    marginTop: 16,
  },
  bottomPadding: {
    height: 24,
  },
});
