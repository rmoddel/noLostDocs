import { requireUser } from "@/lib/auth/requireUser";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function DashboardPage() {
  await requireUser("/dashboard");

  return <DashboardShell />;
}
