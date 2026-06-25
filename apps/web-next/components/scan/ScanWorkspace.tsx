"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { dashboardGroups, type DashboardGroupId } from "@/constants/launcherGroups";
import { saveScan, validateScanFile } from "@/lib/documents/upload";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { ScanActions } from "./ScanActions";
import { ScanCapture } from "./ScanCapture";
import { ScanPreview } from "./ScanPreview";

export function ScanWorkspace() {
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

  function handleFileChange(nextFile: File | null) {
    setMessage(nextFile ? validateScanFile(nextFile) : null);
    setRotation(0);
    setFile(nextFile);
  }

  async function handleSave() {
    if (!session || !file) {
      setMessage("Choose a document image first.");
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
        session
      });

      setMessage("Scan saved.");
      setFile(null);
      setRotation(0);
      router.push("/dashboard");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Scan save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page-section scan-page">
      <div className="scan-shell">
        <Card className="content-card scan-intro-card">
          <p className="eyebrow">Scan</p>
          <h1>Capture it like a bank deposit.</h1>
          <p className="section-copy">Use your camera or an image file. Rotate, review, then save it to your account.</p>
          <div className="button-row">
            <Button href="/dashboard" variant="secondary">
              Back to dashboard
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
            onFileChange={handleFileChange}
            onGroupChange={setSelectedGroupId}
            onTitleChange={setScanTitle}
            selectedGroupId={selectedGroupId}
            title={scanTitle}
          />

          <ScanPreview
            disabled={saving}
            onRetake={() => setFile(null)}
            onRotate={() => setRotation((current) => current + 90)}
            previewUrl={previewUrl}
            rotation={rotation}
          />

          <ScanActions canSave={Boolean(file)} loading={saving} onSave={() => void handleSave()} />

          <p className="support-copy">Uploads stay plan-aware through the existing signed upload function.</p>
          {message ? <p className="inline-feedback">{message}</p> : null}
        </Card>
      </div>
    </section>
  );
}
