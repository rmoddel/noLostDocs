"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { dashboardGroups, type DashboardGroupId } from "@/constants/launcherGroups";
import { saveScan, validateScanFile } from "@/lib/documents/upload";
import type { ScanProviderStatus } from "@/lib/scan/providerStatus";
import { analyzeScanQuality, type ScanQualityReport } from "@/lib/scan/quality";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { ScanActions } from "./ScanActions";
import { ScanCapture } from "./ScanCapture";
import { ScanDocsLauncher } from "./ScanDocsLauncher";
import { ScanPipelineCard } from "./ScanPipelineCard";
import { ScanPreview } from "./ScanPreview";
import { ScanReviewPanel } from "./ScanReviewPanel";

type ScanWorkspaceProps = {
  mode?: "protected" | "public";
  providerStatus: ScanProviderStatus;
};

export function ScanWorkspace({ mode = "protected", providerStatus }: ScanWorkspaceProps) {
  const router = useRouter();
  const { client, configured } = createBrowserSupabaseClient();
  const { session } = useAuth();
  const [selectedGroupId, setSelectedGroupId] = useState<DashboardGroupId>("basic");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [scanTitle, setScanTitle] = useState("New scan");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [qualityPending, setQualityPending] = useState(false);
  const [qualityReport, setQualityReport] = useState<ScanQualityReport | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!file) {
      setQualityPending(false);
      setQualityReport(null);
      return;
    }

    let active = true;
    setQualityPending(true);

    void analyzeScanQuality(file, rotation)
      .then((report) => {
        if (active) {
          setQualityReport(report);
        }
      })
      .catch((error) => {
        if (active) {
          setQualityReport({
            canSave: false,
            flags: ["inspection-failed"],
            headline: error instanceof Error ? error.message : "Unable to inspect the selected image.",
            ocrSummary: "Quality inspection failed, so OCR readiness could not be confirmed.",
            signals: [
              {
                detail: "Choose a different image or retry this capture.",
                id: "framing",
                label: "Inspection failed",
                tone: "blocked"
              }
            ],
            tone: "blocked"
          });
        }
      })
      .finally(() => {
        if (active) {
          setQualityPending(false);
        }
      });

    return () => {
      active = false;
    };
  }, [file, rotation]);

  const selectedGroup = useMemo(
    () => dashboardGroups.find((group) => group.id === selectedGroupId) ?? dashboardGroups[0],
    [selectedGroupId]
  );
  const isPublicMode = mode === "public";

  function handleFileChange(nextFile: File | null) {
    setMessage(nextFile ? validateScanFile(nextFile) : null);
    setRotation(0);
    setFile(nextFile);
  }

  async function handleSave() {
    if (!session || !file) {
      setMessage("Choose a document image before continuing.");
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await saveScan({
        client,
        configured,
        documentTitle: scanTitle.trim() || "New scan",
        file,
        groupId: selectedGroup.id,
        groupTitle: selectedGroup.title,
        rotation,
        scanMetadata: {
          captureProvider: providerStatus.captureProvider,
          captureReady: providerStatus.captureReady,
          ocrProvider: providerStatus.ocrProvider,
          ocrReady: providerStatus.ocrReady,
          qualityFlags: qualityReport?.flags ?? [],
          qualityHeadline: qualityReport?.headline ?? "Quality review unavailable.",
          qualityTone: qualityReport?.tone ?? "warning"
        },
        session
      });

      setMessage("Document saved to the account.");
      setFile(null);
      setRotation(0);
      router.push("/dashboard");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Document save failed.");
    } finally {
      setSaving(false);
    }
  }

  function handleClear() {
    setMessage(null);
    setFile(null);
    setRotation(0);
  }

  return (
    <section className="page-section scan-page">
      <div className="scan-shell">
        <Card className="content-card scan-intro-card">
          <p className="eyebrow">Scan</p>
          <h1>{isPublicMode ? "Evaluate the scanner." : "Capture cleanly. Review once."}</h1>
          <p className="hero-lede">
            {isPublicMode
              ? "Public mode lets you test capture, framing, preview, and upload fallback without login."
              : "Use the camera or an image file to move a document into the protected workflow."}
          </p>
          <ScanDocsLauncher onScanReady={handleFileChange} />
          <div className="button-row">
            <Button href={isPublicMode ? "/" : "/dashboard"} variant="secondary">
              {isPublicMode ? "Back to home" : "Back to workspace"}
            </Button>
          </div>
        </Card>

        <Card className="side-card scan-card">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">Capture</p>
              <h3>{scanTitle}</h3>
            </div>
            <span className="mini-pill">{selectedGroup.title}</span>
          </div>

          <ScanCapture
            fileName={file?.name ?? null}
            groups={dashboardGroups}
            metadataEnabled={!isPublicMode}
            onFileChange={handleFileChange}
            onGroupChange={setSelectedGroupId}
            onTitleChange={setScanTitle}
            selectedGroupId={selectedGroupId}
            title={scanTitle}
          />

          <ScanPipelineCard providerStatus={providerStatus} />

          <ScanReviewPanel providerStatus={providerStatus} qualityPending={qualityPending} qualityReport={qualityReport} />

          <ScanPreview
            disabled={saving}
            onRetake={() => setFile(null)}
            onRotate={() => setRotation((current) => current + 90)}
            previewUrl={previewUrl}
            rotation={rotation}
          />

          <ScanActions
            actionLabel={isPublicMode ? "Clear test capture" : "Save document"}
            canAct={isPublicMode ? Boolean(file) : Boolean(file) && !qualityPending && Boolean(qualityReport?.canSave)}
            loading={saving || qualityPending}
            onAction={() => (isPublicMode ? handleClear() : void handleSave())}
          />

          <p className="support-copy">
            {isPublicMode
              ? "Public scanner mode stays local-only. It is for evaluating capture and review, not account writes."
              : "Uploads remain plan-aware through the signed flow, and saved records capture the active scan and OCR metadata."}
          </p>
          {message ? <p className="inline-feedback">{message}</p> : null}
        </Card>
      </div>
    </section>
  );
}
