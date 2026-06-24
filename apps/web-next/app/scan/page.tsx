import { AuthGate } from "@/components/auth/AuthGate";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ScanPage() {
  return (
    <AuthGate redirectTo="/scan">
      <section className="page-section">
        <EmptyState
          body="The scan route is now protected by session-aware routing. Capture, rotate, validation, and signed upload flows are intentionally deferred to the next phase."
          title="Protected scan shell"
        />
      </section>
    </AuthGate>
  );
}
