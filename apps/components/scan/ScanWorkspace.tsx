"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { saveScan, validateScanFile } from "@/lib/documents/upload";
import type {
  DashboardCategoryRecord,
  DashboardDocumentTypeRecord,
  DashboardProfileRecord
} from "@/lib/documents/dashboard";
import type { ScanProviderStatus } from "@/lib/scan/providerStatus";
import { analyzeScanQuality, canInspectScanQuality, type ScanQualityReport } from "@/lib/scan/quality";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Modal } from "../ui/Modal";
import { canProcessScanImage, prepareScanImageForUpload } from "@/lib/scan/imageProcessing";
import { Button } from "../ui/Button";
import { ScanActions } from "./ScanActions";
import { ScanCapture } from "./ScanCapture";
import { ScanDocsLauncher } from "./ScanDocsLauncher";
import { ScanPreview } from "./ScanPreview";

type ScanWorkspaceProps = {
  categories: DashboardCategoryRecord[];
  documentTypes: DashboardDocumentTypeRecord[];
  initialCategorySlug?: string | null;
  onClose: () => void;
  onSaved?: () => Promise<void> | void;
  open: boolean;
  profiles: DashboardProfileRecord[];
  providerStatus: ScanProviderStatus;
};

function getDefaultProfileId(profiles: DashboardProfileRecord[]) {
  return profiles.find((profile) => profile.display_name === "Me")?.id ?? profiles[0]?.id ?? "";
}

function getDefaultCategoryId(categories: DashboardCategoryRecord[], initialCategorySlug?: string | null) {
  return categories.find((category) => category.slug === initialCategorySlug)?.id ?? categories[0]?.id ?? "";
}

function getFallbackTitle(documentType: DashboardDocumentTypeRecord | null) {
  return documentType?.name ?? "Untitled document";
}

