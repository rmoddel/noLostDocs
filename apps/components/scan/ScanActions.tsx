import { Button } from "../ui/Button";

type ScanActionsProps = {
  actionLabel?: string;
  canAct: boolean;
  loading: boolean;
  onAction: () => void;
};

export function ScanActions({ actionLabel = "Save record", canAct, loading, onAction }: ScanActionsProps) {
  return (
    <Button disabled={!canAct || loading} onClick={onAction}>
      {loading ? "Saving..." : actionLabel}
    </Button>
  );
}
