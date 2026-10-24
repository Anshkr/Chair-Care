import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AppIcon } from '../components/common/AppIcon';
import { Colors } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import {
  ServicesAvailableChaircareMobileScreen,
  ServiceDetailsOfficeChairRepairChaircareMobileScreen,
  AuthenticationGateChaircareMobileScreen,
  CustomerRegistrationChaircareMobileScreen,
  BookingStep1SelectServiceChaircareMobileScreen,
  BookingStep2DescribeProblemChaircareMobileScreen,
  BookingStep3ServiceLocationChaircareMobileScreen,
  BookingStep4ScheduleVisitChaircareMobileScreen,
  BookingStep5ConfirmRequestChaircareMobileScreen,
  FindingATechnicianChaircareMobileScreen,
  TechnicianAssignedChaircareMobileScreen,
  LiveTechnicianTrackingChaircareMobileScreen,
  TechnicianArrivedChaircareMobileScreen,
  ActiveServiceChaircareMobileScreen,
  ServiceCompletedChaircareMobileScreen,
  PaymentInvoiceChaircareMobileScreen,
  PaymentSuccessChaircareMobileScreen,
  RateYourExperienceChaircareMobileScreen,
  ChatWithTechnicianChaircareMobileScreen,
  MyRequestsChaircareMobileScreen,
  RequestDetailsChaircareMobileScreen,
  NotificationsChaircareMobileScreen,
  CustomerProfileChaircareMobileScreen,
} from '../screens/customer';
import { TechnicianOnboardingChaircareMobileScreen } from '../screens/technician';
import { SupportConversationChaircareMobileScreen } from '../screens/admin/SupportConversationChaircareMobileScreen';
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const CustomerTabs = () => {
  const { isCustomerAuthorized } = useAuth();
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
        name="ServicesAvailableTab"
        component={ServicesAvailableChaircareMobileScreen}
        options={{
          tabBarLabel: 'Services',
          tabBarIcon: ({ color, focused }) => (
            <AppIcon
              name="Wrench"
              size={20}
              color={color}
              strokeWidth={focused ? 2.2 : 1.8}
            />
          ),
        }}
      />
      <Tab.Screen
        name="MyRequestsTab"
        component={MyRequestsChaircareMobileScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (!isCustomerAuthorized) {
              e.preventDefault();
              navigation.navigate('AuthenticationGate', { returnTo: 'MyRequestsTab' });
            }
          },
        })}
        options={{
          tabBarLabel: 'Requests',
          tabBarIcon: ({ color, focused }) => (
            <AppIcon
              name="ClipboardList"
              size={20}
              color={color}
              strokeWidth={focused ? 2.2 : 1.8}
            />
          ),
        }}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsChaircareMobileScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (!isCustomerAuthorized) {
              e.preventDefault();
              navigation.navigate('AuthenticationGate', { returnTo: 'NotificationsTab' });
            }
          },
        })}
        options={{
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ color, focused }) => (
            <AppIcon
              name="Bell"
              size={20}
              color={color}
              strokeWidth={focused ? 2.2 : 1.8}
            />
          ),
        }}
      />
      <Tab.Screen
        name="CustomerProfileTab"
        component={CustomerProfileChaircareMobileScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (!isCustomerAuthorized) {
              e.preventDefault();
              navigation.navigate('AuthenticationGate', { returnTo: 'CustomerProfileTab' });
            }
          },
        })}
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

export const CustomerNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
      initialRouteName="CustomerMain"
    >
      <Stack.Screen name="CustomerMain" component={CustomerTabs} />
      <Stack.Screen name="ServiceDetails" component={ServiceDetailsOfficeChairRepairChaircareMobileScreen} />
      <Stack.Screen
        name="AuthenticationGate"
        component={AuthenticationGateChaircareMobileScreen}
        options={{ presentation: 'transparentModal', animation: 'fade' }}
      />
      <Stack.Screen name="CustomerRegistration" component={CustomerRegistrationChaircareMobileScreen} />
      <Stack.Screen name="TechnicianOnboarding" component={TechnicianOnboardingChaircareMobileScreen} />
      <Stack.Screen name="BookingStep1" component={BookingStep1SelectServiceChaircareMobileScreen} />
      <Stack.Screen name="BookingStep2" component={BookingStep2DescribeProblemChaircareMobileScreen} />
      <Stack.Screen name="BookingStep3" component={BookingStep3ServiceLocationChaircareMobileScreen} />
      <Stack.Screen name="BookingStep4" component={BookingStep4ScheduleVisitChaircareMobileScreen} />
      <Stack.Screen name="BookingStep5" component={BookingStep5ConfirmRequestChaircareMobileScreen} />
      <Stack.Screen name="FindingTechnician" component={FindingATechnicianChaircareMobileScreen} />
      <Stack.Screen name="TechnicianAssigned" component={TechnicianAssignedChaircareMobileScreen} />
      <Stack.Screen name="LiveTechnicianTracking" component={LiveTechnicianTrackingChaircareMobileScreen} />
      <Stack.Screen name="TechnicianArrived" component={TechnicianArrivedChaircareMobileScreen} />
      <Stack.Screen name="ActiveService" component={ActiveServiceChaircareMobileScreen} />
      <Stack.Screen name="ServiceCompleted" component={ServiceCompletedChaircareMobileScreen} />
      <Stack.Screen name="PaymentInvoice" component={PaymentInvoiceChaircareMobileScreen} />
      <Stack.Screen name="PaymentSuccess" component={PaymentSuccessChaircareMobileScreen} />
      <Stack.Screen name="RateYourExperience" component={RateYourExperienceChaircareMobileScreen} />
      <Stack.Screen name="RateExperience" component={RateYourExperienceChaircareMobileScreen} />
      <Stack.Screen name="ChatWithTechnician" component={ChatWithTechnicianChaircareMobileScreen} />
      <Stack.Screen name="SupportConversation" component={SupportConversationChaircareMobileScreen} />
      <Stack.Screen name="RequestDetails" component={RequestDetailsChaircareMobileScreen} />
    </Stack.Navigator>
  );
};
