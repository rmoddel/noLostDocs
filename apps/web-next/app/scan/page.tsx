import { AuthGate } from "@/components/auth/AuthGate";
import { ScanWorkspace } from "@/components/scan/ScanWorkspace";

export default function ScanPage() {
  return (
    <AuthGate redirectTo="/scan">
      <ScanWorkspace />
    </AuthGate>
  );
}
