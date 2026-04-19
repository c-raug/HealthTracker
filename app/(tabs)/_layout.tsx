import { View, TouchableOpacity } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors, Typography } from '../../constants/theme';
import { MoreMenuProvider, useMoreMenu } from '../../context/MoreMenuContext';
import MoreMenuPopover from '../../components/navigation/MoreMenuPopover';
import HeaderXpBar from '../../components/navigation/HeaderXpBar';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, color }: { name: IoniconsName; color: string }) {
  return <Ionicons name={name} size={24} color={color} />;
}

function BackHeaderButton() {
  const router = useRouter();
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={() => router.back()}
      style={{ marginLeft: 8, padding: 4 }}
      activeOpacity={0.7}
    >
      <Ionicons name="chevron-back" size={28} color={colors.text} />
    </TouchableOpacity>
  );
}

function MoreTabButton({ children, style, onPress: _onPress, onLongPress: _onLongPress, ...rest }: any) {
  const { toggle } = useMoreMenu();
  return (
    <TouchableOpacity
      style={[{ flex: 1, alignItems: 'center', justifyContent: 'center' }, style]}
      onPress={toggle}
      activeOpacity={0.7}
      {...rest}
    >
      {children}
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const colors = useColors();

  return (
    <MoreMenuProvider>
      <View style={{ flex: 1 }}>
        <Tabs
          initialRouteName="nutrition"
          screenOptions={{
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textSecondary,
            tabBarStyle: {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
            },
            headerStyle: {
              backgroundColor: colors.background,
              borderBottomWidth: 0,
              elevation: 0,
              shadowOpacity: 0,
            },
            headerTintColor: colors.text,
            headerShadowVisible: false,
            headerTitleAlign: 'left',
            headerTitleStyle: { ...Typography.h2, color: colors.text },
            headerRight: () => <HeaderXpBar />,
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Weight',
              tabBarIcon: ({ color }) => <TabIcon name="scale-outline" color={color} />,
            }}
          />
          <Tabs.Screen
            name="nutrition"
            options={{
              title: 'Nutrition',
              tabBarIcon: ({ color }) => <TabIcon name="restaurant-outline" color={color} />,
            }}
          />
          <Tabs.Screen
            name="activities"
            options={{
              title: 'Activities',
              tabBarIcon: ({ color }) => <TabIcon name="flame-outline" color={color} />,
            }}
          />
          <Tabs.Screen
            name="more"
            options={{
              title: 'More',
              tabBarIcon: ({ color }) => <TabIcon name="ellipsis-horizontal" color={color} />,
              tabBarButton: (props) => <MoreTabButton {...props} />,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              href: null,
              headerLeft: () => <BackHeaderButton />,
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: 'Settings',
              href: null,
              headerLeft: () => <BackHeaderButton />,
            }}
          />
        </Tabs>
        <MoreMenuPopover />
      </View>
    </MoreMenuProvider>
  );
}
