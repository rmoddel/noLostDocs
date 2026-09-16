import { useId } from "react";
import type {
  DashboardCategoryRecord,
  DashboardDocumentTypeRecord,
  DashboardProfileRecord
} from "@/lib/documents/dashboard";

type ScanCaptureProps = {
  categories: DashboardCategoryRecord[];
  documentTypes: DashboardDocumentTypeRecord[];
  fileName: string | null;
  onFileChange: (file: File | null) => void;
  onCategoryChange: (categoryId: string) => void;
  onDocumentTypeChange: (documentTypeId: string) => void;
  onOwnerProfileChange: (profileId: string) => void;
  onTitleChange: (value: string) => void;
  profiles: DashboardProfileRecord[];
  selectedCategoryId: string;
  selectedDocumentTypeId: string;
  selectedOwnerProfileId: string;
  title: string;
};

export function ScanCapture({
  categories,
  documentTypes,
  fileName,
  onFileChange,
  onCategoryChange,
  onDocumentTypeChange,
  onOwnerProfileChange,
  onTitleChange,
  profiles,
  selectedCategoryId,
  selectedDocumentTypeId,
  selectedOwnerProfileId,
  title
}: ScanCaptureProps) {
  const fileInputId = useId();
  const filteredTypes = documentTypes.filter((type) => type.category_id === selectedCategoryId);
  const quickTypes = filteredTypes.slice(0, 4);

  return (
    <>
      <label className="field">
        <span>Owner / profile</span>
        <select onChange={(event) => onOwnerProfileChange(event.target.value)} value={selectedOwnerProfileId}>
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.display_name}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Category</span>
        <select onChange={(event) => onCategoryChange(event.target.value)} value={selectedCategoryId}>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Document type</span>
        <select onChange={(event) => onDocumentTypeChange(event.target.value)} value={selectedDocumentTypeId}>
          {filteredTypes.length ? (
            filteredTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))
          ) : (
            <option value="">No document types available</option>
          )}
        </select>
        {quickTypes.length ? (
          <div className="scan-type-picks" aria-label="Common document types">
            {quickTypes.map((type) => (
              <button
                className={`scan-type-pill${selectedDocumentTypeId === type.id ? " active" : ""}`}
                key={type.id}
                onClick={() => onDocumentTypeChange(type.id)}
                type="button"
              >
                {type.name}
              </button>
            ))}
          </div>
        ) : null}
      </label>

      <label className="field">
        <span>Title</span>
        <input
          onChange={(event) => onTitleChange(event.target.value)}
          maxLength={200}
          placeholder="Enter a document title"
          type="text"
          value={title}
        />
        <span className="field-note">Use the official name or the label you will search for later.</span>
      </label>

      <label className="scan-dropzone" htmlFor={fileInputId}>
        <input
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
          id={fileInputId}
          onChange={(event) => { onFileChange(event.target.files?.[0] ?? null); event.target.value = ""; }}
          type="file"
        />
        <strong>{fileName ?? "Choose a document"}</strong>
        <span>Keep the document flat and fully inside the frame.</span>
        <span>JPG, PNG, WebP, HEIC or PDF · up to 10 MB</span>
      </label>
    </>
  );
}
