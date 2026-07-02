import { Card } from "../ui/Card";
import { SectionHeader } from "../ui/SectionHeader";

export function LostPhoneSection() {
  return (
    <section className="section-block">
      <div className="split-section">
        <div>
          <SectionHeader
            description="Cloud-backed records can be recovered through the web experience. Device recovery controls keep access scoped in the account."
            eyebrow="Lost a device?"
            title="Pause access quickly, then recover through the account when ready."
          />
        </div>
        <Card className="recovery-card">
          <div className="recovery-step">
            <span className="step-index">01</span>
            <div>
              <strong>Review trusted devices</strong>
              <p>See which browsers and phones still have access to the account.</p>
            </div>
          </div>
          <div className="recovery-step">
            <span className="step-index">02</span>
            <div>
              <strong>Suspend the missing device</strong>
              <p>Remove access until the device is reviewed and re-authorized.</p>
            </div>
          </div>
          <div className="recovery-step">
            <span className="step-index">03</span>
            <div>
              <strong>Continue in the web app</strong>
              <p>Return through signed-in access when records are needed before the device is back in hand.</p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
