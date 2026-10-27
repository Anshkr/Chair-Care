import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AppIcon } from '../components/common/AppIcon';
import { Colors } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import * as AdminScreens from '../screens/admin';
import { ChatWithTechnicianChaircareMobileScreen } from '../screens/customer/ChatWithTechnicianChaircareMobileScreen';
import { NoNetworkOfflineScreen } from '../screens/common';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const AdminTabs = () => {
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
        name="AdminDashboardTab"
        component={AdminScreens.AdminDashboardChaircareMobileScreen}
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
        name="ServiceRequestsTab"
        component={AdminScreens.ServiceRequestsChaircareMobileScreen}
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
        name="TechniciansTab"
        component={AdminScreens.TechniciansChaircareMobileScreen}
        options={{
          tabBarLabel: 'Technicians',
          tabBarIcon: ({ color, focused }) => (
            <AppIcon
              name="Users"
              size={20}
              color={color}
              strokeWidth={focused ? 2.2 : 1.8}
            />
          ),
        }}
      />
      <Tab.Screen
        name="PaymentsTab"
        component={AdminScreens.PaymentsChaircareMobileScreen}
        options={{
          tabBarLabel: 'Payments',
          tabBarIcon: ({ color, focused }) => (
            <AppIcon
              name="CreditCard"
              size={20}
              color={color}
              strokeWidth={focused ? 2.2 : 1.8}
            />
          ),
        }}
      />
      <Tab.Screen
        name="AdminSettingsTab"
        component={AdminScreens.AdminSettingsChaircareMobileScreen}
        options={{
          tabBarLabel: 'Passwords',
          tabBarIcon: ({ color, focused }) => (
            <AppIcon
              name="Key"
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

export const AdminNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
      initialRouteName="AdminMain"
    >
      <Stack.Screen name="AdminMain" component={AdminTabs} />
      <Stack.Screen name="AdminDashboard" component={AdminTabs} />
      <Stack.Screen name="PaymentsTab" component={AdminTabs} />
      <Stack.Screen name="LiveOperationsOverview" component={AdminScreens.LiveOperationsOverviewChaircareMobileScreen} />
      <Stack.Screen name="ServiceRequests" component={AdminScreens.ServiceRequestsChaircareMobileScreen} />
      <Stack.Screen name="ServiceRequestDetails" component={AdminScreens.ServiceRequestDetailsCc10483ChaircareMobileScreen} />
      <Stack.Screen name="AssignTechnician" component={AdminScreens.AssignTechnicianChaircareMobileScreen} />
      <Stack.Screen name="AssignmentConfirmation" component={AdminScreens.AssignmentConfirmationChaircareMobileScreen} />
      <Stack.Screen name="AssignmentSuccess" component={AdminScreens.AssignmentSuccessChaircareMobileScreen} />
      <Stack.Screen name="Technicians" component={AdminScreens.TechniciansChaircareMobileScreen} />
      <Stack.Screen name="TechnicianProfileRahulSharma" component={AdminScreens.TechnicianProfileRahulSharmaChaircareMobileScreen} />
      <Stack.Screen name="VerifyTechnicianVikramSingh" component={AdminScreens.VerifyTechnicianVikramSinghChaircareMobileScreen} />
      <Stack.Screen name="SuspendReactivateTechnician" component={AdminScreens.SuspendReactivateTechnicianChaircareMobileScreen} />
      <Stack.Screen name="TechnicianActionConfirmed" component={AdminScreens.TechnicianActionConfirmedChaircareMobileScreen} />
      <Stack.Screen name="Customers" component={AdminScreens.CustomersChaircareMobileScreen} />
      <Stack.Screen name="CustomerProfileAnshKumar" component={AdminScreens.CustomerProfileAnshKumarChaircareMobileScreen} />
      <Stack.Screen name="CustomerServiceHistory" component={AdminScreens.CustomerServiceHistoryChaircareMobileScreen} />
      <Stack.Screen name="CustomerAccountManagement" component={AdminScreens.CustomerAccountManagementChaircareMobileScreen} />
      <Stack.Screen name="CustomerActionConfirmed" component={AdminScreens.CustomerActionConfirmedChaircareMobileScreen} />
      <Stack.Screen name="Payments" component={AdminScreens.PaymentsChaircareMobileScreen} />
      <Stack.Screen name="PaymentDetailsTxn84291" component={AdminScreens.PaymentDetailsTxn84291ChaircareMobileScreen} />
      <Stack.Screen name="RefundPaymentIssue" component={AdminScreens.RefundPaymentIssueChaircareMobileScreen} />
      <Stack.Screen name="RefundConfirmation" component={AdminScreens.RefundConfirmationChaircareMobileScreen} />
      <Stack.Screen name="RefundCompleted" component={AdminScreens.RefundCompletedChaircareMobileScreen} />
      <Stack.Screen name="Support" component={AdminScreens.SupportChaircareSuperAdminScreen} />
      <Stack.Screen name="SupportTicketDetailsSup10482" component={AdminScreens.SupportTicketDetailsSup10482ChaircareMobileScreen} />
      <Stack.Screen name="AssignSupportTicketSup10482" component={AdminScreens.AssignSupportTicketSup10482ChaircareMobileScreen} />
      <Stack.Screen name="SupportConversation" component={AdminScreens.SupportConversationChaircareMobileScreen} />
      <Stack.Screen name="TicketResolvedSup10482" component={AdminScreens.TicketResolvedSup10482ChaircareMobileScreen} />
      <Stack.Screen name="Disputes" component={AdminScreens.DisputesChaircareSuperAdminScreen} />
      <Stack.Screen name="DisputeDetailsDsp20481" component={AdminScreens.DisputeDetailsDsp20481ChaircareMobileScreen} />
      <Stack.Screen name="DisputeResolution" component={AdminScreens.DisputeResolutionChaircareMobileScreen} />
      <Stack.Screen name="ResolutionConfirmation" component={AdminScreens.ResolutionConfirmationChaircareMobileScreen} />
      <Stack.Screen name="DisputeResolved" component={AdminScreens.DisputeResolvedChaircareMobileScreen} />
      <Stack.Screen name="ReviewsRatings" component={AdminScreens.ReviewsRatingsChaircareMobileScreen} />
      <Stack.Screen name="ReviewDetails" component={AdminScreens.ReviewDetailsChaircareMobileScreen} />
      <Stack.Screen name="ReviewModeration" component={AdminScreens.ReviewModerationChaircareMobileScreen} />
      <Stack.Screen name="HideReviewConfirmation" component={AdminScreens.HideReviewConfirmationChaircareMobileScreen} />
      <Stack.Screen name="ReviewActionCompleted" component={AdminScreens.ReviewActionCompletedChaircareMobileScreen} />
      <Stack.Screen name="Notifications" component={AdminScreens.NotificationsChaircareMobileScreen} />
      <Stack.Screen name="CreateNotification" component={AdminScreens.CreateNotificationChaircareMobileScreen} />
      <Stack.Screen name="NotificationConfirmationSent" component={AdminScreens.NotificationConfirmationSentChaircareMobileScreen} />
      <Stack.Screen name="NotificationDetails" component={AdminScreens.NotificationDetailsChaircareMobileScreen} />
      <Stack.Screen name="NotificationPreferences" component={AdminScreens.NotificationPreferencesChaircareMobileScreen} />
      <Stack.Screen name="PlatformConfiguration" component={AdminScreens.PlatformConfigurationChaircareMobileScreen} />
      <Stack.Screen name="ServicePricingConfiguration" component={AdminScreens.ServicePricingConfigurationChaircareMobileScreen} />
      <Stack.Screen name="TechnicianMatchingSystemConfiguration" component={AdminScreens.TechnicianMatchingSystemConfigurationChaircareMobileScreen} />
      <Stack.Screen name="SecuritySystemPreferences" component={AdminScreens.SecuritySystemPreferencesChaircareMobileScreen} />
      <Stack.Screen name="SecurityActivity" component={AdminScreens.SecurityActivityChaircareMobileScreen} />
      <Stack.Screen name="ActivityLogs" component={AdminScreens.ActivityLogsChaircareMobileScreen} />
      <Stack.Screen name="ActivityDetailsRf39281" component={AdminScreens.ActivityDetailsRf39281ChaircareMobileScreen} />
      <Stack.Screen name="FilterActivity" component={AdminScreens.FilterActivityChaircareMobileScreen} />
      <Stack.Screen name="AuditExport" component={AdminScreens.AuditExportChaircareMobileScreen} />
      <Stack.Screen name="AdminUsers" component={AdminScreens.AdminUsersChaircareMobileScreen} />
      <Stack.Screen name="AddAdmin" component={AdminScreens.AddAdminChaircareMobileScreen} />
      <Stack.Screen name="AdminCreatedSuccessfully" component={AdminScreens.AdminCreatedSuccessfullyChaircareMobileScreen} />
      <Stack.Screen name="EditPermissionsPriyaSharma" component={AdminScreens.EditPermissionsPriyaSharmaChaircareMobileScreen} />
      <Stack.Screen name="AdminProfilePriyaSharma" component={AdminScreens.AdminProfilePriyaSharmaChaircareMobileScreen} />
      <Stack.Screen name="AdminProfileSystemStatus" component={AdminScreens.AdminProfileSystemStatusChaircareMobileScreen} />
      <Stack.Screen name="AdminSettings" component={AdminScreens.AdminSettingsChaircareMobileScreen} />
      <Stack.Screen name="ChatWithTechnician" component={ChatWithTechnicianChaircareMobileScreen} />
      <Stack.Screen name="NoNetworkOffline" component={NoNetworkOfflineScreen} />
    </Stack.Navigator>
  );
};
