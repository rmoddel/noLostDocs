import type { AccountPlan } from "@/lib/plans/resolvePlan";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

type DashboardHeroProps = {
  accountLoading: boolean;
  accountMessage: string | null;
  accountPlan: AccountPlan;
  email: string | null;
  missingCount: number;
  urgentCount: number;
  uploadedCount: number;
};

function getPlanLabel(plan: AccountPlan) {
  return plan === "premium" ? "Premium" : "Free Basic";
}

export function DashboardHero({
  accountLoading,
  accountMessage,
  accountPlan,
  email,
  missingCount,
  urgentCount,
  uploadedCount
}: DashboardHeroProps) {
  return (
    <section className="dashboard-hero">
      <div className="hero-copy dashboard-copy">
        <p className="eyebrow">Dashboard</p>
        <h1>Records, access, and status in one view.</h1>
        <p className="hero-lede">The signed-in workspace keeps account state, categories, and document status together.</p>
        <div className="hero-actions">
          <Button href="/dashboard#scan">Jump to scan</Button>
          <Button href="/dashboard#records" variant="ghost">
            View records
          </Button>
        </div>
      </div>

      <Card className="dashboard-summary-card">
        <p className="eyebrow">{accountLoading ? "Checking account" : getPlanLabel(accountPlan)}</p>
        <h2>{email ?? "Signed-in account"}</h2>
        <div className="summary-metrics">
          <div className="summary-metric">
            <strong>{uploadedCount}</strong>
            <span>filed</span>
          </div>
          <div className="summary-metric">
            <strong>{missingCount}</strong>
            <span>missing</span>
          </div>
          <div className="summary-metric">
            <strong>{urgentCount}</strong>
            <span>needs review</span>
          </div>
        </div>
        <p className="section-support">
          {accountPlan === "premium"
            ? "Premium access keeps every category and protected action available."
            : "Free Basic keeps the core cloud-backed document groups available."}
        </p>
        {accountMessage ? <p className="inline-feedback">{accountMessage}</p> : null}
      </Card>
    </section>
  );
}
