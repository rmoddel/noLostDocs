import type { AccountPlan } from "@/lib/plans/resolvePlan";
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
        <h1>Documents and account access.</h1>
        <p className="hero-lede">
          The signed-in workspace keeps session state, categories, and document status in one place.
        </p>
      </div>

      <Card className="dashboard-summary-card">
        <p className="eyebrow">{accountLoading ? "Checking account" : getPlanLabel(accountPlan)}</p>
        <h2>{email ?? "Signed-in account"}</h2>
        <div className="summary-metrics">
          <div className="summary-metric">
            <strong>{uploadedCount}</strong>
            <span>saved</span>
          </div>
          <div className="summary-metric">
            <strong>{missingCount}</strong>
            <span>missing</span>
          </div>
          <div className="summary-metric">
            <strong>{urgentCount}</strong>
            <span>urgent</span>
          </div>
        </div>
        <p className="section-support">
          {accountPlan === "premium"
            ? "Premium unlocks every group in the dashboard."
            : "Free Basic keeps the core cloud-backed document groups available."}
        </p>
        {accountMessage ? <p className="inline-feedback">{accountMessage}</p> : null}
      </Card>
    </section>
  );
}
