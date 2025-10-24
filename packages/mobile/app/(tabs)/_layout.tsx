import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          height: Platform.OS === 'ios' ? 85 : 65,
        },
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="visitas"
        options={{
          title: 'Visitas',
          tabBarIcon: ({ color }) => <TabBarIcon name="list" color={color} />,
          headerTitle: 'Mis Visitas',
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          headerTitle: 'Mi Perfil',
        }}
      />
    </Tabs>
  );
}

// Simple icon component (puedes reemplazar con Expo Icons después)
function TabBarIcon({ name, color }: { name: string; color: string }) {
  const icons: Record<string, string> = {
    list: '📋',
    user: '👤',
  };

  return <span style={{ fontSize: 24 }}>{icons[name]}</span>;
}
