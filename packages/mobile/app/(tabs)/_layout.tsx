import { Tabs } from 'expo-router';
import { Platform, Text } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="visitas"
        options={{
          title: 'Visitas',
          tabBarIcon: ({ color }) => <TabBarIcon name="list" color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}

// Simple icon component usando Text de React Native
function TabBarIcon({ name, color }: { name: string; color: string }) {
  const icons: Record<string, string> = {
    list: '📋',
    user: '👤',
  };

  return <Text style={{ fontSize: 24, color }}>{icons[name]}</Text>;
}
