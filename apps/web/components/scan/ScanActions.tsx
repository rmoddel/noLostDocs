import { Button } from "../ui/Button";

type ScanActionsProps = {
  canSave: boolean;
  loading: boolean;
  onSave: () => void;
};

export function ScanActions({ canSave, loading, onSave }: ScanActionsProps) {
  return (
    <Button disabled={!canSave || loading} onClick={onSave}>
      {loading ? "Saving..." : "Save scan"}
    </Button>
  );
}
