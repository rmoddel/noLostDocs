import type { ScanProviderStatus } from "@/lib/scan/providerStatus";
import { scanPipeline } from "@/lib/scan/pipeline";

type ScanPipelineCardProps = {
  providerStatus: ScanProviderStatus;
};

export function ScanPipelineCard({ providerStatus }: ScanPipelineCardProps) {
  return (
    <div className="scan-pipeline-card">
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Pipeline</p>
          <h3>Capture and OCR stack</h3>
        </div>
        <span className="mini-pill">Phase 7</span>
      </div>

      <div className="scan-pipeline-grid">
        <section className="scan-pipeline-panel">
          <p className="scan-pipeline-label">{scanPipeline.capture.selectedLabel}</p>
          <strong>{scanPipeline.capture.selectedValue}</strong>
          <p className="support-copy">
            {scanPipeline.capture.implementationStatus} {providerStatus.captureLabel}.
          </p>
          <ul className="scan-chip-list" aria-label="Capture capabilities">
            {scanPipeline.capture.highlights.map((highlight) => (
              <li key={highlight} className="visibility-chip">
                {highlight}
              </li>
            ))}
          </ul>
        </section>

        <section className="scan-pipeline-panel">
          <p className="scan-pipeline-label">{scanPipeline.ocr.selectedLabel}</p>
          <strong>{scanPipeline.ocr.selectedValue}</strong>
          <p className="support-copy">
            {scanPipeline.ocr.implementationStatus} {providerStatus.ocrLabel}.
          </p>
          <ul className="scan-chip-list" aria-label="OCR capabilities">
            {scanPipeline.ocr.highlights.map((highlight) => (
              <li key={highlight} className="visibility-chip">
                {highlight}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
