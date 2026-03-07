import { View } from '../types';

export type SidebarGroupId =
  | 'overview'
  | 'clinical'
  | 'appointments'
  | 'operations'
  | 'finance'
  | 'administration';

type SidebarGroupDefinition = {
  id: SidebarGroupId;
  labelKey: string;
  itemIds: View[];
};

export interface SidebarGroup<T> extends SidebarGroupDefinition {
  label: string;
  items: T[];
}

const SIDEBAR_GROUP_DEFINITIONS: ReadonlyArray<SidebarGroupDefinition> = [
  {
    id: 'overview',
    labelKey: 'sidebar.group.overview',
    itemIds: ['dashboard'],
  },
  {
    id: 'clinical',
    labelKey: 'sidebar.group.clinical',
    itemIds: ['patients', 'doctors', 'treatmentDefinitions'],
  },
  {
    id: 'appointments',
    labelKey: 'sidebar.group.appointments',
    itemIds: ['scheduler', 'pendingReservations'],
  },
  {
    id: 'operations',
    labelKey: 'sidebar.group.operations',
    itemIds: ['employees', 'suppliers', 'inventory', 'labCases'],
  },
  {
    id: 'finance',
    labelKey: 'sidebar.group.finance',
    itemIds: ['expenses', 'insuranceUnified', 'reports'],
  },
  {
    id: 'administration',
    labelKey: 'sidebar.group.administration',
    itemIds: ['clinicManagement', 'userManagement', 'settings', 'subscriptionOverview', 'about'],
  },
] as const;

export const SIDEBAR_DEFAULT_COLLAPSED_GROUPS = SIDEBAR_GROUP_DEFINITIONS.map(
  (group) => group.id,
) as SidebarGroupId[];

export const SIDEBAR_RECENT_LIMIT = 4;

export const SIDEBAR_STORAGE_KEYS = {
  pinned: 'sidebar-pinned-items',
  recent: 'sidebar-recent-items',
  collapsedGroups: 'sidebar-collapsed-groups-v3',
} as const;

export function buildSidebarGroups<T extends { id: string }>(
  navItems: T[],
  t: (key: string) => string,
): SidebarGroup<T>[] {
  const navItemsById = new Map(navItems.map((item) => [item.id, item]));

  return SIDEBAR_GROUP_DEFINITIONS.map((group) => ({
    ...group,
    label: t(group.labelKey),
    items: group.itemIds
      .map((itemId) => navItemsById.get(itemId))
      .filter((item): item is T => Boolean(item)),
  })).filter((group) => group.items.length > 0);
}
