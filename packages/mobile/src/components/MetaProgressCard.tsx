import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ProgressBar from './ProgressBar';
import type { MetaActiva } from '../types/dashboard';
import { colors } from '../constants/colors';

interface MetaProgressCardProps {
  meta: MetaActiva;
}

export default function MetaProgressCard({ meta }: MetaProgressCardProps) {
  if (!meta.progreso) return null;

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <MaterialCommunityIcons name="target" size={24} color={colors.primary} />
          <Text variant="titleLarge" style={styles.title}>
            {meta.trimestre}
          </Text>
        </View>
        <Text variant="bodySmall" style={styles.subtitle}>
          Meta del Trimestre
        </Text>

        <View style={styles.progressContainer}>
          <ProgressBar
            label="Núcleos"
            current={meta.progreso.nucleosActuales}
            goal={meta.metaNucleos}
            percentage={meta.progreso.nucleosPorcentaje}
            iconFamily="MaterialCommunityIcons"
            iconName="home-group"
          />
          <ProgressBar
            label="Visitas"
            current={meta.progreso.visitasActuales}
            goal={meta.metaVisitas}
            percentage={meta.progreso.visitasPorcentaje}
            iconFamily="MaterialIcons"
            iconName="visibility"
          />
          <ProgressBar
            label="Personas Visitando"
            current={meta.progreso.personasVisitandoActuales}
            goal={meta.metaPersonasVisitando}
            percentage={meta.progreso.personasVisitandoPorcentaje}
            iconFamily="MaterialIcons"
            iconName="people"
          />
          <ProgressBar
            label="Devocionales"
            current={meta.progreso.devocionalesActuales}
            goal={meta.metaDevocionales}
            percentage={meta.progreso.devocionalesPorcentaje}
            iconFamily="MaterialCommunityIcons"
            iconName="book-open-variant"
          />
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  subtitle: {
    color: '#666',
    marginBottom: 16,
  },
  progressContainer: {
    marginTop: 8,
  },
});
