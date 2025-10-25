import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { Visita } from '../types/visita';
import { formatDate, getVisitTypeLabel, getVisitStatusLabel } from '../utils/formatters';
import { getVisitTypeIcon, getVisitStatusIcon } from '../utils/iconHelpers';

interface VisitaCardProps {
  visita: Visita;
  onPress: () => void;
}

export default function VisitaCard({ visita, onPress }: VisitaCardProps) {
  // Get icon configuration for visit type and status
  const typeIcon = getVisitTypeIcon(visita.visitType);
  const statusIcon = getVisitStatusIcon(visita.visitStatus);

  // Color del chip según tipo de visita
  const getVisitTypeColor = (type: string) => {
    switch (type) {
      case 'primera_visita':
        return '#2196F3'; // Azul
      case 'visita_seguimiento':
        return '#4CAF50'; // Verde
      case 'no_se_pudo_realizar':
        return '#F44336'; // Rojo
      default:
        return '#9E9E9E'; // Gris
    }
  };

  // Color del chip según status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'realizada':
        return '#4CAF50'; // Verde
      case 'programada':
        return '#FF9800'; // Naranja
      case 'cancelada':
        return '#F44336'; // Rojo
      default:
        return '#9E9E9E'; // Gris
    }
  };

  // Render icon component based on family
  const renderIcon = (iconConfig: { family: string; name: string }, size: number, color: string) => {
    if (iconConfig.family === 'MaterialIcons') {
      return <MaterialIcons name={iconConfig.name as any} size={size} color={color} />;
    } else if (iconConfig.family === 'MaterialCommunityIcons') {
      return <MaterialCommunityIcons name={iconConfig.name as any} size={size} color={color} />;
    }
    return null;
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text variant="titleMedium" style={styles.familyName}>
              {visita.familia.nombre}
            </Text>
            <Text variant="bodySmall" style={styles.date}>
              {formatDate(visita.visitDate)} {visita.visitTime}
            </Text>
          </View>

          {visita.familia.direccion && (
            <View style={styles.addressRow}>
              <MaterialIcons name="location-on" size={16} color="#666" />
              <Text variant="bodySmall" style={styles.address}>
                {visita.familia.direccion}
              </Text>
            </View>
          )}

          {(visita.barrio || visita.nucleo) && (
            <Text variant="bodySmall" style={styles.location}>
              {visita.barrio?.nombre}
              {visita.nucleo ? ` - ${visita.nucleo.nombre}` : ''}
            </Text>
          )}

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

          {visita.visitadores.length > 0 && (
            <View style={styles.visitorsRow}>
              <MaterialIcons name="people" size={16} color="#666" />
              <Text variant="bodySmall" style={styles.visitors}>
                {visita.visitadores.map((v) => v.nombre).join(', ')}
              </Text>
            </View>
          )}

          {visita.additionalNotes && (
            <Text
              variant="bodySmall"
              style={styles.notes}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {visita.additionalNotes}
            </Text>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  familyName: {
    fontWeight: 'bold',
    flex: 1,
  },
  date: {
    color: '#666',
    marginLeft: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  address: {
    color: '#666',
    flex: 1,
  },
  location: {
    color: '#2196F3',
    marginBottom: 8,
    fontWeight: '500',
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 8,
  },
  chip: {
    height: 28,
  },
  chipText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  visitorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  visitors: {
    color: '#666',
    fontStyle: 'italic',
    flex: 1,
  },
  notes: {
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
