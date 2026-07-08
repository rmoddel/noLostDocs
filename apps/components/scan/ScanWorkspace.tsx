"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { saveScan, validateScanFile } from "@/lib/documents/upload";
import type {
  DashboardCategoryRecord,
  DashboardDocumentTypeRecord,
  DashboardProfileRecord
} from "@/lib/documents/dashboard";
import type { ScanProviderStatus } from "@/lib/scan/providerStatus";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
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
    setPreviewUrl(null);
    setRotation(0);
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
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open, saving]);

  function handleFileChange(nextFile: File | null) {
    setMessage(nextFile ? validateScanFile(nextFile) : null);
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

    setSaving(true);
    setMessage(null);

    try {
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
          ownerProfileName: selectedProfile?.display_name ?? null
        },
        session
      });

      setMessage("Document saved to records.");
      setFile(null);
      setRotation(0);
      await onSaved?.();
      onClose();
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

  if (!open) {
    return null;
  }

  return (
    <div className="dashboard-scan-overlay" role="dialog" aria-modal="true" aria-labelledby="dashboard-scan-title">
      <div className="dashboard-scan-dialog">
        <div className="dashboard-scan-dialog-header">
          <div>
            <p className="dashboard-section-kicker">Add document</p>
            <h2 id="dashboard-scan-title">Scan or upload</h2>
          </div>
          <button aria-label="Close scan dialog" className="dashboard-scan-close" disabled={saving} onClick={onClose} type="button">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
            </svg>
          </button>
        </div>

        <div className="dashboard-scan-dialog-body">
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

            <ScanDocsLauncher helperText="Use camera capture, or choose a file below." onScanReady={handleFileChange} />

            <div className="scan-status-strip">
              <span className="dashboard-scan-pill">{providerStatus.captureLabel}</span>
              <span className="dashboard-scan-pill">{providerStatus.ocrLabel}</span>
            </div>

            <ScanPreview
              disabled={saving}
              fileName={file?.name ?? null}
              fileType={file?.type ?? null}
              onRetake={handleClear}
              onRotate={() => setRotation((current) => current + 90)}
              previewUrl={previewUrl}
              rotation={rotation}
            />
          </div>
        </div>

        <div className="dashboard-scan-dialog-footer">
          <p className="dashboard-scan-feedback" role="status">
            {message ?? "Private upload flow. Files are saved only after you choose Save Document."}
          </p>
          <div className="dashboard-scan-footer-actions">
            <Button disabled={saving} onClick={onClose} variant="secondary">
              Cancel
            </Button>
            <ScanActions
              actionLabel="Save Document"
              canAct={Boolean(file) && hasRequiredMetadata}
              loading={saving}
              onAction={() => void handleSave()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
