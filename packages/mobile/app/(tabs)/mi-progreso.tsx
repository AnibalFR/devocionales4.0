import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, ActivityIndicator, Card } from 'react-native-paper';
import { useQuery } from '@apollo/client/react';
import { useAuth } from '../../src/contexts/AuthContext';
import { VISITAS_QUERY } from '../../src/graphql/visitas';
import { DASHBOARD_QUERY } from '../../src/graphql/dashboard';
import { ME_DETAILED_QUERY } from '../../src/graphql/auth';
import StatCard from '../../src/components/StatCard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../src/constants/colors';

export default function MiProgresoScreen() {
  const { user } = useAuth();

  const { data: visitasData, loading: visitasLoading, error, refetch: refetchVisitas } = useQuery(VISITAS_QUERY, {
    fetchPolicy: 'cache-and-network',
  });

  const { data: dashboardData, refetch: refetchDashboard } = useQuery(DASHBOARD_QUERY, {
    fetchPolicy: 'cache-and-network',
  });

  const { data: userData, refetch: refetchUser } = useQuery(ME_DETAILED_QUERY, {
    fetchPolicy: 'cache-and-network',
  });

  const miembro = useMemo(() => {
    if (!userData?.miembros || !user?.id) return null;
    return userData.miembros.find((m: any) => m.usuarioId === user.id);
  }, [userData, user]);

  const metaActiva = dashboardData?.metaActiva;
  const fechaInicio = metaActiva?.fechaInicio;
  const fechaFin = metaActiva?.fechaFin;

  // Calcular estadísticas personales
  const stats = useMemo(() => {
    if (!visitasData?.visitas || !user?.id) {
      return {
        misVisitas: 0,
        misVisitasRealizadas: 0,
        familiasVisitadas: 0,
        promedioNucleo: 0,
      };
    }

    const todasVisitas = visitasData.visitas;

    // Filtrar visitas en el período actual
    const visitasEnPeriodo = todasVisitas.filter((v: any) => {
      if (!fechaInicio || !fechaFin) return true;
      return v.visitDate >= fechaInicio && v.visitDate <= fechaFin;
    });

    // Visitas donde soy visitador
    const misVisitas = visitasEnPeriodo.filter((v: any) =>
      v.visitorUserIds?.includes(user.id)
    );

    const misVisitasRealizadas = misVisitas.filter((v: any) => v.visitStatus === 'realizada');

    const familiasVisitadas = new Set(misVisitas.map((v: any) => v.familia.id)).size;

    // Calcular promedio del núcleo (si tiene núcleo)
    let promedioNucleo = 0;
    if (miembro?.nucleoId) {
      const visitasDelNucleo = visitasEnPeriodo.filter(
        (v: any) => v.nucleo?.id === miembro.nucleoId && v.visitStatus === 'realizada'
      );
      const visitadoresUnicos = new Set(
        visitasDelNucleo.flatMap((v: any) => v.visitorUserIds || [])
      ).size;
      promedioNucleo = visitadoresUnicos > 0
        ? Math.round(visitasDelNucleo.length / visitadoresUnicos)
        : 0;
    }

    return {
      misVisitas: misVisitas.length,
      misVisitasRealizadas: misVisitasRealizadas.length,
      familiasVisitadas,
      promedioNucleo,
    };
  }, [visitasData, user, fechaInicio, fechaFin, miembro]);

  const handleRefresh = async () => {
    await Promise.all([
      refetchVisitas(),
      refetchDashboard(),
      refetchUser(),
    ]);
  };

  if (visitasLoading && !visitasData) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text variant="bodyLarge" style={styles.loadingText}>
          Cargando estadísticas...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="headlineSmall" style={styles.errorText}>
          Error al cargar estadísticas
        </Text>
        <Text variant="bodyMedium" style={styles.errorDetail}>
          {error.message}
        </Text>
      </View>
    );
  }

  // Determinar el mensaje y estilo según las visitas
  const ambosEnCero = stats.misVisitasRealizadas === 0 && stats.promedioNucleo === 0;
  const estaArribaPromedio = stats.misVisitasRealizadas > stats.promedioNucleo;

  // Mensaje dinámico
  let mensajeComparacion = '¡Sigue participando!';
  let iconoComparacion: any = "chart-timeline-variant";
  let colorIcono = "#2196F3";
  let estiloExito = false;

  if (ambosEnCero) {
    mensajeComparacion = '¡Es momento de comenzar!';
    iconoComparacion = "rocket-launch";
    colorIcono = "#9C27B0";
  } else if (estaArribaPromedio) {
    mensajeComparacion = '¡Estás por encima del promedio!';
    iconoComparacion = "trophy";
    colorIcono = "#FFC107";
    estiloExito = true;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={visitasLoading} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <MaterialCommunityIcons name="chart-line" size={48} color={colors.primary} />
          <Text variant="headlineMedium" style={styles.title}>
            Mi Progreso
          </Text>
          {metaActiva && (
            <Text variant="bodyMedium" style={styles.subtitle}>
              {metaActiva.trimestre}
            </Text>
          )}
        </View>

        <View style={styles.content}>
          <StatCard
            label="Visitas Totales"
            value={stats.misVisitas}
            iconFamily="MaterialCommunityIcons"
            iconName="clipboard-text"
            iconColor="#2196F3"
            subtitle="En el período actual"
          />

          <StatCard
            label="Visitas Realizadas"
            value={stats.misVisitasRealizadas}
            iconFamily="MaterialIcons"
            iconName="check-circle"
            iconColor="#4CAF50"
            subtitle="Completadas exitosamente"
          />

          <StatCard
            label="Familias Visitadas"
            value={stats.familiasVisitadas}
            iconFamily="MaterialCommunityIcons"
            iconName="home-heart"
            iconColor="#FF9800"
            subtitle="Familias únicas"
          />

          {miembro?.nucleoId && (
            <>
              <Card style={styles.comparisonCard}>
                <Card.Content>
                  <View style={styles.comparisonHeader}>
                    <MaterialCommunityIcons
                      name={iconoComparacion}
                      size={32}
                      color={colorIcono}
                    />
                    <Text variant="titleMedium" style={styles.comparisonTitle}>
                      Comparación con el Núcleo
                    </Text>
                  </View>

                  <View style={styles.comparisonStats}>
                    <View style={styles.comparisonRow}>
                      <Text variant="bodyMedium" style={styles.comparisonLabel}>
                        Tus visitas realizadas:
                      </Text>
                      <Text variant="headlineSmall" style={styles.comparisonValue}>
                        {stats.misVisitasRealizadas}
                      </Text>
                    </View>

                    <View style={styles.comparisonRow}>
                      <Text variant="bodyMedium" style={styles.comparisonLabel}>
                        Promedio del núcleo:
                      </Text>
                      <Text variant="headlineSmall" style={styles.comparisonValue}>
                        {stats.promedioNucleo}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.badge, estiloExito ? styles.badgeSuccess : styles.badgeInfo]}>
                    <Text variant="bodyMedium" style={styles.badgeText}>
                      {mensajeComparacion}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            </>
          )}

          {!metaActiva && (
            <Text variant="bodyMedium" style={styles.noMetaText}>
              Las estadísticas se muestran para el período de la meta activa
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFF',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontWeight: 'bold',
    marginTop: 12,
    color: '#212121',
  },
  subtitle: {
    color: '#666',
    marginTop: 4,
  },
  content: {
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  errorText: {
    color: '#F44336',
    marginBottom: 8,
  },
  errorDetail: {
    color: '#666',
    textAlign: 'center',
  },
  comparisonCard: {
    marginVertical: 8,
    elevation: 3,
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  comparisonTitle: {
    fontWeight: 'bold',
    flex: 1,
  },
  comparisonStats: {
    gap: 12,
    marginBottom: 16,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  comparisonLabel: {
    color: '#666',
  },
  comparisonValue: {
    fontWeight: 'bold',
    color: '#212121',
  },
  badge: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  badgeSuccess: {
    backgroundColor: '#E8F5E9',
  },
  badgeInfo: {
    backgroundColor: '#E3F2FD',
  },
  badgeText: {
    fontWeight: '600',
  },
  noMetaText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
    fontStyle: 'italic',
  },
});
