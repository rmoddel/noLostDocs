import { Card } from "@/components/ui/Card";

export default function PrivacyPage() {
  return (
    <section className="page-section">
      <Card className="content-card">
        <p className="eyebrow">Privacy</p>
        <h1>Privacy practices for NoLostDocs.</h1>
        <p className="section-copy">
          NoLostDocs is built for sensitive records, so privacy is treated as a product boundary, not a marketing line.
          This page describes the current web experience.
        </p>
      </Card>

      <Card className="content-card">
        <h2>What this page covers</h2>
        <p className="section-copy">
          This notice applies to the NoLostDocs website, signed-in account areas, document scanning and upload flows,
          support contact forms, and any other web surface released under the NoLostDocs name unless a more specific
          notice says otherwise.
        </p>
        <p className="section-copy">
          The product is designed to help people organize and recover important personal or professional records. It is
          not a substitute for legal originals, government systems, or institution-specific acceptance requirements.
        </p>
      </Card>

      <Card className="content-card">
        <h2>Information NoLostDocs may handle</h2>
        <ul className="feature-list">
          <li>Account details such as email address, authentication state, and basic profile or plan information.</li>
          <li>Files, scans, images, filenames, and related document metadata you choose to upload, capture, label, or organize.</li>
          <li>Usage information needed to operate the web app, protect sessions, troubleshoot failures, and understand product health.</li>
          <li>Messages you send through support or contact forms, along with the context required to respond.</li>
        </ul>
      </Card>

      <Card className="content-card">
        <h2>How information is used</h2>
        <ul className="feature-list">
          <li>Provide document storage, organization, protected access, recovery, and account management features.</li>
          <li>Operate scan, upload, preview, and download workflows you intentionally trigger.</li>
          <li>Maintain service security, investigate abuse, detect failures, and improve reliability or usability.</li>
          <li>Respond to support requests, product inquiries, and operational communications.</li>
        </ul>
      </Card>

      <Card className="content-card">
        <h2>Camera, uploads, and browser permissions</h2>
        <p className="section-copy">
          The current scanner experience uses browser APIs and only accesses the camera after you explicitly allow it.
          Captured images or uploaded files are processed as part of the scan flow you start.
        </p>
        <p className="section-copy">
          If a NoLostDocs browser extension is released, it should request only the permissions required for its
          documented features. Any extension-specific permission set, local browser storage behavior, or sync behavior
          would be described in the extension listing and accompanying product documentation.
        </p>
      </Card>

      <Card className="content-card">
        <h2>Storage, access, and retention</h2>
        <p className="section-copy">
          NoLostDocs is designed around protected account access, private storage boundaries, and intentional document
          retrieval rather than public file exposure. Retention periods, deletion timelines, and backup practices may
          evolve as the service matures, but the operating direction is to keep access narrow and deliberate.
        </p>
        <p className="section-copy">
          Avoid uploading information you are not comfortable storing digitally unless the product experience, terms,
          and your own requirements support that use case.
        </p>
      </Card>

      <Card className="content-card">
        <h2>Third-party services</h2>
        <p className="section-copy">
          NoLostDocs may rely on infrastructure, authentication, analytics, payment, storage, or communications vendors
          to operate the service. Those providers may process limited information on NoLostDocs&apos; behalf as needed
          to deliver the platform, subject to their own contractual and operational controls.
        </p>
      </Card>

      <Card className="content-card">
        <h2>Security posture</h2>
        <p className="section-copy">
          The service is being developed around higher-trust patterns for sensitive records, including signed-in access
          controls, deliberate document handling, and minimal unnecessary exposure. No statement on this page guarantees
          how every institution, regulator, or counterparty will treat digital copies.
        </p>
      </Card>

      <Card className="content-card compact-card">
        <h2>Updates and contact</h2>
        <p className="section-copy">
          Privacy language will continue to evolve as the product and release surfaces expand. Material updates should
          be reflected here before broader distribution.
        </p>
        <p className="section-copy">
          Questions about privacy or data handling can be submitted through the contact page on the live NoLostDocs site.
        </p>
      </Card>
    </section>
  );
}
