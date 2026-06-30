import { FREE_PLAN_DOCUMENT_LIMIT } from "@nolostdocs/config";
import type { AccountPlan } from "@/lib/plans/resolvePlan";
import { Card } from "../ui/Card";

type PlanStatusCardProps = {
  accountPlan: AccountPlan;
  uploadedCount: number;
  visibleGroupCount: number;
};

export function PlanStatusCard({
  accountPlan,
  uploadedCount,
  visibleGroupCount
}: PlanStatusCardProps) {
  const freePlanRemainingSlots = Math.max(FREE_PLAN_DOCUMENT_LIMIT - uploadedCount, 0);

  return (
    <Card className="side-card">
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Plan status</p>
          <h3>{accountPlan === "premium" ? "Premium access active." : "Free Basic active."}</h3>
        </div>
      </div>
      <ul className="note-list">
        <li>
          <strong>Signed-in access remains required.</strong>
          <span>The dashboard and secure scan flow stay behind account authentication.</span>
        </li>
        <li>
          <strong>{visibleGroupCount} categories visible.</strong>
          <span>{accountPlan === "premium" ? "Premium access keeps the full workspace open." : "Free Basic keeps the core category available."}</span>
        </li>
        <li>
          <strong>
            {accountPlan === "premium"
              ? "Premium upload policy is active."
              : `${freePlanRemainingSlots} of ${FREE_PLAN_DOCUMENT_LIMIT} free cloud slots remain.`}
          </strong>
          <span>Upload limits are enforced before a new record is saved.</span>
        </li>
      </ul>
    </Card>
  );
}
