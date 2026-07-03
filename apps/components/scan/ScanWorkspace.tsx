"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { documentTypeFeatured } from "@/constants/documentTypeTaxonomy";
import { dashboardGroups, type DashboardGroupId } from "@/constants/launcherGroups";
import { saveScan, validateScanFile } from "@/lib/documents/upload";
import type { ScanProviderStatus } from "@/lib/scan/providerStatus";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { ScanActions } from "./ScanActions";
import { ScanCapture } from "./ScanCapture";
import { ScanDocsLauncher } from "./ScanDocsLauncher";
import { ScanPreview } from "./ScanPreview";

type ScanWorkspaceProps = {
  embedded?: boolean;
  mode?: "protected" | "public";
  providerStatus: ScanProviderStatus;
};

function getDefaultScanTitle(groupId: DashboardGroupId) {
  switch (groupId) {
    case "medical":
      return "Insurance card";
    case "professional":
      return "Contract";
    case "family":
      return "Birth certificate";
    case "basic":
    default:
      return "Driver's license";
  }
}

export function ScanWorkspace({ embedded = false, mode = "protected", providerStatus }: ScanWorkspaceProps) {
  const router = useRouter();
  const { client, configured } = createBrowserSupabaseClient();
  const { session } = useAuth();
  const [selectedGroupId, setSelectedGroupId] = useState<DashboardGroupId>("basic");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [scanTitle, setScanTitle] = useState(getDefaultScanTitle("basic"));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const selectedGroup = useMemo(
    () => dashboardGroups.find((group) => group.id === selectedGroupId) ?? dashboardGroups[0],
    [selectedGroupId]
  );
  const defaultScanTitle = useMemo(() => getDefaultScanTitle(selectedGroupId), [selectedGroupId]);
  const isPublicMode = mode === "public";
  const showBackButton = !embedded;

  useEffect(() => {
    setScanTitle((current) => {
      const trimmed = current.trim();
      if (!trimmed || documentTypeFeatured.includes(trimmed)) {
        return defaultScanTitle;
      }

      return current;
    });
  }, [defaultScanTitle, selectedGroupId]);

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
        documentTitle: scanTitle.trim() || "Untitled record",
        file,
        groupId: selectedGroup.id,
        groupTitle: selectedGroup.title,
        rotation,
        scanMetadata: {
          captureProvider: providerStatus.captureProvider,
          captureReady: providerStatus.captureReady,
          ocrProvider: providerStatus.ocrProvider,
          ocrReady: providerStatus.ocrReady
        },
        session
      });

      setMessage("Record saved to your account.");
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
    <section className={embedded ? "dashboard-scan" : "page-section scan-page"} id="scan">
      <div className="scan-shell">
        <Card className={["content-card", "scan-intro-card", embedded ? "embedded" : ""].filter(Boolean).join(" ")}>
          <p className="eyebrow">Add record</p>
          <h1>{isPublicMode ? "Scan a document." : "Capture cleanly. Review before saving."}</h1>
          <p className="hero-lede">
            {isPublicMode
              ? "Public mode lets you review capture, framing, preview, and file upload without signing in."
              : "Use the camera or an image file to move a document into the protected workflow."}
          </p>
          <ScanDocsLauncher onScanReady={handleFileChange} />
          {showBackButton ? (
            <div className="button-row">
              <Button href={isPublicMode ? "/" : "/dashboard"} variant="secondary">
                {isPublicMode ? "Back to home" : "Back to records"}
              </Button>
            </div>
          ) : null}
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

          <div className="scan-status-strip">
            <span className="mini-pill">{providerStatus.captureLabel}</span>
            <span className="mini-pill">{providerStatus.ocrLabel}</span>
          </div>

          <ScanPreview
            disabled={saving}
            onRetake={() => setFile(null)}
            onRotate={() => setRotation((current) => current + 90)}
            previewUrl={previewUrl}
            rotation={rotation}
          />

          <ScanActions
            actionLabel={isPublicMode ? "Clear capture" : "Save record"}
            canAct={Boolean(file)}
            loading={saving}
            onAction={() => (isPublicMode ? handleClear() : void handleSave())}
          />

          <p className="support-copy">
            {isPublicMode
              ? "Public scanner mode keeps capture and review available without account writes."
              : "Uploads stay tied to the signed workflow and capture the active scan and OCR metadata."}
          </p>
          {message ? <p className="inline-feedback">{message}</p> : null}
        </Card>
      </div>
    </section>
  );
}
