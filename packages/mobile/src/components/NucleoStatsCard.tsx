import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDate } from '../utils/formatters';

interface NucleoStatsCardProps {
  nucleoNombre: string;
  visitasRealizadas: number;
  personasParticipando: number;
  ultimaVisita?: string;
}

export default function NucleoStatsCard({
  nucleoNombre,
  visitasRealizadas,
  personasParticipando,
  ultimaVisita,
}: NucleoStatsCardProps) {
  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <MaterialCommunityIcons name="chart-line" size={24} color="#4CAF50" />
          <Text variant="titleMedium" style={styles.title}>
            Contribución de {nucleoNombre}
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
            <Text variant="bodyMedium" style={styles.statLabel}>
              Visitas realizadas:
            </Text>
            <Text variant="bodyLarge" style={styles.statValue}>
              {visitasRealizadas}
            </Text>
          </View>

          <View style={styles.statRow}>
            <MaterialIcons name="people-outline" size={20} color="#2196F3" />
            <Text variant="bodyMedium" style={styles.statLabel}>
              Personas participando:
            </Text>
            <Text variant="bodyLarge" style={styles.statValue}>
              {personasParticipando}
            </Text>
          </View>

          {ultimaVisita && (
            <View style={styles.statRow}>
              <MaterialIcons name="calendar-today" size={20} color="#FF9800" />
              <Text variant="bodyMedium" style={styles.statLabel}>
                Última visita:
              </Text>
              <Text variant="bodyMedium" style={styles.statValue}>
                {formatDate(ultimaVisita)}
              </Text>
            </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontWeight: 'bold',
    color: '#212121',
    flex: 1,
  },
  statsContainer: {
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    color: '#666',
    flex: 1,
  },
  statValue: {
    fontWeight: '600',
    color: '#212121',
  },
});
