import { securityPrinciples } from "@/constants/launcherGroups";
import { Card } from "../ui/Card";
import { SectionHeader } from "../ui/SectionHeader";

export function SecuritySection() {
  return (
    <section className="section-block">
      <SectionHeader
        description="The product promise is operational: keep sensitive files behind the account boundary, keep access scoped, and make recovery controls understandable."
        eyebrow="Security"
        title="Concrete controls instead of inflated language."
      />
      <div className="security-grid">
        {securityPrinciples.map((principle) => (
          <Card className="security-card" key={principle}>
            <p className="security-title">{principle}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