export function ScanWorkspace({
  categories,
  documentTypes,
  initialCategorySlug,
  onClose,
  onSaved,
  open,
  profiles,
  providerStatus
}: ScanWorkspaceProps) {
  const { client, configured } = createBrowserSupabaseClient();
  const { session } = useAuth();
  const [selectedOwnerProfileId, setSelectedOwnerProfileId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedDocumentTypeId, setSelectedDocumentTypeId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [scanTitle, setScanTitle] = useState("");
  const [qualityReport, setQualityReport] = useState<ScanQualityReport | null>(null);
  const [qualityMessage, setQualityMessage] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const saveLock = useRef(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selectedCategoryTypes = useMemo(
    () => documentTypes.filter((type) => type.category_id === selectedCategoryId),
    [documentTypes, selectedCategoryId]
  );
  const selectedDocumentType = useMemo(
    () => documentTypes.find((type) => type.id === selectedDocumentTypeId) ?? null,
    [documentTypes, selectedDocumentTypeId]
  );
  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId]
  );
  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedOwnerProfileId) ?? null,
    [profiles, selectedOwnerProfileId]
  );
  const hasRequiredMetadata = Boolean(selectedOwnerProfileId && selectedCategoryId && selectedDocumentTypeId);

  useEffect(() => {
    if (!open) {
      return;
    }

    const defaultCategoryId = getDefaultCategoryId(categories, initialCategorySlug);
    const defaultTypes = documentTypes.filter((type) => type.category_id === defaultCategoryId);
    const defaultType = defaultTypes[0] ?? null;

    setSelectedOwnerProfileId(getDefaultProfileId(profiles));
    setSelectedCategoryId(defaultCategoryId);
    setSelectedDocumentTypeId(defaultType?.id ?? "");
    setScanTitle(getFallbackTitle(defaultType));
    setFile(null);
    setOriginalFile(null);
    setPreviewUrl(null);
    setRotation(0);
    setQualityMessage(null);
    setQualityReport(null);
    setSaving(false);
    setMessage(null);
  }, [categories, documentTypes, initialCategorySlug, open, profiles]);

  useEffect(() => {
    if (!open || !selectedCategoryId) {
      return;
    }

    const typeStillMatches = selectedCategoryTypes.some((type) => type.id === selectedDocumentTypeId);
    if (typeStillMatches) {
      return;
    }

    const nextType = selectedCategoryTypes[0] ?? null;
    setSelectedDocumentTypeId(nextType?.id ?? "");
    setScanTitle((current) => current.trim() || getFallbackTitle(nextType));
  }, [open, selectedCategoryId, selectedCategoryTypes, selectedDocumentTypeId]);

  useEffect(() => {
    if (!file) {
      setQualityMessage(null);
      setQualityReport(null);
      setPreviewUrl(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!file) {
      setQualityMessage(null);
      setQualityReport(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setQualityMessage("PDF selected. Image quality checks apply to camera captures.");
      setQualityReport(null);
      return;
    }

    if (!canInspectScanQuality(file)) {
      setQualityMessage("Image selected. This browser cannot inspect that format before upload.");
      setQualityReport(null);
      return;
    }

    let active = true;
    setQualityReport(null);
    setQualityMessage("Checking image quality...");

    analyzeScanQuality(file, rotation)
      .then((report) => {
        if (!active) {
          return;
        }

        setQualityReport(report);
        setQualityMessage(`${report.headline} ${report.ocrSummary}`);
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setQualityReport(null);
        setQualityMessage(error instanceof Error ? error.message : "Image quality check is unavailable.");
      });

    return () => {
      active = false;
    };
  }, [file, rotation]);

  function handleFileChange(nextFile: File | null) {
    if (saving || processing) return;
    const error = nextFile ? validateScanFile(nextFile) : null;
    setMessage(error);
    if (error) return;
    setQualityReport(null);
    setOriginalFile(null);
    setRotation(0);
    setFile(nextFile);
  }

  function handleCategoryChange(categoryId: string) {
    const currentTypeName = selectedDocumentType?.name ?? "";
    const nextType = documentTypes.find((type) => type.category_id === categoryId) ?? null;

    setSelectedCategoryId(categoryId);
    setSelectedDocumentTypeId(nextType?.id ?? "");
    setScanTitle((current) => {
      const trimmed = current.trim();
      if (!trimmed || trimmed === currentTypeName) {
        return getFallbackTitle(nextType);
      }

      return current;
    });
  }

  function handleDocumentTypeChange(documentTypeId: string) {
    const currentTypeName = selectedDocumentType?.name ?? "";
    const nextType = documentTypes.find((type) => type.id === documentTypeId) ?? null;

    setSelectedDocumentTypeId(documentTypeId);
    setScanTitle((current) => {
      const trimmed = current.trim();
      if (!trimmed || trimmed === currentTypeName) {
        return getFallbackTitle(nextType);
      }

      return current;
    });
  }

  async function handleSave() {
    if (!session || !file) {
      setMessage("Choose a document before continuing.");
      return;
    }

    if (!hasRequiredMetadata) {
      setMessage("Choose an owner, category, and document type before saving.");
      return;
    }

    const validationError = validateScanFile(file);
    if (validationError) {
      setMessage(validationError);
      return;
    }

    if (saveLock.current || processing) return;
    saveLock.current = true;
    setSaving(true);
    setMessage("Encrypting and saving your document…");

    try {
      if (canInspectScanQuality(file)) {
        const report = await analyzeScanQuality(file, rotation);
        setQualityReport(report);
        if (!report.canSave) {
          setMessage(`${report.headline} ${report.ocrSummary}`);
          return;
        }
      }
      await saveScan({
        categoryId: selectedCategoryId,
        client,
        configured,
        documentTypeId: selectedDocumentTypeId,
        documentTitle: scanTitle.trim() || "Untitled record",
        file,
        ownerProfileId: selectedOwnerProfileId,
        rotation,
        scanMetadata: {
          categoryName: selectedCategory?.name ?? null,
          captureProvider: providerStatus.captureProvider,
          captureReady: providerStatus.captureReady,
          documentTypeName: selectedDocumentType?.name ?? null,
          ocrProvider: providerStatus.ocrProvider,
          ocrReady: providerStatus.ocrReady,
          qualityFlags: qualityReport?.flags ?? [],
          qualityHeadline: qualityReport?.headline ?? null,
          qualityTone: qualityReport?.tone ?? null,
          ownerProfileName: selectedProfile?.display_name ?? null
        },
        session
      });

      setMessage("Document saved to records.");
      setFile(null);
      setRotation(0);
      try {
        await onSaved?.();
      } catch {
        setMessage("Document saved. Close this dialog and refresh your records to see it.");
        return;
      }
      onClose();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Document save failed.");
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  }

  async function handleEnhance() {
    if (!file || saving || processing) return;
    setProcessing(true);
    setMessage("Preparing a preview on this device…");
    try {
      const result = await prepareScanImageForUpload(file, rotation, true);
      const error = validateScanFile(result.file);
      if (error) throw new Error(error);
      setOriginalFile(file);
      setFile(result.file);
      setRotation(0);
      setQualityReport(null);
      setMessage("Review all edges and text before saving. Restore the original if anything is missing.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Image enhancement failed. Your original is unchanged.");
    } finally {
      setProcessing(false);
    }
  }

  function handleClear() {
    setOriginalFile(null);
    setMessage(null);
    setFile(null);
    setQualityMessage(null);
    setQualityReport(null);
    setRotation(0);
  }

  if (!open) {
    return null;
  }

  return (
    <Modal className="dashboard-scan-overlay" labelledBy="dashboard-scan-title" onClose={onClose} busy={saving || processing}>
      <div className="dashboard-scan-dialog">
        <div className="dashboard-scan-dialog-header">
          <div>
            <p className="dashboard-section-kicker">Add document</p>
            <h2 id="dashboard-scan-title">Scan or upload</h2>
          </div>
          <button aria-label="Close scan dialog" className="dashboard-scan-close" disabled={saving || processing} onClick={onClose} type="button">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
            </svg>
          </button>
        </div>

        <fieldset className="dashboard-scan-dialog-body scan-fields" disabled={saving || processing}>
          <div className="dashboard-scan-meta-panel">
            <div>
              <p className="dashboard-section-kicker">Classify</p>
              <h3>Save to records</h3>
            </div>

            <ScanCapture
              categories={categories}
              documentTypes={documentTypes}
              fileName={file?.name ?? null}
              onCategoryChange={handleCategoryChange}
              onDocumentTypeChange={handleDocumentTypeChange}
              onFileChange={handleFileChange}
              onOwnerProfileChange={setSelectedOwnerProfileId}
              onTitleChange={setScanTitle}
              profiles={profiles}
              selectedCategoryId={selectedCategoryId}
              selectedDocumentTypeId={selectedDocumentTypeId}
              selectedOwnerProfileId={selectedOwnerProfileId}
              title={scanTitle}
            />
          </div>

          <div className="dashboard-scan-capture-panel">
            <div className="dashboard-scan-panel-heading">
              <div>
                <p className="dashboard-section-kicker">Capture</p>
                <h3>{scanTitle.trim() || "Untitled document"}</h3>
              </div>
              <span className="dashboard-scan-pill">{selectedCategory?.name ?? "Category"}</span>
            </div>

            <ScanDocsLauncher key={file?.name ?? "empty"} helperText="Keep all edges visible and avoid glare." onScanReady={handleFileChange} />

            <div className="scan-status-strip">
              <span className="dashboard-scan-pill">{providerStatus.captureLabel}</span>
              <span className="dashboard-scan-pill">{providerStatus.ocrLabel}</span>
            </div>

            <ScanPreview
              disabled={saving || processing}
              fileName={file?.name ?? null}
              fileType={file?.type ?? null}
              onRetake={handleClear}
              onRotate={() => { setQualityReport(null); setRotation((current) => (current + 90) % 360); }}
              previewUrl={previewUrl}
              rotation={rotation}
            />

            {canProcessScanImage(file) ? <div className="button-row">
              <Button disabled={saving || processing || Boolean(originalFile)} onClick={() => void handleEnhance()} size="sm" variant="secondary">
                {processing ? "Preparing preview…" : "Auto-crop & enhance"}
              </Button>
              {originalFile ? <Button disabled={saving || processing} size="sm" variant="secondary" onClick={() => {
                setFile(originalFile); setOriginalFile(null); setRotation(0); setQualityReport(null); setMessage("Original restored.");
              }}>Restore original</Button> : null}
            </div> : null}
            <p className="field-note">Images stay unchanged unless you rotate or enhance them. Check every detail before saving.</p>
            <p className="scan-recovery-notice">Keep your originals and recovery code safe. <Link href="/recovery">Set up or unlock recovery</Link> before saving in this browser.</p>

            {qualityReport ? (
              <ul className="scan-signal-list" aria-label="Scan quality signals">
                {qualityReport.signals.map((signal) => (
                  <li className={`scan-signal scan-signal-${signal.tone}`} key={signal.id}>
                    <strong>{signal.label}</strong>
                    <span>{signal.detail}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {file?.type.startsWith("image/") && !canInspectScanQuality(file) ? (
              <p className="scan-ocr-note quality-waiting">
                Save is available, but scan quality preview needs JPG, PNG, or WebP in this browser.
              </p>
            ) : null}
          </div>
        </fieldset>

        <div className="dashboard-scan-dialog-footer">
          <p className="dashboard-scan-feedback" role="status">
            {message ?? qualityMessage ?? "Encrypted upload flow. Files are stored only after you choose Save Document."}
          </p>
          <div className="dashboard-scan-footer-actions">
            <Button disabled={saving || processing} onClick={onClose} variant="secondary">
              Cancel
            </Button>
            <ScanActions
              actionLabel="Save Document"
              canAct={Boolean(file) && !processing && hasRequiredMetadata && qualityReport?.tone !== "blocked"}
              loading={saving}
              onAction={() => void handleSave()}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
