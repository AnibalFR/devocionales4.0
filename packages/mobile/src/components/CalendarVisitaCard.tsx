import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { Visita } from '../types/visita';
import { getVisitTypeIcon } from '../utils/iconHelpers';
import { colors } from '../constants/colors';
import VisitadoresIcons from './VisitadoresIcons';

interface CalendarVisitaCardProps {
  visita: Visita;
  onPress: () => void;
}

export default function CalendarVisitaCard({ visita, onPress }: CalendarVisitaCardProps) {
  // Get icon configuration for visit type
  const typeIcon = getVisitTypeIcon(visita.visitType);

  // Color del borde según status
  const getBorderColor = (status: string) => {
    switch (status) {
      case 'realizada':
        return colors.success; // Verde
      case 'programada':
        return colors.warning; // Naranja
      case 'cancelada':
        return colors.error; // Rojo
      default:
        return colors.gray400;
    }
  };

  // Background color según status (más suave)
  const getBackgroundColor = (status: string) => {
    switch (status) {
      case 'realizada':
        return '#E8F5E9'; // Verde claro
      case 'programada':
        return '#FFF3E0'; // Naranja claro
      case 'cancelada':
        return '#FFEBEE'; // Rojo claro
      default:
        return '#FFFFFF';
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

  const borderColor = getBorderColor(visita.visitStatus);
  const backgroundColor = getBackgroundColor(visita.visitStatus);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.card, { borderLeftColor: borderColor, backgroundColor }]}>
        {/* Hora */}
        <Text variant="titleMedium" style={[styles.time, { color: borderColor }]}>
          {visita.visitTime}
        </Text>

        {/* Familia */}
        <Text variant="bodyMedium" style={styles.familia} numberOfLines={3}>
          {visita.familia.nombre}
        </Text>

        {/* Visitadores */}
        <VisitadoresIcons visitadores={visita.visitadores} maxVisible={3} iconSize={16} />

        {/* Tipo de visita (ícono) */}
        <View style={styles.typeIcon}>
          {renderIcon(typeIcon, 20, borderColor)}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    minHeight: 95,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
  },
  time: {
    fontWeight: '700',
    marginBottom: 6,
  },
  familia: {
    color: colors.textPrimary,
    lineHeight: 18,
    marginBottom: 8,
    flex: 1,
  },
  typeIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});
