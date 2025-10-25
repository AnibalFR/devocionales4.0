import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, ActivityIndicator, FAB } from 'react-native-paper';
import { useQuery } from '@apollo/client/react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { DASHBOARD_QUERY, MY_NUCLEO_STATS_QUERY } from '../../src/graphql/dashboard';
import { ME_DETAILED_QUERY } from '../../src/graphql/auth';
import DashboardHeader from '../../src/components/DashboardHeader';
import MetaProgressCard from '../../src/components/MetaProgressCard';
import PertenenciaCard from '../../src/components/PertenenciaCard';
import NucleoStatsCard from '../../src/components/NucleoStatsCard';
import type { MetaActiva } from '../../src/types/dashboard';
import { colors } from '../../src/constants/colors';

export default function InicioScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const { data: dashboardData, loading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } = useQuery(DASHBOARD_QUERY, {
    fetchPolicy: 'cache-and-network',
  });

  const { data: userData, loading: userLoading, refetch: refetchUser } = useQuery(ME_DETAILED_QUERY, {
    fetchPolicy: 'cache-and-network',
  });

  // Obtener datos del usuario y su miembro
  const miembro = useMemo(() => {
    if (!userData?.miembros || !user?.id) return null;
    return userData.miembros.find((m: any) => m.usuarioId === user.id);
  }, [userData, user]);

  const nucleoId = miembro?.nucleoId;
  const metaActiva: MetaActiva = dashboardData?.metaActiva;

  // Query de estadísticas del núcleo (solo si tiene núcleo)
  const { data: nucleoStatsData } = useQuery(MY_NUCLEO_STATS_QUERY, {
    variables: {
      fechaInicio: metaActiva?.fechaInicio || '',
      fechaFin: metaActiva?.fechaFin || '',
    },
    skip: !nucleoId || !metaActiva,
    fetchPolicy: 'cache-and-network',
  });

  // Calcular estadísticas del núcleo
  const nucleoStats = useMemo(() => {
    if (!nucleoStatsData?.visitasPorCiclo || !nucleoId) {
      return { visitasRealizadas: 0, personasParticipando: 0, ultimaVisita: undefined };
    }

    const visitasDelNucleo = nucleoStatsData.visitasPorCiclo.filter(
      (v: any) => v.nucleoId === nucleoId && v.visitStatus === 'realizada'
    );

    const ultimaVisita = visitasDelNucleo.length > 0
      ? visitasDelNucleo[0].visitDate
      : undefined;

    return {
      visitasRealizadas: visitasDelNucleo.length,
      personasParticipando: new Set(visitasDelNucleo.flatMap((v: any) => v.visitorUserIds || [])).size,
      ultimaVisita,
    };
  }, [nucleoStatsData, nucleoId]);

  const handleRefresh = async () => {
    await Promise.all([
      refetchDashboard(),
      refetchUser(),
    ]);
  };

  const loading = dashboardLoading || userLoading;

  if (loading && !dashboardData && !userData) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text variant="bodyLarge" style={styles.loadingText}>
          Cargando dashboard...
        </Text>
      </View>
    );
  }

  if (dashboardError) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="headlineSmall" style={styles.errorText}>
          Error al cargar dashboard
        </Text>
        <Text variant="bodyMedium" style={styles.errorDetail}>
          {dashboardError.message}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DashboardHeader
        nombre={userData?.me?.nombre || user?.nombre || ''}
        apellidos={userData?.me?.apellidos}
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.content}>
          {/* Card de Pertenencia */}
          <PertenenciaCard
            nucleoNombre={miembro?.nucleo?.nombre}
            barrioNombre={miembro?.nucleo?.barrio?.nombre}
            rol={userData?.me?.rol || user?.rol || ''}
          />

          {/* Card de Meta Global */}
          {metaActiva && <MetaProgressCard meta={metaActiva} />}

          {/* Card de Contribución del Núcleo */}
          {miembro?.nucleo && (
            <NucleoStatsCard
              nucleoNombre={miembro.nucleo.nombre}
              visitasRealizadas={nucleoStats.visitasRealizadas}
              personasParticipando={nucleoStats.personasParticipando}
              ultimaVisita={nucleoStats.ultimaVisita}
            />
          )}

          {!metaActiva && (
            <Text variant="bodyMedium" style={styles.noMetaText}>
              No hay meta activa en este momento
            </Text>
          )}
        </View>
      </ScrollView>

      <FAB
        icon="plus"
        label="Registrar Visita"
        style={styles.fab}
        onPress={() => router.push('/visitas')}
      />
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
  content: {
    padding: 16,
    paddingBottom: 80,
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
  noMetaText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
});
