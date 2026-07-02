export function isLocalDashboardPreviewEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_LOCAL_DASHBOARD_PREVIEW !== "false";
}
