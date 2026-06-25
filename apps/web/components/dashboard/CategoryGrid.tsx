import type { DashboardGroup, DashboardGroupId } from "@/constants/launcherGroups";

type CategoryGridProps = {
  groups: DashboardGroup[];
  onSelect: (groupId: DashboardGroupId) => void;
  selectedGroupId: DashboardGroupId;
};

export function CategoryGrid({ groups, onSelect, selectedGroupId }: CategoryGridProps) {
  return (
    <div className="launcher-grid">
      {groups.map((group) => (
        <button
          className={`launcher-card app-card${selectedGroupId === group.id ? " active" : ""}`}
          key={group.id}
          onClick={() => onSelect(group.id)}
          type="button"
        >
          <strong>{group.title}</strong>
          <p>{group.description}</p>
          <small>{group.helper}</small>
        </button>
      ))}
    </div>
  );
}
