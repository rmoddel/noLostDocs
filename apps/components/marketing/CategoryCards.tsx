import { launcherGroups } from "@/constants/launcherGroups";
import { Card } from "../ui/Card";
import { SectionHeader } from "../ui/SectionHeader";

export function CategoryCards() {
  return (
    <section className="section-block">
      <SectionHeader
        description="NoLostDocs starts with the document categories people actually search for in stressful moments."
        eyebrow="Categories"
        title="Real records. Real-life groupings."
      />
      <div className="category-grid">
        {launcherGroups.map((group) => (
          <Card className="category-card" key={group.id}>
            <p className="category-title">{group.title}</p>
            <h3>{group.summary}</h3>
            <p>{group.detail}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
