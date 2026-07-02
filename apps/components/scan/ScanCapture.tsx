import type { DashboardGroup, DashboardGroupId } from "@/constants/launcherGroups";

type ScanCaptureProps = {
  fileName: string | null;
  groups: DashboardGroup[];
  metadataEnabled?: boolean;
  onFileChange: (file: File | null) => void;
  onGroupChange: (groupId: DashboardGroupId) => void;
  onTitleChange: (value: string) => void;
  selectedGroupId: DashboardGroupId;
  title: string;
};

export function ScanCapture({
  fileName,
  groups,
  metadataEnabled = true,
  onFileChange,
  onGroupChange,
  onTitleChange,
  selectedGroupId,
  title
}: ScanCaptureProps) {
  return (
    <>
      {metadataEnabled ? (
        <>
          <label className="field">
            <span>Category group</span>
            <select onChange={(event) => onGroupChange(event.target.value as DashboardGroupId)} value={selectedGroupId}>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.title}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Scan name</span>
            <input onChange={(event) => onTitleChange(event.target.value)} type="text" value={title} />
          </label>
        </>
      ) : null}

      <label className="scan-dropzone" htmlFor="scan-file">
        <input
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          capture="environment"
          id="scan-file"
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
          type="file"
        />
        <strong>{fileName ?? "Tap to take a photo or choose a file"}</strong>
        <span>Keep the document flat and fully inside the frame.</span>
        <span>Fallback: secure browser file input</span>
      </label>
    </>
  );
}
