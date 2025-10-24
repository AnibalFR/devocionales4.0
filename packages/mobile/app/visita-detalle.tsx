import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, ActivityIndicator, Divider, Chip, Button } from 'react-native-paper';
import { useQuery } from '@apollo/client/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { VISITA_QUERY } from '../src/graphql/visitas';
import type { VisitaDetalle } from '../src/types/visita';

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

  // Color del chip según tipo de visita
  const getVisitTypeColor = (type: string) => {
    switch (type) {
      case 'primera_visita':
        return '#2196F3';
      case 'visita_seguimiento':
        return '#4CAF50';
      case 'no_se_pudo_realizar':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  // Color del chip según status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'realizada':
        return '#4CAF50';
      case 'programada':
        return '#FF9800';
      case 'cancelada':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  // Texto legible para tipo de visita
  const getVisitTypeLabel = (type: string) => {
    switch (type) {
      case 'primera_visita':
        return 'Primera Visita';
      case 'visita_seguimiento':
        return 'Visita de Seguimiento';
      case 'no_se_pudo_realizar':
        return 'No se Pudo Realizar';
      default:
        return type;
    }
  };

  // Texto legible para status
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'realizada':
        return 'Realizada';
      case 'programada':
        return 'Programada';
      case 'cancelada':
        return 'Cancelada';
      default:
        return status;
    }
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
        <Text variant="titleLarge" style={styles.sectionTitle}>
          👨‍👩‍👧‍👦 Familia
        </Text>
        <Text variant="headlineSmall" style={styles.familyName}>
          {visita.familia.nombreFamilia}
        </Text>
        {visita.familia.direccion && (
          <Text variant="bodyMedium" style={styles.info}>
            📍 {visita.familia.direccion}
          </Text>
        )}
        {visita.familia.telefono && (
          <Text variant="bodyMedium" style={styles.info}>
            📞 {visita.familia.telefono}
          </Text>
        )}
        {visita.familia.email && (
          <Text variant="bodyMedium" style={styles.info}>
            ✉️ {visita.familia.email}
          </Text>
        )}
      </View>

      <Divider />

      {/* Fecha y Hora */}
      <View style={styles.section}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          📅 Fecha y Hora
        </Text>
        <Text variant="bodyLarge" style={styles.info}>
          {formatDate(visita.visitDate)}
        </Text>
        <Text variant="bodyLarge" style={styles.info}>
          🕐 {visita.visitTime}
        </Text>
      </View>

      <Divider />

      {/* Ubicación */}
      {(visita.barrio || visita.nucleo || visita.barrioOtro) && (
        <>
          <View style={styles.section}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              📍 Ubicación
            </Text>
            {visita.barrio && (
              <Text variant="bodyLarge" style={styles.info}>
                Barrio: {visita.barrio.nombre}
              </Text>
            )}
            {visita.nucleo && (
              <Text variant="bodyLarge" style={styles.info}>
                Núcleo: {visita.nucleo.nombre}
              </Text>
            )}
            {visita.barrioOtro && (
              <Text variant="bodyLarge" style={styles.info}>
                Otro barrio: {visita.barrioOtro}
              </Text>
            )}
          </View>
          <Divider />
        </>
      )}

      {/* Tipo y Status */}
      <View style={styles.section}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          🏷️ Tipo y Estado
        </Text>
        <View style={styles.chips}>
          <Chip
            style={[styles.chip, { backgroundColor: getVisitTypeColor(visita.visitType) }]}
            textStyle={styles.chipText}
          >
            {getVisitTypeLabel(visita.visitType)}
          </Chip>
          <Chip
            style={[styles.chip, { backgroundColor: getStatusColor(visita.visitStatus) }]}
            textStyle={styles.chipText}
          >
            {getStatusLabel(visita.visitStatus)}
          </Chip>
        </View>
      </View>

      <Divider />

      {/* Visitadores */}
      {visita.visitadores.length > 0 && (
        <>
          <View style={styles.section}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              👥 Visitadores
            </Text>
            {visita.visitadores.map((visitador) => (
              <Text key={visitador.id} variant="bodyLarge" style={styles.info}>
                • {visitador.nombre}
                {visitador.email ? ` (${visitador.email})` : ''}
              </Text>
            ))}
          </View>
          <Divider />
        </>
      )}

      {/* Motivo de No Visita */}
      {visita.visitType === 'no_se_pudo_realizar' && visita.motivoNoVisita && (
        <>
          <View style={styles.section}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              ⚠️ Motivo de No Realización
            </Text>
            <Text variant="bodyLarge" style={styles.info}>
              {visita.motivoNoVisita === 'no_abrieron' && 'No abrieron'}
              {visita.motivoNoVisita === 'sin_tiempo' && 'Sin tiempo'}
              {visita.motivoNoVisita === 'otra' && `Otra: ${visita.motivoNoVisitaOtra}`}
            </Text>
          </View>
          <Divider />
        </>
      )}

      {/* Actividades */}
      {visita.visitActivities && (
        <>
          <View style={styles.section}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              ✅ Actividades Realizadas
            </Text>
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
            <Text variant="titleLarge" style={styles.sectionTitle}>
              📚 Material Dejado
            </Text>
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
            <Text variant="titleLarge" style={styles.sectionTitle}>
              🔄 Seguimiento
            </Text>
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
            <Text variant="titleLarge" style={styles.sectionTitle}>
              📝 Notas Adicionales
            </Text>
            <Text variant="bodyLarge" style={styles.notes}>
              {visita.additionalNotes}
            </Text>
          </View>
          <Divider />
        </>
      )}

      {/* Información del Registro */}
      <View style={styles.section}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          ℹ️ Información del Registro
        </Text>
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
    backgroundColor: '#6200ee',
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
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#6200ee',
  },
  familyName: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  info: {
    marginBottom: 6,
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
