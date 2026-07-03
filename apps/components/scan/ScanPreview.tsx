import { Button } from "../ui/Button";

type ScanPreviewProps = {
  disabled: boolean;
  fileName: string | null;
  fileType: string | null;
  onRetake: () => void;
  onRotate: () => void;
  previewUrl: string | null;
  rotation: number;
};

function isPreviewableImage(fileType: string | null) {
  return Boolean(fileType?.startsWith("image/"));
}

export function ScanPreview({ disabled, fileName, fileType, onRetake, onRotate, previewUrl, rotation }: ScanPreviewProps) {
  if (!fileName) {
    return null;
  }

  const showImagePreview = isPreviewableImage(fileType) && previewUrl;

  return (
    <>
      <div className="scan-preview">
        {showImagePreview ? (
          <img alt="Document preview" src={previewUrl} style={{ transform: `rotate(${rotation}deg)` }} />
        ) : (
          <div className="scan-preview-file">
            <div className="scan-camera-file-icon" aria-hidden="true">
              <svg fill="none" viewBox="0 0 24 24">
                <path
                  d="M9 3h6l4 4v11a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
                <path d="M15 3v5h5" stroke="currentColor" strokeWidth="1.7" />
              </svg>
            </div>
            <strong>{fileName}</strong>
            <p>{fileType === "application/pdf" ? "PDF ready for retrieval." : "File ready for retrieval."}</p>
          </div>
        )}
      </div>
      <div className="button-row">
        {showImagePreview ? (
          <Button disabled={disabled} onClick={onRotate} size="sm" variant="secondary">
            Rotate
          </Button>
        ) : null}
        <Button disabled={disabled} onClick={onRetake} size="sm" variant="secondary">
          Retake
        </Button>
      </div>
    </>
  );
}
