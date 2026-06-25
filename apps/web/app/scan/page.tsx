import { requireUser } from "@/lib/auth/requireUser";
import { ScanWorkspace } from "@/components/scan/ScanWorkspace";

export default async function ScanPage() {
  await requireUser("/scan");

  return <ScanWorkspace />;
}
