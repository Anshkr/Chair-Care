import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import * as LucideIcons from 'lucide-react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';

export interface AppIconProps {
  name: string;
  size?: number;
  color?: string;
  fill?: string;
  strokeWidth?: number;
  stroke?: string;
  style?: StyleProp<ViewStyle>;
}

  // Custom aliases mapping for icon names across design references
const ICON_ALIASES: Record<string, string> = {
  // Emoji fallbacks
  '↔️': 'MoveHorizontal',
  '🫧': 'Sparkles',
  '↕️': 'ArrowUpDown',

  // Common service / category aliases
  repair: 'Wrench',
  installation: 'Package',
  maintenance: 'Settings',
  wheels: 'Disc',
  wheel: 'Disc',
  hydraulic: 'ArrowUp',
  gaslift: 'ArrowUp',
  armrest: 'Armchair',
  cleaning: 'Sparkles',
  inspection: 'Search',
  home: 'Home',
  workplace: 'Building2',
  office: 'Building2',
  user: 'User',
  usercircle: 'UserCircle',
  requests: 'ClipboardList',
  alerts: 'Bell',
  profile: 'UserCircle',
  services: 'Wrench',
  dashboard: 'LayoutDashboard',
  earnings: 'Wallet',
  queue: 'Zap',

  // Material symbol / snake_case to Lucide mappings
  account_balance: 'Landmark',
  account_balance_wallet: 'Wallet',
  account_circle: 'UserCircle',
  add: 'Plus',
  add_circle: 'PlusCircle',
  admin_panel_settings: 'ShieldCheck',
  alarm: 'Bell',
  alt_route: 'GitBranch',
  architecture: 'SlidersHorizontal',
  arrow_back: 'ArrowLeft',
  arrow_back_ios_new: 'ChevronLeft',
  arrow_downward: 'ArrowDown',
  arrow_forward: 'ArrowRight',
  arrow_outward: 'ArrowUpRight',
  arrow_upward: 'ArrowUp',
  assignment: 'ClipboardList',
  assignment_late: 'ClipboardList',
  assignment_turned_in: 'ClipboardCheck',
  attach_file: 'Paperclip',
  auto_delete: 'Trash2',
  badge: 'Award',
  bolt: 'Zap',
  build: 'Wrench',
  build_circle: 'Wrench',
  calculate: 'Calculator',
  calendar_clock: 'Calendar',
  calendar_month: 'Calendar',
  calendar_today: 'Calendar',
  call: 'Phone',
  campaign: 'Megaphone',
  cancel: 'XCircle',
  category: 'Grid',
  cell_tower: 'Radio',
  chair: 'Armchair',
  chat: 'MessageSquare',
  check: 'Check',
  check_circle: 'CheckCircle2',
  chevron_right: 'ChevronRight',
  cleaning_services: 'Sparkles',
  close: 'X',
  confirmation_number: 'Ticket',
  content_copy: 'Copy',
  contract: 'FileText',
  credit_card_off: 'CreditCard',
  currency_exchange: 'RefreshCw',
  currency_rupee: 'IndianRupee',
  database: 'Database',
  dataset: 'Database',
  date_range: 'Calendar',
  delete: 'Trash2',
  description: 'FileText',
  devices: 'Laptop',
  directions_car: 'Car',
  distance: 'Navigation',
  dns: 'Server',
  domain: 'Building2',
  domain_verification: 'ShieldCheck',
  done: 'Check',
  done_all: 'CheckCheck',
  download: 'Download',
  drag_indicator: 'GripVertical',
  draw: 'PenTool',
  dynamic_feed: 'Layers',
  dynamic_form: 'FileText',
  edit: 'Edit2',
  edit_calendar: 'Calendar',
  encrypted: 'Lock',
  engineering: 'UserCog',
  error: 'AlertCircle',
  error_outline: 'AlertCircle',
  event: 'Calendar',
  event_available: 'CalendarCheck',
  expand_more: 'ChevronDown',
  fact_check: 'ClipboardCheck',
  feed: 'FileText',
  filter_alt: 'Filter',
  fingerprint: 'Fingerprint',
  flag: 'Flag',
  format_quote: 'Quote',
  forum: 'MessagesSquare',
  forward_to_inbox: 'Mail',
  gavel: 'Scale',
  grid_view: 'LayoutGrid',
  group: 'Users',
  group_add: 'UserPlus',
  group_off: 'UserMinus',
  groups: 'Users',
  handyman: 'Wrench',
  hard_drive: 'HardDrive',
  headset_mic: 'Headphones',
  help_outline: 'HelpCircle',
  history: 'History',
  history_edu: 'FileText',
  hourglass_top: 'Hourglass',
  how_to_reg: 'UserCheck',
  hub: 'Radio',
  image: 'Image',
  inbox: 'Inbox',
  info: 'Info',
  inventory_2: 'Package',
  ios_share: 'Share2',
  key: 'Key',
  keyboard_return: 'CornerDownLeft',
  layers: 'Layers',
  lightbulb: 'Lightbulb',
  local_shipping: 'Truck',
  location_on: 'MapPin',
  location_searching: 'Crosshair',
  lock: 'Lock',
  lock_reset: 'Lock',
  mail: 'Mail',
  mark_email_read: 'MailCheck',
  message: 'MessageSquare',
  monitor_heart: 'Activity',
  more_horiz: 'MoreHorizontal',
  more_vert: 'MoreVertical',
  navigation: 'Navigation',
  near_me: 'Navigation',
  notifications: 'Bell',
  notifications_active: 'BellRing',
  open_in_new: 'ExternalLink',
  payments: 'CreditCard',
  pending_actions: 'Clock',
  percent: 'Percent',
  person: 'User',
  person_add: 'UserPlus',
  person_off: 'UserMinus',
  phonelink_lock: 'Smartphone',
  picture_as_pdf: 'FileText',
  pin_drop: 'MapPin',
  power_settings_new: 'Power',
  precision_manufacturing: 'Cpu',
  priority_high: 'AlertTriangle',
  receipt: 'Receipt',
  receipt_long: 'Receipt',
  refresh: 'RefreshCw',
  report_problem: 'AlertTriangle',
  save: 'Save',
  schedule: 'Clock',
  search: 'Search',
  security: 'Shield',
  send: 'Send',
  sensors: 'Radio',
  settings: 'Settings',
  share: 'Share2',
  shield: 'Shield',
  smartphone: 'Smartphone',
  sms: 'MessageSquare',
  speed: 'Gauge',
  star: 'Star',
  star_half: 'StarHalf',
  starhalf: 'StarHalf',
  star_border: 'Star',
  star_outline: 'Star',
  support_agent: 'LifeBuoy',
  sync: 'RefreshCw',
  task_alt: 'CheckCircle2',
  timeline: 'TrendingUp',
  timer: 'Clock',
  timelapse: 'Clock',
  trending_up: 'TrendingUp',
  tune: 'SlidersHorizontal',
  verified: 'CheckCircle2',
  verified_user: 'ShieldCheck',
  visibility: 'Eye',
  visibility_off: 'EyeOff',
  vpn_key: 'Key',
  warning: 'AlertTriangle',
  workspace_premium: 'Award',
  zoom_in: 'ZoomIn',
};

