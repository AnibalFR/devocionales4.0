import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import type { Visita } from '../types/visita';

interface VisitaCardProps {
  visita: Visita;
  onPress: () => void;
}

export default function VisitaCard({ visita, onPress }: VisitaCardProps) {
  // Formatear fecha
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

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

  // Texto legible para tipo de visita
  const getVisitTypeLabel = (type: string) => {
    switch (type) {
      case 'primera_visita':
        return 'Primera Visita';
      case 'visita_seguimiento':
        return 'Seguimiento';
      case 'no_se_pudo_realizar':
        return 'No Realizada';
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
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text variant="titleMedium" style={styles.familyName}>
              {visita.familia.nombreFamilia}
            </Text>
            <Text variant="bodySmall" style={styles.date}>
              {formatDate(visita.visitDate)} {visita.visitTime}
            </Text>
          </View>

          {visita.familia.direccion && (
            <Text variant="bodySmall" style={styles.address}>
              📍 {visita.familia.direccion}
            </Text>
          )}

          {(visita.barrio || visita.nucleo) && (
            <Text variant="bodySmall" style={styles.location}>
              {visita.barrio?.nombre}
              {visita.nucleo ? ` - ${visita.nucleo.nombre}` : ''}
            </Text>
          )}

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

          {visita.visitadores.length > 0 && (
            <Text variant="bodySmall" style={styles.visitors}>
              👥 {visita.visitadores.map((v) => v.nombre).join(', ')}
            </Text>
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
  address: {
    color: '#666',
    marginBottom: 4,
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
  visitors: {
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  notes: {
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
