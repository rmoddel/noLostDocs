import { Button } from "../ui/Button";

type ScanPreviewProps = {
  disabled: boolean;
  onRetake: () => void;
  onRotate: () => void;
  previewUrl: string | null;
  rotation: number;
};

export function ScanPreview({ disabled, onRetake, onRotate, previewUrl, rotation }: ScanPreviewProps) {
  if (!previewUrl) {
    return null;
  }

  return (
    <>
      <div className="scan-preview">
        <img alt="Scan preview" src={previewUrl} style={{ transform: `rotate(${rotation}deg)` }} />
      </div>
      <div className="button-row">
        <Button disabled={disabled} onClick={onRotate} size="sm" variant="secondary">
          Rotate
        </Button>
        <Button disabled={disabled} onClick={onRetake} size="sm" variant="secondary">
          Retake
        </Button>
      </div>
    </>
  );
}
