import { securityPrinciples } from "@/constants/launcherGroups";
import { Card } from "../ui/Card";
import { SectionHeader } from "../ui/SectionHeader";

export function SecuritySection() {
  return (
    <section className="section-block">
      <SectionHeader
        description="The product promise is operational: keep sensitive records behind the account boundary, keep access scoped, and make recovery controls easy to understand."
        eyebrow="Security"
        title="Concrete controls instead of inflated claims."
      />
      <div className="security-grid">
        {securityPrinciples.map((principle, index) => (
          <Card className="security-card" key={principle.title}>
            <span className="security-index">{String(index + 1).padStart(2, "0")}</span>
            <p className="security-title">{principle.title}</p>
            <p className="security-detail">{principle.detail}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
