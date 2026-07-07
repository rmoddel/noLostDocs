import { requireUser } from "@/lib/auth/requireUser";
import { ScanWorkspace } from "@/components/scan/ScanWorkspace";
import { getScanProviderStatus } from "@/lib/scan/providerStatus";

export default async function ScanPage() {
  await requireUser("/scan");
  return <ScanWorkspace providerStatus={getScanProviderStatus()} />;
}
