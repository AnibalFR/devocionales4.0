import { TouchableOpacity, StyleSheet } from 'react-native';
import { Box, VStack, HStack, Text, Badge, BadgeText } from '@gluestack-ui/themed';
import type { Visita } from '../types';
import {
  formatDate,
  getTipoVisitaLabel,
  getStatusLabel,
  getTipoVisitaColor,
  getStatusColor,
} from '../utils/formatters';

interface VisitaCardProps {
  visita: Visita;
  onPress: () => void;
}

export function VisitaCard({ visita, onPress }: VisitaCardProps) {
  const tipoColor = getTipoVisitaColor(visita.visitType);
  const statusColor = getStatusColor(visita.visitStatus);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Box style={styles.card}>
        <VStack space="sm">
          {/* Header con fecha y familia */}
          <HStack justifyContent="space-between" alignItems="center">
            <Text size="md" fontWeight="$bold">
              {visita.familia.nombre}
            </Text>
            <Text size="sm" color="$gray600">
              {formatDate(visita.visitDate, 'dd MMM yy')}
            </Text>
          </HStack>

          {/* Badges de tipo y status */}
          <HStack space="sm">
            <Badge
              size="sm"
              variant="solid"
              backgroundColor={tipoColor}
              borderRadius="$full"
            >
              <BadgeText color="$white">
                {getTipoVisitaLabel(visita.visitType)}
              </BadgeText>
            </Badge>
            <Badge
              size="sm"
              variant="solid"
              backgroundColor={statusColor}
              borderRadius="$full"
            >
              <BadgeText color="$white">
                {getStatusLabel(visita.visitStatus)}
              </BadgeText>
            </Badge>
          </HStack>

          {/* Información adicional */}
          {visita.barrio && (
            <Text size="sm" color="$gray600">
              📍 {visita.barrio.nombre}
              {visita.nucleo && ` - ${visita.nucleo.nombre}`}
            </Text>
          )}

          {/* Visitadores */}
          {visita.visitadores && visita.visitadores.length > 0 && (
            <HStack space="xs" flexWrap="wrap">
              <Text size="sm" color="$gray600">
                👥
              </Text>
              {visita.visitadores.map((v, idx) => (
                <Text key={v.id} size="sm" color="$gray600">
                  {v.nombre}
                  {idx < visita.visitadores.length - 1 ? ',' : ''}
                </Text>
              ))}
            </HStack>
          )}
        </VStack>
      </Box>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
