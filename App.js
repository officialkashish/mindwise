import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Activity, User, Users, Gift } from 'lucide-react-native';
import { useStore } from './src/store/useStore';
import { theme } from './src/theme/theme';

// Import Screens
import AuthScreen from './src/screens/AuthScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ChatScreen from './src/screens/ChatScreen';
import HealthSyncScreen from './src/screens/HealthSyncScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EmergencyScreen from './src/screens/EmergencyScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import LiveSessionsScreen from './src/screens/LiveSessionsScreen';
import StressBusterScreen from './src/screens/StressBusterScreen';
import RewardsScreen from './src/screens/RewardsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Chat tab removed — replaced with XP/Rewards tab
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        if (route.name === 'Home') return <Home color={color} size={size} />;
        if (route.name === 'Community') return <Users color={color} size={size} />;
        if (route.name === 'Rewards') return <Gift color={color} size={size} />;
        if (route.name === 'Health') return <Activity color={color} size={size} />;
        if (route.name === 'Profile') return <User color={color} size={size} />;
      },
      tabBarActiveTintColor: theme.colors.teal,
      tabBarInactiveTintColor: 'gray',
      headerShown: false,
    })}
  >
    <Tab.Screen name="Home" component={DashboardScreen} />
    <Tab.Screen name="Community" component={CommunityScreen} />
    <Tab.Screen name="Rewards" component={RewardsScreen} />
    <Tab.Screen name="Health" component={HealthSyncScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

export default function App() {
  const user = useStore(s => s.user);
  const onboardingAnswers = useStore(s => s.onboardingAnswers);

  const showAuth = !user;
  const showOnboarding = user && !onboardingAnswers;
  const showMain = user && onboardingAnswers;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {showAuth && (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
        {showOnboarding && (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ gestureEnabled: false }} />
        )}
        {showMain && (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Emergency" component={EmergencyScreen} />
            <Stack.Screen name="LiveSessions" component={LiveSessionsScreen} />
            <Stack.Screen name="StressBuster" component={StressBusterScreen} options={{ gestureEnabled: false }} />
            <Stack.Screen name="Chat" component={ChatScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
