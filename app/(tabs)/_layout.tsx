import { useState, useEffect } from 'react';
import { TouchableOpacity, View, Text, Image } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../constants/theme';
import { useApp } from '../../context/AppContext';

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

const AVATAR_BTN_SIZE = 28;

function ProfileHeaderButton() {
  const router = useRouter();
  const colors = useColors();
  const { preferences } = useApp();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    if (preferences.avatarUri) {
      setAvatarUri(preferences.avatarUri);
    }
  }, [preferences.avatarUri]);

  const getInitials = () => {
    if (!preferences.profile?.name) return null;
    const parts = preferences.profile.name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0]?.toUpperCase() ?? null;
  };

  const initials = getInitials();

  return (
    <TouchableOpacity
      onPress={() => router.push('/(tabs)/profile')}
      style={{ marginLeft: 8, padding: 4 }}
      activeOpacity={0.7}
    >
      <View style={{
        width: AVATAR_BTN_SIZE,
        height: AVATAR_BTN_SIZE,
        borderRadius: AVATAR_BTN_SIZE / 2,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {avatarUri ? (
          <Image
            source={{ uri: avatarUri }}
            style={{ width: AVATAR_BTN_SIZE, height: AVATAR_BTN_SIZE, borderRadius: AVATAR_BTN_SIZE / 2 }}
          />
        ) : initials ? (
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>{initials}</Text>
        ) : (
          <Ionicons name="person-circle-outline" size={AVATAR_BTN_SIZE} color={colors.text} />
        )}
      </View>
    </TouchableOpacity>
  );
}

function SettingsHeaderButton() {
  const router = useRouter();
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={() => router.push('/(tabs)/settings')}
      style={{ marginRight: 8, padding: 4 }}
      activeOpacity={0.7}
    >
      <Ionicons name="settings-outline" size={22} color={colors.text} />
    </TouchableOpacity>
  );
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
        headerLeft: () => <ProfileHeaderButton />,
        headerRight: () => <SettingsHeaderButton />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Weight',
          tabBarIcon: ({ color }) => (
            <TabIcon name="scale-outline" color={color} />
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
          headerRight: () => null,
        }}
      />
    </Tabs>
  );
}
