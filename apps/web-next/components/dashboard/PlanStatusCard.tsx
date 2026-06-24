import type { DashboardGroup } from "@/constants/launcherGroups";
import type { AccountPlan } from "@/lib/plans/resolvePlan";
import { Card } from "../ui/Card";

type PlanStatusCardProps = {
  accountPlan: AccountPlan;
  hiddenGroups: DashboardGroup[];
  lockedGroups: DashboardGroup[];
  visibleGroupCount: number;
};

export function PlanStatusCard({ accountPlan, hiddenGroups, lockedGroups, visibleGroupCount }: PlanStatusCardProps) {
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
          <strong>Login stays required for every account.</strong>
          <span>The Next app now gates dashboard and scan routes behind signed-in access.</span>
        </li>
        <li>
          <strong>{accountPlan === "premium" ? "All groups unlocked." : "Only the Basic group is unlocked."}</strong>
          <span>
            {accountPlan === "premium"
              ? `${visibleGroupCount} visible groups are active in this account view.`
              : "Free Basic keeps the core group available until upgrade."}
          </span>
        </li>
        <li>
          <strong>{hiddenGroups.length ? `${hiddenGroups.length} groups are hidden.` : "No hidden groups."}</strong>
          <span>{lockedGroups.length ? `${lockedGroups.length} groups remain behind the premium boundary.` : "All groups are currently available."}</span>
        </li>
      </ul>
    </Card>
  );
}
