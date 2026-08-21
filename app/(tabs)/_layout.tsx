import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { colors, spacing } from '@/src/theme';

const TAB_ICONS = {
  do: ['sparkles', 'sparkles-outline'],
  'around-me': ['navigate-circle', 'navigate-circle-outline'],
  memories: ['heart', 'heart-outline'],
  me: ['person-circle', 'person-circle-outline'],
} as const;

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="do"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.blueDark,
        tabBarInactiveTintColor: colors.charcoalMuted,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', paddingBottom: Platform.OS === 'android' ? spacing.xs : 0 },
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 86 : 70,
          paddingTop: spacing.xs,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
        },
        tabBarIcon: ({ color, focused, size }) => {
          const icons = TAB_ICONS[route.name as keyof typeof TAB_ICONS] ?? TAB_ICONS.do;
          return <Ionicons name={focused ? icons[0] : icons[1]} color={color} size={size} />;
        },
      })}
    >
      <Tabs.Screen name="do" options={{ title: 'Do' }} />
      <Tabs.Screen name="around-me" options={{ title: 'Around Me' }} />
      <Tabs.Screen name="memories" options={{ title: 'Memories' }} />
      <Tabs.Screen name="me" options={{ title: 'Me' }} />
    </Tabs>
  );
}
