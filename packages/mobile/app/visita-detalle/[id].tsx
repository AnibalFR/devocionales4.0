import { ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useQuery } from '@apollo/client';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  BadgeText,
  Divider,
  Spinner,
  Center,
} from '@gluestack-ui/themed';
import { VISITAS_QUERY } from '../../src/graphql/queries';
import type { Visita } from '../../src/types';
import {
  formatDate,
  getTipoVisitaLabel,
  getStatusLabel,
  getTipoVisitaColor,
  getStatusColor,
} from '../../src/utils/formatters';

export default function VisitaDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error } = useQuery(VISITAS_QUERY);

  if (loading) {
    return (
      <Center flex={1} backgroundColor="$white">
        <Spinner size="large" />
      </Center>
    );
  }

  if (error) {
    return (
      <Center flex={1} backgroundColor="$white" padding="$4">
        <Text color="$red600">Error al cargar la visita</Text>
      </Center>
    );
  }

  const visita = data?.visitas?.find((v: Visita) => v.id === id);

  if (!visita) {
    return (
      <Center flex={1} backgroundColor="$white" padding="$4">
        <Text color="$gray600">Visita no encontrada</Text>
      </Center>
    );
  }

  const tipoColor = getTipoVisitaColor(visita.visitType);
  const statusColor = getStatusColor(visita.visitStatus);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Detalle de Visita',
          headerBackTitle: 'Volver',
        }}
      />
      <ScrollView style={styles.container}>
        <Box padding="$4">
          <VStack space="lg">
            {/* Header */}
            <VStack space="md">
              <Text size="2xl" fontWeight="$bold">
                {visita.familia.nombre}
              </Text>
              <HStack space="sm">
                <Badge
                  size="md"
                  variant="solid"
                  backgroundColor={tipoColor}
                  borderRadius="$full"
                >
                  <BadgeText color="$white">
                    {getTipoVisitaLabel(visita.visitType)}
                  </BadgeText>
                </Badge>
                <Badge
                  size="md"
                  variant="solid"
                  backgroundColor={statusColor}
                  borderRadius="$full"
                >
                  <BadgeText color="$white">
                    {getStatusLabel(visita.visitStatus)}
                  </BadgeText>
                </Badge>
              </HStack>
            </VStack>

            <Divider />

            {/* Información básica */}
            <VStack space="md">
              <Text size="lg" fontWeight="$bold">
                Información
              </Text>
              <DetailItem label="Fecha" value={formatDate(visita.visitDate, 'dd MMMM yyyy')} />
              <DetailItem label="Hora" value={visita.visitTime} />
              {visita.barrio && (
                <DetailItem label="Barrio" value={visita.barrio.nombre} />
              )}
              {visita.barrioOtro && (
                <DetailItem label="Barrio (Otro)" value={visita.barrioOtro} />
              )}
              {visita.nucleo && (
                <DetailItem label="Núcleo" value={visita.nucleo.nombre} />
              )}
            </VStack>

            <Divider />

            {/* Visitadores */}
            {visita.visitadores && visita.visitadores.length > 0 && (
              <>
                <VStack space="md">
                  <Text size="lg" fontWeight="$bold">
                    Visitadores
                  </Text>
                  {visita.visitadores.map((v) => (
                    <DetailItem key={v.id} label="" value={v.nombre} icon="👤" />
                  ))}
                </VStack>
                <Divider />
              </>
            )}

            {/* Actividades */}
            {visita.visitActivities && (
              <>
                <VStack space="md">
                  <Text size="lg" fontWeight="$bold">
                    Actividades Realizadas
                  </Text>
                  {visita.visitActivities.conversacion_preocupaciones && (
                    <DetailItem label="" value="Conversación sobre preocupaciones" icon="💬" />
                  )}
                  {visita.visitActivities.oraciones && (
                    <DetailItem label="" value="Oraciones" icon="🙏" />
                  )}
                  {visita.visitActivities.estudio_instituto && (
                    <DetailItem
                      label=""
                      value={`Estudio Instituto${
                        visita.visitActivities.estudio_instituto_especificar
                          ? `: ${visita.visitActivities.estudio_instituto_especificar}`
                          : ''
                      }`}
                      icon="📚"
                    />
                  )}
                  {visita.visitActivities.otro_estudio && (
                    <DetailItem
                      label=""
                      value={`Otro estudio${
                        visita.visitActivities.otro_estudio_especificar
                          ? `: ${visita.visitActivities.otro_estudio_especificar}`
                          : ''
                      }`}
                      icon="📖"
                    />
                  )}
                  {visita.visitActivities.invitacion_actividad && (
                    <DetailItem
                      label=""
                      value={`Invitación a actividad${
                        visita.visitActivities.invitacion_especificar
                          ? `: ${visita.visitActivities.invitacion_especificar}`
                          : ''
                      }`}
                      icon="📅"
                    />
                  )}
                </VStack>
                <Divider />
              </>
            )}

            {/* Material dejado */}
            {visita.materialDejado && (
              <>
                <VStack space="md">
                  <Text size="lg" fontWeight="$bold">
                    Material Dejado
                  </Text>
                  {visita.materialDejado.libro_oraciones && (
                    <DetailItem label="" value="Libro de Oraciones" icon="📕" />
                  )}
                  {visita.materialDejado.otro && (
                    <DetailItem
                      label=""
                      value={`Otro${
                        visita.materialDejado.otro_especificar
                          ? `: ${visita.materialDejado.otro_especificar}`
                          : ''
                      }`}
                      icon="📄"
                    />
                  )}
                </VStack>
                <Divider />
              </>
            )}

            {/* Seguimiento */}
            {visita.seguimientoVisita && (
              <>
                <VStack space="md">
                  <Text size="lg" fontWeight="$bold">
                    Seguimiento
                  </Text>
                  {visita.seguimientoFecha && (
                    <DetailItem
                      label="Fecha"
                      value={formatDate(visita.seguimientoFecha, 'dd MMMM yyyy')}
                    />
                  )}
                  {visita.seguimientoHora && (
                    <DetailItem label="Hora" value={visita.seguimientoHora} />
                  )}
                  {visita.tipoSeguimiento && (
                    <DetailItem label="Tipo" value={visita.tipoSeguimiento} />
                  )}
                </VStack>
                <Divider />
              </>
            )}

            {/* Notas */}
            {visita.additionalNotes && (
              <>
                <VStack space="md">
                  <Text size="lg" fontWeight="$bold">
                    Notas Adicionales
                  </Text>
                  <Box
                    backgroundColor="$gray100"
                    borderRadius="$lg"
                    padding="$4"
                  >
                    <Text>{visita.additionalNotes}</Text>
                  </Box>
                </VStack>
                <Divider />
              </>
            )}

            {/* Motivo no visita */}
            {visita.visitType === 'no_se_pudo_realizar' && visita.motivoNoVisita && (
              <>
                <VStack space="md">
                  <Text size="lg" fontWeight="$bold" color="$red600">
                    Motivo No Realizada
                  </Text>
                  <DetailItem
                    label=""
                    value={
                      visita.motivoNoVisita === 'otra'
                        ? visita.motivoNoVisitaOtra || 'Otra'
                        : visita.motivoNoVisita
                    }
                    icon="⚠️"
                  />
                </VStack>
                <Divider />
              </>
            )}

            {/* Metadata */}
            <VStack space="md">
              <Text size="sm" color="$gray600">
                Creada por: {visita.creadoPor.nombre}
              </Text>
              <Text size="sm" color="$gray600">
                Fecha de creación: {formatDate(visita.createdAt, 'dd MMM yyyy HH:mm')}
              </Text>
            </VStack>
          </VStack>
        </Box>
      </ScrollView>
    </>
  );
}

function DetailItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: string;
}) {
  return (
    <Box backgroundColor="$gray100" borderRadius="$lg" padding="$4">
      <HStack space="sm" alignItems="center">
        {icon && <Text size="lg">{icon}</Text>}
        <VStack flex={1}>
          {label && (
            <Text size="sm" color="$gray600" fontWeight="$medium">
              {label}
            </Text>
          )}
          <Text size="md" fontWeight="$semibold">
            {value}
          </Text>
        </VStack>
      </HStack>
    </Box>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
