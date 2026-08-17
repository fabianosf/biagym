import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { Platform, Text, View } from 'react-native';

import { useAuth } from '@/features/auth';
import { colors } from '@/shared/theme';
import { getNameInitials } from '@/shared/utils/person-name';

export default function StudentTabsLayout() {
  const { user } = useAuth();
  const initials = getNameInitials(user?.name);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.line,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.faint,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Meu Plano',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="star-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: 'Loja',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Treinos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="barbell-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Conta',
          tabBarIcon: ({ color, focused }) => (
            <View
              className={`h-6 w-6 items-center justify-center rounded-full ${
                focused ? 'bg-primary' : 'bg-surface'
              }`}
            >
              <Text className={`text-[9px] font-bold ${focused ? 'text-white' : 'text-ink'}`}>
                {initials || 'TA'}
              </Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
