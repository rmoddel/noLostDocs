import { dashboardGroups, type DashboardGroupId } from "@/constants/launcherGroups";

const DASHBOARD_PREFS_STORAGE_KEY = "nolostdocs.dashboard.hidden-groups";

function isDashboardGroupId(value: string): value is DashboardGroupId {
  return dashboardGroups.some((group) => group.id === value);
}

export function readStoredHiddenGroups() {
  if (typeof window === "undefined") {
    return [] as DashboardGroupId[];
  }

  const raw = window.localStorage.getItem(DASHBOARD_PREFS_STORAGE_KEY);
  if (!raw) {
    return [] as DashboardGroupId[];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is DashboardGroupId => typeof value === "string" && isDashboardGroupId(value))
      : [];
  } catch {
    return [] as DashboardGroupId[];
  }
}

export function writeStoredHiddenGroups(hiddenGroupIds: DashboardGroupId[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(DASHBOARD_PREFS_STORAGE_KEY, JSON.stringify(hiddenGroupIds));
}

export function getPreferencePayload(hiddenGroupIds: DashboardGroupId[], userId: string) {
  return dashboardGroups.map((group, index) => ({
    user_id: userId,
    category_key: group.id,
    is_visible: !hiddenGroupIds.includes(group.id),
    sort_order: index
  }));
}
