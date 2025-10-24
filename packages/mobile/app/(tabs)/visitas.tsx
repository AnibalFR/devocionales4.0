import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@apollo/client';
import { Box, VStack, Text, Spinner, Center } from '@gluestack-ui/themed';
import { VISITAS_QUERY } from '../../src/graphql/queries';
import { VisitaCard } from '../../src/components/VisitaCard';
import type { Visita } from '../../src/types';

export default function VisitasScreen() {
  const router = useRouter();
  const { data, loading, error, refetch } = useQuery(VISITAS_QUERY);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleVisitaPress = (visita: Visita) => {
    router.push(`/visita-detalle/${visita.id}`);
  };

  if (loading && !data) {
    return (
      <Center flex={1} backgroundColor="$gray50">
        <VStack space="md" alignItems="center">
          <Spinner size="large" />
          <Text color="$gray600">Cargando visitas...</Text>
        </VStack>
      </Center>
    );
  }

  if (error) {
    return (
      <Center flex={1} backgroundColor="$gray50" padding="$4">
        <VStack space="md" alignItems="center">
          <Text size="lg" color="$red600" textAlign="center">
            Error al cargar visitas
          </Text>
          <Text color="$gray600" textAlign="center">
            {error.message}
          </Text>
        </VStack>
      </Center>
    );
  }

  const visitas: Visita[] = data?.visitas || [];

  // Ordenar por fecha descendente
  const visitasOrdenadas = [...visitas].sort((a, b) =>
    new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
  );

  return (
    <Box flex={1} backgroundColor="$gray50">
      {visitas.length === 0 ? (
        <Center flex={1}>
          <VStack space="sm" alignItems="center" padding="$4">
            <Text size="xl" color="$gray600">
              📋
            </Text>
            <Text size="lg" fontWeight="$bold" color="$gray800">
              No hay visitas registradas
            </Text>
            <Text color="$gray600" textAlign="center">
              Las visitas aparecerán aquí cuando se registren
            </Text>
          </VStack>
        </Center>
      ) : (
        <FlatList
          data={visitasOrdenadas}
          renderItem={({ item }) => (
            <VisitaCard
              visita={item}
              onPress={() => handleVisitaPress(item)}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#3B82F6"
            />
          }
          ListHeaderComponent={
            <VStack space="sm" marginBottom="$3">
              <Text size="sm" color="$gray600">
                Total de visitas: {visitas.length}
              </Text>
            </VStack>
          }
        />
      )}
    </Box>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
});
