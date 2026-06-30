import type { DashboardGroup } from "@/constants/launcherGroups";
import { Card } from "../ui/Card";

type CategoryVisibilityPanelProps = {
  hiddenGroups: DashboardGroup[];
  message: string | null;
  onHide: (groupId: DashboardGroup["id"]) => void;
  onShow: (groupId: DashboardGroup["id"]) => void;
  saving: boolean;
  visibleGroups: DashboardGroup[];
};

export function CategoryVisibilityPanel({
  hiddenGroups,
  message,
  onHide,
  onShow,
  saving,
  visibleGroups
}: CategoryVisibilityPanelProps) {
  return (
    <Card className="side-card visibility-card">
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Category visibility</p>
          <h3>{visibleGroups.length} visible categories</h3>
        </div>
        <span className="mini-pill">{saving ? "Saving..." : "Workspace scope"}</span>
      </div>
      <div className="visibility-pile">
        {visibleGroups.map((group) => (
          <button className="visibility-chip" key={group.id} onClick={() => onHide(group.id)} type="button">
            Remove {group.title}
          </button>
        ))}
      </div>
      {hiddenGroups.length ? (
        <>
          <p className="section-support">Hidden categories remain available to restore from within this workspace.</p>
          <div className="visibility-pile muted">
            {hiddenGroups.map((group) => (
              <button className="visibility-chip muted" key={group.id} onClick={() => onShow(group.id)} type="button">
                Restore {group.title}
              </button>
            ))}
          </div>
        </>
      ) : null}
      {message ? <p className="inline-feedback">{message}</p> : null}
    </Card>
  );
}
