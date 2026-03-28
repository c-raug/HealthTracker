import { TouchableOpacity } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../constants/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({
  name,
  color,
}: {
  name: IoniconsName;
  color: string;
}) {
  return <Ionicons name={name} size={24} color={color} />;
}

function FeedbackHeaderButton() {
  const router = useRouter();
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/app-settings-modal', params: { focusFeedback: '1' } })}
      style={{ marginRight: 8, padding: 4 }}
      activeOpacity={0.7}
    >
      <Ionicons name="chatbubble-outline" size={22} color={colors.text} />
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const colors = useColors();

  return (
    <Tabs
      initialRouteName="nutrition"
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerRight: () => <FeedbackHeaderButton />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Weight',
          tabBarIcon: ({ color }) => (
            <TabIcon name="barbell-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrition',
          tabBarIcon: ({ color }) => (
            <TabIcon name="restaurant-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: 'Activities',
          tabBarIcon: ({ color }) => (
            <TabIcon name="flame-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Profile',
          headerRight: () => null,
          tabBarIcon: ({ color }) => (
            <TabIcon name="person-circle" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
