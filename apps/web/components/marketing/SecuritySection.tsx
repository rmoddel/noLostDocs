import { securityPrinciples } from "@/constants/launcherGroups";
import { Card } from "../ui/Card";
import { SectionHeader } from "../ui/SectionHeader";

export function SecuritySection() {
  return (
    <section className="section-block">
      <SectionHeader
        description="The product promise is practical: keep sensitive files behind your account, keep access scoped, and keep recovery controls obvious."
        eyebrow="Security"
        title="Specific controls instead of hype."
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
