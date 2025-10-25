import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { formatPercentage } from '../utils/formatters';

interface ProgressBarProps {
  label: string;
  current: number;
  goal: number;
  percentage: number;
  iconFamily?: 'MaterialIcons' | 'MaterialCommunityIcons';
  iconName: string;
  color?: string;
}

export default function ProgressBar({
  label,
  current,
  goal,
  percentage,
  iconFamily = 'MaterialIcons',
  iconName,
  color,
}: ProgressBarProps) {
  const barColor = color || getProgressColor(percentage);

  const IconComponent = iconFamily === 'MaterialCommunityIcons'
    ? MaterialCommunityIcons
    : MaterialIcons;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.labelContainer}>
          <IconComponent name={iconName as any} size={20} color={barColor} />
          <Text variant="bodyMedium" style={styles.label}>
            {label}
          </Text>
        </View>
        <Text variant="bodySmall" style={styles.stats}>
          {current}/{goal} ({formatPercentage(percentage)})
        </Text>
      </View>
      <View style={styles.barBackground}>
        <View
          style={[
            styles.barFill,
            {
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>
    </View>
  );
}

function getProgressColor(percentage: number): string {
  if (percentage >= 75) return '#4CAF50';
  if (percentage >= 50) return '#FF9800';
  return '#F44336';
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontWeight: '600',
  },
  stats: {
    color: '#666',
  },
  barBackground: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
});
