import React, { useState, useMemo } from 'react';
import { View, StyleSheet, RefreshControl, ScrollView, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator, Chip, FAB, IconButton } from 'react-native-paper';
import { useQuery } from '@apollo/client/react';
import { useRouter } from 'expo-router';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { VISITAS_QUERY } from '../../src/graphql/visitas';
import { ME_DETAILED_QUERY } from '../../src/graphql/auth';
import WeekCalendar from '../../src/components/WeekCalendar';
import type { Visita } from '../../src/types/visita';
import { colors } from '../../src/constants/colors';
import { getWeekStart, getWeekEnd, formatWeekRange } from '../../src/utils/dateHelpers';

type FilterType = 'all' | 'mine' | 'nucleo';

export default function VisitasScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));

  const { data, loading, error, refetch } = useQuery(VISITAS_QUERY, {
    fetchPolicy: 'cache-and-network',
  });

  const { data: userData } = useQuery(ME_DETAILED_QUERY, {
    fetchPolicy: 'cache-and-network',
  });

  // Get user's miembro data to find their núcleo
  const miembro = useMemo(() => {
    if (!userData?.miembros || !user?.id) return null;
    return userData.miembros.find((m: any) => m.usuarioId === user.id);
  }, [userData, user]);

  const handleVisitaPress = (visitaId: string) => {
    router.push(`/visita-detalle?id=${visitaId}`);
  };

  // Week navigation handlers
  const handlePrevWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const handleNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const handleToday = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
  };

  // Week range for display
  const weekEnd = useMemo(() => getWeekEnd(currentWeekStart), [currentWeekStart]);
  const weekRangeText = useMemo(
    () => formatWeekRange(currentWeekStart, weekEnd),
    [currentWeekStart, weekEnd]
  );

  // Filter visitas based on active filter
  const filteredVisitas = useMemo(() => {
    const allVisitas: Visita[] = data?.visitas || [];

    switch (activeFilter) {
      case 'mine':
        // Show only visitas where user is a visitor
        return allVisitas.filter((v) =>
          v.visitorUserIds?.includes(user?.id || '')
        );
      case 'nucleo':
        // Show only visitas from user's núcleo
        return allVisitas.filter((v) =>
          v.nucleo?.id === miembro?.nucleoId
        );
      default:
        return allVisitas;
    }
  }, [data, activeFilter, user, miembro]);

  // Count visitas for the current week
  const weekVisitasCount = useMemo(() => {
    return filteredVisitas.length;
  }, [filteredVisitas]);

  if (loading && !data) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text variant="bodyLarge" style={styles.loadingText}>
          Cargando visitas...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="headlineSmall" style={styles.errorText}>
          Error al cargar visitas
        </Text>
        <Text variant="bodyMedium" style={styles.errorDetail}>
          {error.message}
        </Text>
      </View>
    );
  }

  const allVisitasEmpty = (data?.visitas || []).length === 0 && !loading;

  if (allVisitasEmpty) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="clipboard-text-outline" size={64} color="#999" />
        <Text variant="headlineMedium" style={styles.emptyTitle}>
          No hay visitas
        </Text>
        <Text variant="bodyLarge" style={styles.emptyText}>
          Aún no se han registrado visitas
        </Text>
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => router.push('/nueva-visita')}
          color="#fff"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <MaterialCommunityIcons name="calendar-check" size={32} color={colors.primary} />
          <View style={styles.headerText}>
            <Text variant="headlineMedium" style={styles.title}>
              Visitas
            </Text>
            <Text variant="bodyMedium" style={styles.count}>
              {weekVisitasCount} {weekVisitasCount === 1 ? 'visita' : 'visitas'}
            </Text>
          </View>
        </View>

        {/* Week navigation */}
        <View style={styles.weekNavigation}>
          <IconButton
            icon="chevron-left"
            size={24}
            onPress={handlePrevWeek}
            iconColor={colors.primary}
          />
          <TouchableOpacity onPress={handleToday} style={styles.weekRangeButton}>
            <Text variant="titleMedium" style={styles.weekRangeText}>
              {weekRangeText}
            </Text>
          </TouchableOpacity>
          <IconButton
            icon="chevron-right"
            size={24}
            onPress={handleNextWeek}
            iconColor={colors.primary}
          />
        </View>

        {/* Filters - Simplified */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContainer}
        >
          <Chip
            selected={activeFilter === 'all'}
            onPress={() => setActiveFilter('all')}
            style={styles.filterChip}
            icon={() => <MaterialIcons name="view-list" size={18} color={activeFilter === 'all' ? colors.primary : '#666'} />}
          >
            Todas
          </Chip>
          <Chip
            selected={activeFilter === 'mine'}
            onPress={() => setActiveFilter('mine')}
            style={styles.filterChip}
            icon={() => <MaterialIcons name="person" size={18} color={activeFilter === 'mine' ? colors.primary : '#666'} />}
          >
            Mis Visitas
          </Chip>
          {miembro?.nucleoId && (
            <Chip
              selected={activeFilter === 'nucleo'}
              onPress={() => setActiveFilter('nucleo')}
              style={styles.filterChip}
              icon={() => <MaterialIcons name="location-on" size={18} color={activeFilter === 'nucleo' ? colors.primary : '#666'} />}
            >
              Mi Núcleo
            </Chip>
          )}
        </ScrollView>
      </View>

      {/* Week Calendar */}
      <WeekCalendar
        visitas={filteredVisitas}
        currentWeekStart={currentWeekStart}
        onVisitPress={handleVisitaPress}
      />

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/nueva-visita')}
        color="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  count: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  weekNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  weekRangeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekRangeText: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  filtersScroll: {
    marginBottom: 4,
  },
  filtersContainer: {
    gap: 8,
    paddingRight: 16,
  },
  filterChip: {
    height: 36,
  },
  loadingText: {
    marginTop: 16,
    color: colors.textSecondary,
  },
  errorText: {
    color: colors.error,
    marginBottom: 8,
  },
  errorDetail: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyTitle: {
    marginTop: 16,
    color: colors.textSecondary,
  },
  emptyText: {
    marginTop: 8,
    color: colors.gray400,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
});
