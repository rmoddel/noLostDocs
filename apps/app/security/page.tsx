import { SecuritySection } from "@/components/marketing/SecuritySection";
import { Card } from "@/components/ui/Card";

export default function SecurityPage() {
  return (
    <section className="page-section">
      <Card className="content-card">
        <p className="eyebrow">Security</p>
        <h1>Built for records that need a stricter standard.</h1>
        <p className="section-copy">
          NoLostDocs is built around a web-first trust model with private storage boundaries, signed-in account access, and protected downloads.
        </p>
      </Card>
      <Card className="content-card">
        <h2>Keep your recovery code safe</h2>
        <p className="section-copy">Uploaded file contents are encrypted before they reach cloud storage. Set up and save your recovery code before uploading. After signing in on another browser, use the code on the Recovery page to unlock your files. We cannot replace a lost recovery code. Older files must be migrated from a browser that still holds their keys. Keep your original documents and independent backups.</p>
        <p className="section-copy">Document titles, filenames, and classification metadata are stored separately from encrypted file contents. NoLostDocs does not claim zero-knowledge encryption or HIPAA compliance.</p>
      </Card>
      <SecuritySection />
    </section>
  );
}
