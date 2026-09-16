import { Card } from "../ui/Card";
import { SectionHeader } from "../ui/SectionHeader";

export function LostPhoneSection() {
  return (
    <section className="section-block">
      <div className="split-section">
        <div>
          <SectionHeader
            description="Account access and file recovery are different. Encrypted files currently require the browser that saved them."
            eyebrow="Lost a device?"
            title="Protect account access. Keep independent backups."
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
              <p>Signing in on another device does not restore the original browser’s encryption key. Keep your originals and backups.</p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