export const AppIcon: React.FC<AppIconProps> = ({
  name,
  size = 22,
  color,
  fill,
  strokeWidth = 1.8,
  stroke,
  style,
  ...rest
}) => {
  if (!name) return null;

  const rawName = String(name).trim();
  const iconColor = color || stroke || Colors.onSurface || '#191C1E';

  // Check aliases
  const aliasLookup = ICON_ALIASES[rawName.toLowerCase()] || ICON_ALIASES[rawName];
  const targetName = aliasLookup || rawName;

  // Normalize to PascalCase
  const pascalName = targetName.charAt(0).toUpperCase() + targetName.slice(1);

  // Lookup in lucide-react-native
  const LucideComponent =
    (LucideIcons as any)[pascalName] ||
    (LucideIcons as any)[targetName] ||
    (LucideIcons as any)[rawName];

  if (LucideComponent) {
    return (
      <LucideComponent
        size={size}
        color={iconColor}
        fill={fill || 'none'}
        strokeWidth={strokeWidth}
        style={style}
        {...rest}
      />
    );
  }

  // Fallback to MaterialIcons if not found in Lucide
  const sanitizedMatName = rawName.toLowerCase().replace(/_/g, '-').replace(/[^a-z0-9-]/g, '');
  const matName = (sanitizedMatName || 'help-outline') as any;
  return (
    <MaterialIcons
      name={matName}
      size={size}
      color={iconColor}
      style={style as any}
    />
  );
};

export default AppIcon;
