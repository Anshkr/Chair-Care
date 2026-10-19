import { AppIcon } from '../common/AppIcon';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useNetwork } from '../../context/NetworkContext';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { UserRole } from '../../types/models';

import { resetIntroSeen } from '../../utils/introStorage';

export interface DevRoleSwitcherProps {
  onReplayIntro?: () => void;
}

/**
 * Developer-only floating role switcher.
 * Only rendered in development mode (`__DEV__`).
 */
export const DevRoleSwitcher: React.FC<DevRoleSwitcherProps> = ({ onReplayIntro }) => {
  if (!__DEV__) {
    return null;
  }

  const { role, setRole, currentUser, isAuthenticated } = useAuth();
  const { isSimulatedOffline, toggleSimulatedOffline } = useNetwork();
  const [collapsed, setCollapsed] = useState(true);

  const roles: { key: UserRole; label: string; icon: string }[] = [
    { key: 'customer', label: 'Customer', icon: 'User' },
    { key: 'technician', label: 'Technician', icon: 'Wrench' },
    { key: 'admin', label: 'Admin', icon: 'ShieldCheck' },
  ];

  if (collapsed) {
    return (
      <View style={styles.fabRowContainer} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.collapsedFab}
          onPress={() => setCollapsed(false)}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <AppIcon name="Wrench" size={14} color="#FFFFFF" />
            <Text style={styles.fabText}>{role.toUpperCase()}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.expandedPanel}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>PORTAL SWITCHER</Text>
          <Text style={styles.sessionSubtitle}>
            Session: {isAuthenticated && currentUser ? `${currentUser.name} (${currentUser.role})` : 'Guest / Logged Out'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setCollapsed(true)}>
          <AppIcon name="X" size={18} />
        </TouchableOpacity>
      </View>
      <View style={styles.buttonRow}>
        {roles.map((r: any) => {
          const isActive = role === r.key;
          return (
            <TouchableOpacity
              key={r.key}
              onPress={() => {
                setRole(r.key);
                setCollapsed(true);
              }}
              style={[styles.roleBtn, isActive && styles.activeRoleBtn]}
            >
              <AppIcon
                name={r.icon}
                size={18}
                color={isActive ? '#FFFFFF' : Colors.onSurface}
                strokeWidth={1.8}
              />
              <Text style={[styles.roleLabel, isActive && styles.activeRoleLabel]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[
          styles.networkToggleRow,
          isSimulatedOffline && styles.networkToggleRowOffline,
        ]}
        onPress={() => {
          toggleSimulatedOffline();
          setCollapsed(true);
        }}
        activeOpacity={0.75}
      >
        <AppIcon
          name={isSimulatedOffline ? 'WifiOff' : 'Wifi'}
          size={14}
          color={isSimulatedOffline ? '#ba1a1a' : '#009668'}
        />
        <Text
          style={[
            styles.networkToggleText,
            isSimulatedOffline && styles.networkToggleTextOffline,
          ]}
        >
          {isSimulatedOffline ? 'Simulating Offline (Tap to connect)' : 'Online (Tap to simulate offline)'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.introToggleRow}
        onPress={() => {
          resetIntroSeen();
          if (onReplayIntro) onReplayIntro();
          setCollapsed(true);
        }}
        activeOpacity={0.75}
      >
        <AppIcon name="Compass" size={14} color={Colors.secondaryCobalt} />
        <Text style={styles.introToggleText}>Replay Intro Walkthrough</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  fabRowContainer: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 9999,
  },
  themeMiniFab: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level2,
  },
  collapsedFab: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Shadows.level2,
  },
  fabText: {
    ...Typography.labelMono,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  expandedPanel: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level3,
    zIndex: 9999,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    ...Typography.labelMono,
    color: Colors.outline,
    fontWeight: '700',
  },
  sessionSubtitle: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  closeBtn: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.onSurfaceVariant,
    padding: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  activeRoleBtn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roleIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  roleLabel: {
    ...Typography.labelMd,
    color: Colors.onSurface,
  },
  activeRoleLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  networkToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  networkToggleRowOffline: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  networkToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#166534',
  },
  networkToggleTextOffline: {
    color: '#991b1b',
  },
  introToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  introToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.secondaryCobalt,
  },
});
