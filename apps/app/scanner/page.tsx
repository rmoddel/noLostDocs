import { getScanProviderStatus } from "@/lib/scan/providerStatus";
import { ScanWorkspace } from "@/components/scan/ScanWorkspace";

export default function ScannerPage() {
  return <ScanWorkspace mode="public" providerStatus={getScanProviderStatus()} />;
}
