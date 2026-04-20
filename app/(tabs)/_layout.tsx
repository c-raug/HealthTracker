import { View, TouchableOpacity } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors, Typography } from '../../constants/theme';
import { MoreMenuProvider } from '../../context/MoreMenuContext';
import MoreMenuPopover from '../../components/navigation/MoreMenuPopover';
import HeaderXpBar from '../../components/navigation/HeaderXpBar';
import PillTabBar from '../../components/navigation/PillTabBar';

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

export default function TabLayout() {
  const colors = useColors();

  return (
    <MoreMenuProvider>
      <View style={{ flex: 1 }}>
        <Tabs
          initialRouteName="home"
          tabBar={(props) => <PillTabBar {...props} />}
          screenOptions={{
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textSecondary,
            tabBarStyle: {
              position: 'absolute',
              borderTopWidth: 0,
              backgroundColor: 'transparent',
              elevation: 0,
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
            name="home"
            options={{
              title: 'Home',
            }}
          />
          <Tabs.Screen
            name="index"
            options={{
              title: 'Weight',
            }}
          />
          <Tabs.Screen
            name="nutrition"
            options={{
              title: 'Nutrition',
            }}
          />
          <Tabs.Screen
            name="activities"
            options={{
              title: 'Activities',
            }}
          />
          <Tabs.Screen
            name="more"
            options={{
              title: 'More',
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
