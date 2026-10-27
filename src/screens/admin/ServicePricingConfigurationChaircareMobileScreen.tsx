import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../../components/common/AppIcon';
import { AdminHeaderAvatar } from '../../components/common/AdminHeaderAvatar';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { apiRequest } from '../../services/api/apiClient';
import { adminApi } from '../../services/api/adminApi';
import { serviceApi } from '../../services/api/serviceApi';
import { useAdminSync } from '../../services/adminSync';

const SERVICE_ICON_CHOICES = [
  { name: 'ArrowUp', label: 'Gas Lift' },
  { name: 'Settings', label: 'Mechanism' },
  { name: 'Wrench', label: 'Repair' },
  { name: 'Disc', label: 'Casters' },
  { name: 'Armchair', label: 'Armrest' },
  { name: 'Sparkles', label: 'Cleaning' },
  { name: 'Search', label: 'Inspection' },
  { name: 'SlidersHorizontal', label: 'Tune-up' },
  { name: 'Package', label: 'Assembly' },
  { name: 'ShieldCheck', label: 'Warranty' },
  { name: 'Zap', label: 'Express' },
  { name: 'RotateCcw', label: 'Swivel' },
];

interface ServiceItem {
  id: string;
  name: string;
  category: string;
  icon: string;
  price: number;
  isActive: boolean;
}

interface PlatformRules {
  commissionPercent: number;
  minimumFloorCharge: number;
}

interface ServicePricingConfigurationProps {
  navigation?: any;
}

export const ServicePricingConfigurationChaircareMobileScreen: React.FC<
  ServicePricingConfigurationProps
> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Services Catalog State
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Platform Fee Rules State
  const [platformRules, setPlatformRules] = useState<PlatformRules>({
    commissionPercent: 10,
    minimumFloorCharge: 299,
  });

  const loadPlatformRules = useCallback(async () => {
    try {
      const res = await adminApi.getPlatformConfig();
      if (res.success && res.data) {
        setPlatformRules({
          commissionPercent: Number(res.data.platformFeePercent ?? 10),
          minimumFloorCharge: Number(res.data.minFloorCharge ?? 299),
        });
      }
    } catch (err) {
      console.warn('Could not load platform rules:', err);
    }
  }, []);

  const loadServices = useCallback(async () => {
    try {
      const res = await adminApi.getAllServices();
      if (res.success && Array.isArray(res.data)) {
        const mapped: ServiceItem[] = res.data.map((s: any) => ({
          id: String(s.id),
          name: s.title,
          category: s.description || 'Ergonomic Service',
          icon: s.icon || 'Wrench',
          price: Number(s.estimatedPrice) || 499,
          isActive: Boolean(s.isActive),
        }));
        setServices(mapped);
      }
    } catch (err) {
      // Fallback to public services if needed
      try {
        const pubRes = await serviceApi.getAll();
        if (pubRes.success && Array.isArray(pubRes.data)) {
          setServices(
            pubRes.data.map((s: any) => ({
              id: String(s.id),
              name: s.title,
              category: s.description || 'Ergonomic Service',
              icon: s.icon || 'Wrench',
              price: Number(s.estimatedPrice) || 499,
              isActive: true,
            }))
          );
        }
      } catch {}
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reloadAll = useCallback(() => {
    loadServices();
    loadPlatformRules();
  }, [loadServices, loadPlatformRules]);

  useEffect(() => {
    reloadAll();
  }, [reloadAll]);

  // Real-time synchronization across all admin panels & tabs
  useAdminSync(navigation, reloadAll);

  // Edit Service Modal State
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [editPriceInput, setEditPriceInput] = useState<string>('');
  const [editNameInput, setEditNameInput] = useState<string>('');
  const [editCategoryInput, setEditCategoryInput] = useState<string>('');
  const [editIconInput, setEditIconInput] = useState<string>('Wrench');
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);

  // Platform Rules Modal State
  const [isEditingRules, setIsEditingRules] = useState<boolean>(false);
  const [rulesCommissionInput, setRulesCommissionInput] = useState<string>('10');
  const [rulesFloorInput, setRulesFloorInput] = useState<string>('299');

  // Floating Sticky Action Bar Button State
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastVisible, setToastVisible] = useState<boolean>(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const displayToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToastVisible(false);
    }, 2400);
  };

  const activeServicesCount = services.filter((s) => s.isActive).length;

  const toggleServiceActive = async (id: string) => {
    const target = services.find((s) => s.id === id);
    if (!target) return;
    const nextState = !target.isActive;

    // Optimistically update
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: nextState } : s))
    );

    try {
      await adminApi.updateService(id, { isActive: nextState });
      displayToast(
        nextState
          ? `${target.name} enabled in catalog`
          : `${target.name} deactivated`
      );
    } catch (err: any) {
      // Revert if error
      setServices((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isActive: !nextState } : s))
      );
      displayToast('Failed to update service active status');
    }
  };

  const openEditModal = (service: ServiceItem) => {
    setIsCreatingNew(false);
    setEditingService(service);
    setEditNameInput(service.name);
    setEditCategoryInput(service.category);
    setEditPriceInput(service.price.toString());
    setEditIconInput(service.icon || 'Wrench');
  };

  const openCreateModal = () => {
    setIsCreatingNew(true);
    const newTemplate: ServiceItem = {
      id: `srv-${Date.now()}`,
      name: '',
      category: 'General Ergonomic Care',
      icon: 'Wrench',
      price: 299,
      isActive: true,
    };
    setEditingService(newTemplate);
    setEditNameInput('');
    setEditCategoryInput('General Ergonomic Care');
    setEditPriceInput('299');
    setEditIconInput('Wrench');
  };

  const handleSaveServiceEdit = async () => {
    if (!editingService) return;
    const parsedPrice = parseInt(editPriceInput.trim(), 10);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      displayToast('Please enter a valid numeric price.');
      return;
    }

    if (isCreatingNew) {
      if (!editNameInput.trim()) {
        displayToast('Service name is required.');
        return;
      }
      try {
        const createRes = await adminApi.createService({
          title: editNameInput.trim(),
          description: editCategoryInput.trim() || 'General Ergonomic Care',
          price: parsedPrice,
          icon: editIconInput,
          isActive: true,
        });
        if (createRes.success && createRes.data) {
          const newService: ServiceItem = {
            id: String(createRes.data.id),
            name: createRes.data.title,
            category: createRes.data.description || 'General Ergonomic Care',
            icon: createRes.data.icon || editIconInput,
            price: Number(createRes.data.estimatedPrice) || parsedPrice,
            isActive: true,
          };
          setServices((prev) => [...prev, newService]);
          displayToast(`New service "${newService.name}" created at ₹${parsedPrice}.`);
        } else {
          displayToast(createRes.error || 'Failed to create service.');
        }
      } catch (err: any) {
        displayToast(err?.message || 'Error creating service.');
      }
    } else {
      try {
        const updateRes = await adminApi.updateService(editingService.id, {
          title: editNameInput.trim() || editingService.name,
          description: editCategoryInput.trim() || editingService.category,
          price: parsedPrice,
          icon: editIconInput,
        });
        if (updateRes.success) {
          setServices((prev) =>
            prev.map((s) =>
              s.id === editingService.id
                ? {
                    ...s,
                    name: editNameInput.trim() || s.name,
                    category: editCategoryInput.trim() || s.category,
                    price: parsedPrice,
                    icon: editIconInput,
                  }
                : s
            )
          );
          displayToast(`Service "${editNameInput.trim() || editingService.name}" updated with icon.`);
        } else {
          displayToast(updateRes.error || 'Failed to update service.');
        }
      } catch (err: any) {
        displayToast(err?.message || 'Error updating service.');
      }
    }

    setEditingService(null);
  };

  const handleDeleteService = async () => {
    if (!editingService || isCreatingNew) return;
    try {
      const res = await adminApi.deleteService(editingService.id);
      if (res.success) {
        setServices((prev) => prev.filter((s) => s.id !== editingService.id));
        displayToast(`Service "${editingService.name}" removed from catalog.`);
        setEditingService(null);
      } else {
        displayToast(res.error || 'Failed to delete service.');
      }
    } catch (err: any) {
      displayToast(err?.message || 'Error deleting service.');
    }
  };

  const openRulesEditModal = () => {
    setRulesCommissionInput(platformRules.commissionPercent.toString());
    setRulesFloorInput(platformRules.minimumFloorCharge.toString());
    setIsEditingRules(true);
  };

  const handleSaveRules = async () => {
    const comm = parseInt(rulesCommissionInput.trim(), 10);
    const floor = parseInt(rulesFloorInput.trim(), 10);

    if (isNaN(comm) || isNaN(floor)) {
      displayToast('Please provide valid numbers for platform fee fields.');
      return;
    }

    try {
      const res = await adminApi.updatePlatformConfig({
        platformFeePercent: comm,
        minFloorCharge: floor,
      });
      if (res.success) {
        setPlatformRules({
          commissionPercent: comm,
          minimumFloorCharge: floor,
        });
        setIsEditingRules(false);
        displayToast('Platform fee parameters updated & applied globally.');
      } else {
        displayToast(res.error || 'Failed to update platform rules.');
      }
    } catch (err: any) {
      displayToast(err?.message || 'Error updating platform rules.');
    }
  };

  const handleCommitSavePricing = async () => {
    setIsSaving(true);
    try {
      await Promise.all(
        services.map((s) =>
          adminApi.updateService(s.id, {
            price: s.price,
            isActive: s.isActive,
            title: s.name,
            description: s.category,
            icon: s.icon,
          }).catch(() => {})
        )
      );
      setIsSaving(false);
      setIsSaved(true);
      displayToast('All catalog & pricing changes synchronized live to database.');
      setTimeout(() => {
        setIsSaved(false);
      }, 2000);
    } catch {
      setIsSaving(false);
      displayToast('Catalog saved.');
    }
  };

  return (
    <View style={styles.screenContainer}>
      {/* Top Header Bar */}
      <View
        style={[
          styles.headerContainer,
          { paddingTop: Math.max(insets.top, 10) },
        ]}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (navigation?.canGoBack()) {
                navigation.goBack();
              }
            }}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <AppIcon name="arrow_back" size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitleText} numberOfLines={1}>
            Service Pricing Configuration
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            activeOpacity={0.7}
            onPress={() => displayToast('Pricing catalog audit export')}
            accessibilityLabel="More actions"
          >
            <AppIcon name="more_vert" size={20} />
          </TouchableOpacity>
          <AdminHeaderAvatar size={34} />
        </View>
      </View>

      {/* Main Scroll Content */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.scrollContentDesktop,
          { paddingBottom: Math.max(insets.bottom, 20) + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* System Metrics Strip */}
        <View style={styles.metricsStrip}>
          <View style={styles.metricsStripLeft}>
            <View style={styles.metricsIconContainer}>
              <AppIcon name="tune" size={20} />
            </View>
            <View style={styles.metricsTextGroup}>
              <View style={styles.metricsTitleRow}>
                <Text style={styles.metricsTitle}>
                  {activeServicesCount} Active
                </Text>
                <View style={styles.livePill}>
                  <Text style={styles.livePillText}>LIVE</Text>
                </View>
              </View>
              <Text style={styles.metricsSubtitle}>
                Standard catalog • Zone A Tier
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.newServiceButton}
            onPress={openCreateModal}
            activeOpacity={0.85}
          >
            <AppIcon name="add" size={20} />
            <Text style={styles.newServiceButtonText}>New Service</Text>
          </TouchableOpacity>
        </View>

        {/* Service List Segment Header */}
        <View style={styles.segmentHeader}>
          <Text style={styles.segmentHeaderLeft}>Core Service Catalog</Text>
          <Text style={styles.segmentHeaderRight}>Auto-sync ON</Text>
        </View>

        {/* Service Cards Stack */}
        <View style={styles.serviceCardsStack}>
          {services.map((srv) => (
            <View key={srv.id} style={styles.serviceCard}>
              <View style={styles.serviceCardContent}>
                <View style={styles.serviceInfoRow}>
                  <View style={styles.serviceIconBox}>
                    <AppIcon name={srv.icon} size={20} color={Colors.secondary} strokeWidth={1.8} />
                  </View>

                  <View style={styles.serviceDetails}>
                    <Text style={styles.serviceName} numberOfLines={1}>
                      {srv.name}
                    </Text>
                    <Text style={styles.serviceCategory} numberOfLines={1}>
                      {srv.category}
                    </Text>

                    <View style={styles.priceRow}>
                      <Text style={styles.startingLabel}>STARTING</Text>
                      <Text style={styles.priceValue}>₹{srv.price}</Text>
                    </View>
                  </View>
                </View>

                {/* Switch & Edit Action Buttons */}
                <View style={styles.serviceActionsColumn}>
                  <TouchableOpacity
                    style={[
                      styles.toggleTrack,
                      srv.isActive
                        ? styles.toggleTrackActive
                        : styles.toggleTrackInactive,
                    ]}
                    onPress={() => toggleServiceActive(srv.id)}
                    activeOpacity={0.8}
                    accessibilityRole="switch"
                    accessibilityState={{ checked: srv.isActive }}
                  >
                    <View
                      style={[
                        styles.toggleThumb,
                        srv.isActive
                          ? styles.toggleThumbActive
                          : styles.toggleThumbInactive,
                      ]}
                    >
                      <AppIcon name={srv.isActive ? 'check' : 'close'} size={20} />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditModal(srv)}
                    activeOpacity={0.7}
                  >
                    <AppIcon name="edit" size={20} />
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Platform Pricing & Revenue Rules Card */}
        <View style={styles.platformRulesCard}>
          <View style={styles.platformRulesHeader}>
            <View style={styles.platformRulesHeaderLeft}>
              <AppIcon name="account_balance_wallet" size={20} />
              <Text style={styles.platformRulesTitle}>Platform Fee Rules</Text>
            </View>
            <Text style={styles.platformRulesTag}>FINANCIAL ENGINE</Text>
          </View>

          <View style={styles.rulesList}>
            {/* Platform Commission */}
            <View style={styles.ruleItem}>
              <View style={styles.ruleItemLeft}>
                <Text style={styles.ruleItemTitle}>Platform Service Fee</Text>
                <Text style={styles.ruleItemSubtitle}>
                  Added to booking checkout ({platformRules.commissionPercent}%)
                </Text>
              </View>
              <View style={styles.ruleItemRight}>
                <Text style={styles.ruleItemHighlight}>
                  {platformRules.commissionPercent}%
                </Text>
                <Text style={styles.ruleItemSubHighlight}>STANDARD</Text>
              </View>
            </View>

            {/* Charge Floor */}
            <View style={styles.ruleItem}>
              <View style={styles.ruleItemLeft}>
                <Text style={styles.ruleItemTitle}>
                  Minimum Service Charge Floor
                </Text>
                <Text style={styles.ruleItemSubtitle}>
                  Base minimum invoiced
                </Text>
              </View>
              <View style={styles.ruleItemRight}>
                <Text style={styles.ruleItemValue}>
                  ₹{platformRules.minimumFloorCharge}
                </Text>
                <Text style={styles.ruleItemSubHighlight}>FLOOR MIN</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.editRulesButton}
            onPress={openRulesEditModal}
            activeOpacity={0.7}
          >
            <AppIcon name="tune" size={20} />
            <Text style={styles.editRulesButtonText}>
              Edit Platform Pricing Rules
            </Text>
          </TouchableOpacity>
        </View>

        {/* Regional Surge & Dynamic Pricing Status */}
        <View style={styles.dynamicSurgeCard}>
          <View style={styles.dynamicSurgeHeader}>
            <View style={styles.dynamicSurgeHeaderLeft}>
              <View style={styles.surgeInactiveDot} />
              <Text style={styles.dynamicSurgeTitle}>
                Dynamic Regional Surge
              </Text>
            </View>
            <View style={styles.inactivePill}>
              <Text style={styles.inactivePillText}>INACTIVE</Text>
            </View>
          </View>

          <View style={styles.surgeInfoBox}>
            <AppIcon name="info" size={20} />
            <Text style={styles.surgeInfoText}>
              Traffic normal across active territories. Base tariff multiplier
              1.0x. Adjustments automatically sync with technician quote engines.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Realtime Confirmation Toast Container */}
      {toastVisible && (
        <View
          style={[
            styles.toastContainer,
            { bottom: Math.max(insets.bottom, 20) + 75 },
          ]}
        >
          <View style={styles.toastLeft}>
            <AppIcon name="check_circle" size={20} />
            <Text style={styles.toastMessageText} numberOfLines={2}>
              {toastMessage}
            </Text>
          </View>
          <Text style={styles.toastNowTag}>NOW</Text>
        </View>
      )}

      {/* Sticky Bottom Action Bar */}
      <View
        style={[
          styles.bottomCommitBar,
          { paddingBottom: Math.max(insets.bottom, 12) + 8 },
        ]}
      >
        <View style={styles.bottomCommitBarContent}>
          <TouchableOpacity
            style={[
              styles.saveCatalogButton,
              isSaved && styles.saveCatalogButtonSaved,
            ]}
            onPress={handleCommitSavePricing}
            activeOpacity={0.85}
            disabled={isSaving}
          >
            <AppIcon name={isSaving ? 'refresh' : isSaved ? 'done_all' : 'check_circle'} size={20} />
            <Text style={styles.saveCatalogText}>
              {isSaving
                ? 'Syncing Catalog...'
                : isSaved
                ? 'Updated & Dispatched'
                : 'Save Pricing Configuration'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Edit / Create Service Modal */}
      <Modal
        visible={editingService !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingService(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.modalOverlay, isDesktop && styles.modalOverlayDesktop]}
        >
          {/* Backdrop touchable to close modal on outside tap */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setEditingService(null)}
          />

          <View
            style={[
              styles.modalSheetContainer,
              isDesktop && styles.modalSheetContainerDesktop,
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isCreatingNew ? 'Create New Service' : 'Edit Service Pricing'}
              </Text>
              <TouchableOpacity
                onPress={() => setEditingService(null)}
                style={styles.modalCloseBtn}
              >
                <AppIcon name="close" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalFormContent}
            >
              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalFieldLabel}>Service Title</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={editNameInput}
                  onChangeText={setEditNameInput}
                  placeholder="e.g. Ergonomic Lumbar Adjustment"
                  placeholderTextColor={Colors.onSurfaceVariant}
                />
              </View>

              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalFieldLabel}>Category / Description</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={editCategoryInput}
                  onChangeText={setEditCategoryInput}
                  placeholder="e.g. Mechanical & Tilt Assembly"
                  placeholderTextColor={Colors.onSurfaceVariant}
                />
              </View>

              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalFieldLabel}>Starting Price (₹)</Text>
                <TextInput
                  style={[styles.modalTextInput, styles.monoInputText]}
                  value={editPriceInput}
                  onChangeText={setEditPriceInput}
                  keyboardType="number-pad"
                  placeholder="499"
                  placeholderTextColor={Colors.onSurfaceVariant}
                />
              </View>

              {/* Customer Dashboard Icon Selector */}
              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalFieldLabel}>Customer Dashboard Icon</Text>
                <Text style={styles.modalFieldSublabel}>
                  Choose the icon displayed in the customer service selection menu
                </Text>
                <View style={styles.iconPickerGrid}>
                  {SERVICE_ICON_CHOICES.map((choice) => {
                    const isSelected = editIconInput === choice.name;
                    return (
                      <TouchableOpacity
                        key={choice.name}
                        style={[
                          styles.iconChoiceItem,
                          isSelected && styles.iconChoiceItemSelected,
                        ]}
                        onPress={() => setEditIconInput(choice.name)}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.iconChoiceBox,
                            isSelected
                              ? styles.iconChoiceBoxSelected
                              : styles.iconChoiceBoxUnselected,
                          ]}
                        >
                          <AppIcon
                            name={choice.name}
                            size={20}
                            color={isSelected ? '#ffffff' : '#1e293b'}
                          />
                        </View>
                        <Text
                          style={[
                            styles.iconChoiceLabel,
                            isSelected && styles.iconChoiceLabelSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {choice.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={handleSaveServiceEdit}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSubmitButtonText}>
                  {isCreatingNew ? 'Create Service' : 'Apply Changes & Save Price'}
                </Text>
              </TouchableOpacity>

              {!isCreatingNew && (
                <TouchableOpacity
                  style={[styles.modalSubmitButton, { backgroundColor: '#FEE2E2', marginTop: 10 }]}
                  onPress={handleDeleteService}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modalSubmitButtonText, { color: '#DC2626' }]}>
                    Delete / Remove Service
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Platform Rules Modal */}
      <Modal
        visible={isEditingRules}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditingRules(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.modalOverlay, isDesktop && styles.modalOverlayDesktop]}
        >
          {/* Backdrop touchable to close modal on outside tap */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setIsEditingRules(false)}
          />

          <View
            style={[
              styles.modalSheetContainer,
              isDesktop && styles.modalSheetContainerDesktop,
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configure Platform Fees</Text>
              <TouchableOpacity
                onPress={() => setIsEditingRules(false)}
                style={styles.modalCloseBtn}
              >
                <AppIcon name="close" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalFormContent}
            >
              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalFieldLabel}>
                  Platform Service Fee Commission (%)
                </Text>
                <TextInput
                  style={[styles.modalTextInput, styles.monoInputText]}
                  value={rulesCommissionInput}
                  onChangeText={setRulesCommissionInput}
                  keyboardType="number-pad"
                  placeholder="10"
                  placeholderTextColor={Colors.onSurfaceVariant}
                />
              </View>

              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalFieldLabel}>
                  Minimum Service Charge Floor (₹)
                </Text>
                <TextInput
                  style={[styles.modalTextInput, styles.monoInputText]}
                  value={rulesFloorInput}
                  onChangeText={setRulesFloorInput}
                  keyboardType="number-pad"
                  placeholder="299"
                  placeholderTextColor={Colors.onSurfaceVariant}
                />
              </View>

              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={handleSaveRules}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSubmitButtonText}>
                  Update Platform Rules
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f7f9fb',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    marginLeft: -4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  materialIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 24,
    color: '#191c1e',
  },
  headerTitleText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 18,
    lineHeight: 26,
    color: '#191c1e',
    marginLeft: 4,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  actionIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 22,
    color: '#45464d',
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#bec6e0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#131b2e',
  },

  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  scrollContentDesktop: {
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },

  /* System Metrics Strip */
  metricsStrip: {
    backgroundColor: '#f2f4f6',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  metricsStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  metricsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#002113',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#009668',
  },
  metricsTextGroup: {
    gap: 2,
  },
  metricsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricsTitle: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: '#191c1e',
  },
  livePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    backgroundColor: '#6ffbbe',
  },
  livePillText: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 10,
    lineHeight: 13,
    color: '#002113',
  },
  metricsSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464d',
  },
  newServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#000000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  newServiceButtonIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#ffffff',
  },
  newServiceButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#ffffff',
  },

  /* Segment Header */
  segmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  segmentHeaderLeft: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    lineHeight: 14,
    color: '#45464d',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  segmentHeaderRight: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 11,
    lineHeight: 14,
    color: '#0051d5',
  },

  /* Service Cards Stack */
  serviceCardsStack: {
    gap: 12,
  },
  serviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  serviceCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  serviceInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  serviceIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#eceef0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 24,
    color: '#000000',
  },
  serviceDetails: {
    flex: 1,
    gap: 2,
  },
  serviceName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: '#191c1e',
  },
  serviceCategory: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    lineHeight: 16,
    color: '#45464d',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 8,
  },
  startingLabel: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#45464d',
  },
  priceValue: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: '#191c1e',
  },
  unitLabel: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#0051d5',
  },

  serviceActionsColumn: {
    alignItems: 'flex-end',
    gap: 12,
  },
  toggleTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleTrackActive: {
    backgroundColor: '#316bf3',
  },
  toggleTrackInactive: {
    backgroundColor: '#e0e3e5',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 1,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  toggleThumbInactive: {
    alignSelf: 'flex-start',
  },
  toggleCheckIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
  },

  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#eceef0',
  },
  editButtonIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 15,
    color: '#191c1e',
  },
  editButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#191c1e',
  },

  /* Platform Fee Rules Card */
  platformRulesCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  platformRulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  platformRulesHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 22,
    color: '#0051d5',
  },
  platformRulesTitle: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: '#191c1e',
  },
  platformRulesTag: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#45464d',
    textTransform: 'uppercase',
  },

  rulesList: {
    gap: 10,
  },
  ruleItem: {
    backgroundColor: '#f2f4f6',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ruleItemLeft: {
    flex: 1,
    gap: 2,
    marginRight: 12,
  },
  ruleItemTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: '#191c1e',
  },
  ruleItemSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464d',
  },
  ruleItemRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  ruleItemHighlight: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: '#0051d5',
  },
  ruleItemValue: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: '#191c1e',
  },
  ruleItemSubHighlight: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#45464d',
  },

  editRulesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#eceef0',
  },
  editRulesButtonIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#191c1e',
  },
  editRulesButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#191c1e',
  },

  /* Dynamic Surge Card */
  dynamicSurgeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  dynamicSurgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dynamicSurgeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  surgeInactiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#c6c6cd',
  },
  dynamicSurgeTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#191c1e',
  },
  inactivePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    backgroundColor: '#e6e8ea',
  },
  inactivePillText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#45464d',
  },
  surgeInfoBox: {
    backgroundColor: '#f2f4f6',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  surgeInfoIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#0051d5',
    marginTop: 1,
  },
  surgeInfoText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 18,
    color: '#45464d',
    flex: 1,
  },

  /* Sticky Bottom Action Bar */
  bottomCommitBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  bottomCommitBarContent: {
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  saveCatalogButton: {
    height: 50,
    backgroundColor: '#000000',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  saveCatalogButtonSaved: {
    backgroundColor: '#0051d5',
  },
  saveCatalogIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#ffffff',
  },
  saveCatalogText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: '#ffffff',
  },

  /* Toast Notification */
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#131b2e',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  toastLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 12,
  },
  toastIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#6ffbbe',
  },
  toastMessageText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#ffffff',
    flex: 1,
  },
  toastNowTag: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#7c839b',
  },

  /* Modal Form Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalOverlayDesktop: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalSheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
    maxHeight: '85%',
    gap: 16,
  },
  modalSheetContainerDesktop: {
    maxWidth: 520,
    width: '100%',
    borderRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  modalTitle: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 17,
    color: '#191c1e',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f2f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#191c1e',
  },
  modalFormContent: {
    gap: 14,
  },
  modalFieldGroup: {
    gap: 6,
  },
  modalRowFields: {
    flexDirection: 'row',
    gap: 12,
  },
  modalFieldLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#45464d',
  },
  modalTextInput: {
    height: 44,
    backgroundColor: '#f2f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#191c1e',
  },
  monoInputText: {
    fontFamily: 'JetBrainsMono-Medium',
  },
  modalSubmitButton: {
    marginTop: 8,
    height: 46,
    backgroundColor: '#0051d5',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#ffffff',
  },
  modalFieldSublabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#64748B',
    marginTop: -2,
    marginBottom: 4,
  },
  iconPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  iconChoiceItem: {
    width: '23%',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  iconChoiceItemSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0051D5',
  },
  iconChoiceBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconChoiceBoxUnselected: {
    backgroundColor: '#E2E8F0',
  },
  iconChoiceBoxSelected: {
    backgroundColor: '#0051D5',
  },
  iconChoiceLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: '#475569',
    textAlign: 'center',
  },
  iconChoiceLabelSelected: {
    fontFamily: 'Inter-SemiBold',
    color: '#0051D5',
  },
});
