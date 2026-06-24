import { AuthGate } from "@/components/auth/AuthGate";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function DashboardPage() {
  return (
    <AuthGate redirectTo="/dashboard">
      <DashboardShell />
    </AuthGate>
  );
}
