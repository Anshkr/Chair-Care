import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AppIcon } from '../components/common/AppIcon';
import { Colors } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { technicianApi } from '../services/api';
import {
  TechnicianOnboardingChaircareMobileScreen,
  TechnicianDashboardChaircareMobileScreen,
  TechnicianAvailabilityChaircareMobileScreen,
  JobRequestsChaircareMobileScreen,
  JobRequestDetailsChaircareMobileScreen,
  AcceptRequestConfirmationChaircareMobileScreen,
  RequestAcceptedChaircareMobileScreen,
  NavigateToCustomerChaircareMobileScreen,
  ArrivedAtCustomerChaircareMobileScreen,
  ActiveJobChaircareMobileScreen,
  AdditionalWorkApprovalChaircareMobileScreen,
  JobCompletedChaircareMobileScreen,
  EarningsChaircareMobileScreen,
  EarningDetailsChaircareMobileScreen,
  ReviewsRatingsChaircareMobileScreen,
  TechnicianChatChaircareMobileScreen,
  TechnicianProfileChaircareMobileScreen,
  TechnicianNotificationsChaircareMobileScreen,
  TechnicianJobHistoryChaircareMobileScreen,
  TechnicianAccountStatusScreen,
} from '../screens/technician';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TechnicianTabs = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surfaceContainerLowest,
          borderTopColor: theme.outlineHairline,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.secondaryCobalt,
        tabBarInactiveTintColor: theme.outline,
      }}
    >
      <Tab.Screen
        name="TechDashboardTab"
        component={TechnicianDashboardChaircareMobileScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <AppIcon
              name="LayoutDashboard"
              size={20}
              color={color}
              strokeWidth={focused ? 2.2 : 1.8}
            />
          ),
        }}
      />
      <Tab.Screen
        name="JobRequestsTab"
        component={JobRequestsChaircareMobileScreen}
        options={{
          tabBarLabel: 'Job Queue',
          tabBarIcon: ({ color, focused }) => (
            <AppIcon
              name="Zap"
              size={20}
              color={color}
              strokeWidth={focused ? 2.2 : 1.8}
            />
          ),
        }}
      />
      <Tab.Screen
        name="TechHistoryTab"
        component={TechnicianJobHistoryChaircareMobileScreen}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ color, focused }) => (
            <AppIcon
              name="History"
              size={20}
              color={color}
              strokeWidth={focused ? 2.2 : 1.8}
            />
          ),
        }}
      />
      <Tab.Screen
        name="EarningsTab"
        component={EarningsChaircareMobileScreen}
        options={{
          tabBarLabel: 'Earnings',
          tabBarIcon: ({ color, focused }) => (
            <AppIcon
              name="Wallet"
              size={20}
              color={color}
              strokeWidth={focused ? 2.2 : 1.8}
            />
          ),
        }}
      />
      <Tab.Screen
        name="TechProfileTab"
        component={TechnicianProfileChaircareMobileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <AppIcon
              name="UserCircle"
              size={20}
              color={color}
              strokeWidth={focused ? 2.2 : 1.8}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const EarningsRedirectScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  React.useEffect(() => {
    navigation.replace('TechnicianMain', {
      screen: 'EarningsTab',
      params: route?.params,
    });
  }, [navigation, route?.params]);
  return <EarningsChaircareMobileScreen navigation={navigation} route={route} />;
};

export const TechnicianNavigator: React.FC = () => {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const checkStatus = useCallback(async () => {
    try {
      const res = await technicianApi.getProfile();
      if (res.success && res.data) {
        setStatus(res.data.verificationStatus || 'pending');
      } else {
        setStatus('pending');
      }
    } catch {
      setStatus('pending');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surface }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // If not verified ('pending', 'rejected', 'reupload_requested'), show TechnicianAccountStatusScreen
  if (status !== 'verified') {
    return <TechnicianAccountStatusScreen onApproved={() => setStatus('verified')} />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
      initialRouteName="TechnicianMain"
    >
      <Stack.Screen name="TechnicianMain" component={TechnicianTabs} />
      <Stack.Screen name="TechnicianOnboarding" component={TechnicianOnboardingChaircareMobileScreen} />
      <Stack.Screen name="TechnicianAvailability" component={TechnicianAvailabilityChaircareMobileScreen} />
      <Stack.Screen name="JobRequestDetails" component={JobRequestDetailsChaircareMobileScreen} />
      <Stack.Screen
        name="AcceptRequestConfirmation"
        component={AcceptRequestConfirmationChaircareMobileScreen}
        options={{ presentation: 'transparentModal', animation: 'fade' }}
      />
      <Stack.Screen name="RequestAccepted" component={RequestAcceptedChaircareMobileScreen} />
      <Stack.Screen name="NavigateToCustomer" component={NavigateToCustomerChaircareMobileScreen} />
      <Stack.Screen name="ArrivedAtCustomer" component={ArrivedAtCustomerChaircareMobileScreen} />
      <Stack.Screen name="ActiveJob" component={ActiveJobChaircareMobileScreen} />
      <Stack.Screen name="AdditionalWorkApproval" component={AdditionalWorkApprovalChaircareMobileScreen} />
      <Stack.Screen name="JobCompleted" component={JobCompletedChaircareMobileScreen} />
      <Stack.Screen name="Earnings" component={EarningsRedirectScreen} />
      <Stack.Screen name="EarningDetails" component={EarningDetailsChaircareMobileScreen} />
      <Stack.Screen name="ReviewsRatings" component={ReviewsRatingsChaircareMobileScreen} />
      <Stack.Screen name="TechnicianChat" component={TechnicianChatChaircareMobileScreen} />
      <Stack.Screen name="TechnicianProfile" component={TechnicianProfileChaircareMobileScreen} />
      <Stack.Screen name="Notifications" component={TechnicianNotificationsChaircareMobileScreen} />
      <Stack.Screen name="TechnicianNotifications" component={TechnicianNotificationsChaircareMobileScreen} />
      <Stack.Screen name="TechnicianJobHistory" component={TechnicianJobHistoryChaircareMobileScreen} />
      <Stack.Screen name="JobHistory" component={TechnicianJobHistoryChaircareMobileScreen} />
    </Stack.Navigator>
  );
};
