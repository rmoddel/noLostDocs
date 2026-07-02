import { launcherGroups } from "@/constants/launcherGroups";
import { Card } from "../ui/Card";
import { SectionHeader } from "../ui/SectionHeader";

export function CategoryCards() {
  return (
    <section className="section-block">
      <SectionHeader
        description="NoLostDocs starts with the record groupings people actually need when requests, deadlines, or renewals show up unexpectedly."
        eyebrow="Categories"
        title="Structured around real recordkeeping."
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
