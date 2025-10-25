import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

interface Visitador {
  id: string;
  nombre: string;
}

interface VisitadoresIconsProps {
  visitadores: Visitador[];
  maxVisible?: number;
  iconSize?: number;
}

export default function VisitadoresIcons({
  visitadores,
  maxVisible = 3,
  iconSize = 16
}: VisitadoresIconsProps) {
  if (!visitadores || visitadores.length === 0) {
    return null;
  }

  const visibleVisitadores = visitadores.slice(0, maxVisible);
  const remainingCount = Math.max(0, visitadores.length - maxVisible);

  return (
    <View style={styles.container}>
      {visibleVisitadores.map((visitador, index) => (
        <MaterialIcons
          key={visitador.id || index}
          name="person"
          size={iconSize}
          color={colors.textSecondary}
          style={styles.icon}
        />
      ))}
      {remainingCount > 0 && (
        <Text variant="bodySmall" style={styles.remainingText}>
          +{remainingCount}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  icon: {
    marginRight: -2,
  },
  remainingText: {
    color: colors.textSecondary,
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '600',
  },
});
