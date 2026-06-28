import type { ScanProviderStatus } from "@/lib/scan/providerStatus";
import type { ScanQualityReport } from "@/lib/scan/quality";

type ScanReviewPanelProps = {
  providerStatus: ScanProviderStatus;
  qualityPending: boolean;
  qualityReport: ScanQualityReport | null;
};

export function ScanReviewPanel({ providerStatus, qualityPending, qualityReport }: ScanReviewPanelProps) {
  const tone = qualityReport?.tone ?? "waiting";
  const label =
    tone === "ready"
      ? "Ready"
      : tone === "warning"
        ? "Review"
        : tone === "blocked"
          ? "Retake"
          : "Waiting";

  return (
    <div className="scan-review-card">
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Review</p>
          <h3>Quality and OCR</h3>
        </div>
        <span className={`status-pill quality-${tone}`}>{label}</span>
      </div>

      <p className="section-support">
        {qualityPending
          ? "Inspecting the selected image for focus, framing, distance, and lighting."
          : qualityReport?.headline ?? "Choose an image to unlock capture review before saving."}
      </p>

      {qualityReport ? (
        <ul className="scan-signal-list">
          {qualityReport.signals.map((signal) => (
            <li className={`scan-signal scan-signal-${signal.tone}`} key={signal.id}>
              <strong>{signal.label}</strong>
              <span>{signal.detail}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="scan-ocr-note">
        <p className="scan-pipeline-label">OCR path</p>
        <strong>{providerStatus.ocrLabel}</strong>
        <p className="support-copy">
          {providerStatus.ocrReady
            ? qualityReport?.ocrSummary ?? "Saved scans will queue for ABBYY extraction after upload."
            : "ABBYY remains the selected OCR layer. Configure the server connector to move saved scans from review into extraction."}
        </p>
      </div>
    </div>
  );
}
