import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

interface StatCardProps {
  label: string;
  value: string | number;
  iconFamily?: 'MaterialIcons' | 'MaterialCommunityIcons';
  iconName: string;
  iconColor?: string;
  subtitle?: string;
}

export default function StatCard({
  label,
  value,
  iconFamily = 'MaterialIcons',
  iconName,
  iconColor = colors.primary,
  subtitle,
}: StatCardProps) {
  const IconComponent = iconFamily === 'MaterialCommunityIcons'
    ? MaterialCommunityIcons
    : MaterialIcons;

  return (
    <Card style={styles.card}>
      <Card.Content style={styles.content}>
        <View style={styles.iconContainer}>
          <IconComponent name={iconName as any} size={32} color={iconColor} />
        </View>
        <View style={styles.textContainer}>
          <Text variant="headlineMedium" style={styles.value}>
            {value}
          </Text>
          <Text variant="bodyMedium" style={styles.label}>
            {label}
          </Text>
          {subtitle && (
            <Text variant="bodySmall" style={styles.subtitle}>
              {subtitle}
            </Text>
          )}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E5DFF7', // Light purple background matching new primary
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  value: {
    fontWeight: 'bold',
    color: '#212121',
  },
  label: {
    color: '#666',
    marginTop: 2,
  },
  subtitle: {
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
});
