import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { Visita } from '../types/visita';
import { getVisitTypeIcon } from '../utils/iconHelpers';
import { colors } from '../constants/colors';

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
        <Text variant="labelMedium" style={styles.time}>
          {visita.visitTime}
        </Text>

        {/* Familia */}
        <Text variant="bodySmall" style={styles.familia} numberOfLines={1}>
          {visita.familia.nombre}
        </Text>

        {/* Tipo de visita (ícono pequeño) */}
        <View style={styles.typeIcon}>
          {renderIcon(typeIcon, 12, colors.gray600)}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderLeftWidth: 3,
    borderRadius: 6,
    padding: 6,
    marginBottom: 4,
    minHeight: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  time: {
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 1,
  },
  familia: {
    color: colors.textPrimary,
    fontSize: 11,
    lineHeight: 14,
    marginBottom: 2,
  },
  typeIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
    opacity: 0.7,
  },
});
