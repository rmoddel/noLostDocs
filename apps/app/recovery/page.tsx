import { requireUser } from "@/lib/auth/requireUser";
import { RecoveryPanel } from "@/components/vault/RecoveryPanel";
export default async function RecoveryPage() {
  const user = await requireUser("/recovery");
  return <RecoveryPanel userId={user.id} />;
}
