import type { DashboardGroup } from "@/constants/launcherGroups";
import { FREE_PLAN_DOCUMENT_LIMIT } from "@nolostdocs/config";
import type { AccountPlan } from "@/lib/plans/resolvePlan";
import { Card } from "../ui/Card";

type PlanStatusCardProps = {
  accountPlan: AccountPlan;
  hiddenGroups: DashboardGroup[];
  lockedGroups: DashboardGroup[];
  uploadedCount: number;
  visibleGroupCount: number;
};

export function PlanStatusCard({
  accountPlan,
  hiddenGroups,
  lockedGroups,
  uploadedCount,
  visibleGroupCount
}: PlanStatusCardProps) {
  const freePlanRemainingSlots = Math.max(FREE_PLAN_DOCUMENT_LIMIT - uploadedCount, 0);

  return (
    <Card className="side-card">
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Plan status</p>
          <h3>{accountPlan === "premium" ? "Premium access is active." : "Free Basic is active."}</h3>
        </div>
      </div>
      <ul className="note-list">
        <li>
          <strong>Signed-in access remains required.</strong>
          <span>The dashboard and secure scan workflow stay behind account authentication.</span>
        </li>
        <li>
          <strong>{accountPlan === "premium" ? "All categories are available." : "Only the Basic category is available."}</strong>
          <span>
            {accountPlan === "premium"
              ? `${visibleGroupCount} visible categories are active in this account view.`
              : "Free Basic keeps the core category available until the account is upgraded."}
          </span>
        </li>
        <li>
          <strong>
            {accountPlan === "premium"
              ? "Premium upload policy is active."
              : `${freePlanRemainingSlots} of ${FREE_PLAN_DOCUMENT_LIMIT} free cloud slots remain.`}
          </strong>
          <span>Upload limits are enforced before a new record is saved to the account.</span>
        </li>
        <li>
          <strong>{hiddenGroups.length ? `${hiddenGroups.length} categories are hidden.` : "No hidden categories."}</strong>
          <span>
            {lockedGroups.length ? `${lockedGroups.length} categories remain behind the premium boundary.` : "All available categories are currently visible to this account."}
          </span>
        </li>
      </ul>
    </Card>
  );
}
