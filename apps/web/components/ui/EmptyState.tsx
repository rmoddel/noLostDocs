import { Card } from "./Card";

type EmptyStateProps = {
  title: string;
  body: string;
};

export function EmptyState({ body, title }: EmptyStateProps) {
  return (
    <Card className="empty-state">
      <h2>{title}</h2>
      <p>{body}</p>
    </Card>
  );
}
