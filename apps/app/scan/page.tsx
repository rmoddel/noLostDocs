import { requireUser } from "@/lib/auth/requireUser";
import { getScanProviderStatus } from "@/lib/scan/providerStatus";
import { ScanWorkspace } from "@/components/scan/ScanWorkspace";

export default async function ScanPage() {
  await requireUser("/scan");

  return <ScanWorkspace providerStatus={getScanProviderStatus()} />;
}
