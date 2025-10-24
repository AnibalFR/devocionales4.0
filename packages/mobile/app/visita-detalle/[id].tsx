import { View, Text, StyleSheet } from 'react-native';

export default function VisitaDetalleScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalle de Visita</Text>
      <Text style={styles.text}>Pantalla en construcción</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    color: '#666',
  },
});
