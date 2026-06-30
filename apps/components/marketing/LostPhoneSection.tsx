import { Card } from "../ui/Card";
import { SectionHeader } from "../ui/SectionHeader";

export function LostPhoneSection() {
  return (
    <section className="section-block">
      <div className="split-section">
        <div>
          <SectionHeader
            description="Cloud-backed documents can be recovered through the web experience. Local-only documents remain on the originating device and are not represented otherwise."
            eyebrow="Lost your phone?"
            title="Pause access quickly, then recover through the account when you are ready."
          />
        </div>
        <Card className="recovery-card">
          <div className="recovery-step">
            <span className="step-index">01</span>
            <div>
              <strong>Review trusted devices</strong>
              <p>See which browsers and phones currently hold access to the account.</p>
            </div>
          </div>
          <div className="recovery-step">
            <span className="step-index">02</span>
            <div>
              <strong>Suspend the missing device</strong>
              <p>Remove access until the device is deliberately reviewed and re-authorized.</p>
            </div>
          </div>
          <div className="recovery-step">
            <span className="step-index">03</span>
            <div>
              <strong>Continue through the web account</strong>
              <p>Return through signed-in web access when records are needed before the device is back in hand.</p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
