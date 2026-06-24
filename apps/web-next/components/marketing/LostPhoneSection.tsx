import { Card } from "../ui/Card";
import { SectionHeader } from "../ui/SectionHeader";

export function LostPhoneSection() {
  return (
    <section className="section-block">
      <div className="split-section">
        <div>
          <SectionHeader
            description="Cloud-backed documents can be recovered through the web portal. Local-only documents remain only on the original device."
            eyebrow="Lost your phone?"
            title="Lock your account from the web portal and stop access until the device is re-authorized."
          />
        </div>
        <Card className="recovery-card">
          <div className="recovery-step">
            <span className="step-index">01</span>
            <div>
              <strong>Review trusted devices</strong>
              <p>See which browsers or phones have current access.</p>
            </div>
          </div>
          <div className="recovery-step">
            <span className="step-index">02</span>
            <div>
              <strong>Lock the missing device</strong>
              <p>Cut off access until you explicitly restore it.</p>
            </div>
          </div>
          <div className="recovery-step">
            <span className="step-index">03</span>
            <div>
              <strong>Recover from the portal</strong>
              <p>Return through signed-in web access when you need your files again.</p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
