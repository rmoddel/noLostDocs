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
          <h3>{visibleGroups.length} visible groups</h3>
        </div>
        <span className="mini-pill">{saving ? "Saving..." : "Dashboard scope"}</span>
      </div>
      <div className="visibility-pile">
        {visibleGroups.map((group) => (
          <button className="visibility-chip" key={group.id} onClick={() => onHide(group.id)} type="button">
            Hide {group.title}
          </button>
        ))}
      </div>
      {hiddenGroups.length ? (
        <>
          <p className="section-support">Hidden groups stay recoverable from this dashboard.</p>
          <div className="visibility-pile muted">
            {hiddenGroups.map((group) => (
              <button className="visibility-chip muted" key={group.id} onClick={() => onShow(group.id)} type="button">
                Show {group.title}
              </button>
            ))}
          </div>
        </>
      ) : null}
      {message ? <p className="inline-feedback">{message}</p> : null}
    </Card>
  );
}
