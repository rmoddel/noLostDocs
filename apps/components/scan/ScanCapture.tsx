import type { DashboardGroup, DashboardGroupId } from "@/constants/launcherGroups";
import { documentTypeFeatured, documentTypeSuggestions } from "@/constants/documentTypeTaxonomy";

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
  const selectedSuggestedType = documentTypeSuggestions.includes(title) ? title : "";

  return (
    <>
      {metadataEnabled ? (
        <>
          <label className="field">
            <span>Record category</span>
            <select onChange={(event) => onGroupChange(event.target.value as DashboardGroupId)} value={selectedGroupId}>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.title}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Document title</span>
            <div className="scan-type-picks" aria-label="Suggested file types">
              {documentTypeFeatured.map((suggestion) => (
                <button
                  className="scan-type-pill"
                  key={suggestion}
                  onClick={() => onTitleChange(suggestion)}
                  type="button"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <select
              aria-label="Suggested file type"
              onChange={(event) => onTitleChange(event.target.value)}
              value={selectedSuggestedType}
            >
              <option value="">Choose a suggested type</option>
              {documentTypeSuggestions.map((suggestion) => (
                <option key={suggestion} value={suggestion}>
                  {suggestion}
                </option>
              ))}
            </select>
            <input
              list="file-name-suggestions"
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Enter a document title"
              type="text"
              value={title}
            />
            <span className="field-note">Choose a standard type, then adjust the title as needed.</span>
            <datalist id="file-name-suggestions">
              {documentTypeSuggestions.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
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
        <strong>{fileName ?? "Take a photo or choose a file"}</strong>
        <span>Keep the document flat and fully inside the frame.</span>
        <span>Fallback: browser file upload</span>
      </label>
    </>
  );
}
