import { Badge } from "@/components/ui/Controls";

const LABELS: Record<
  string,
  { label: string; tone: "neutral" | "success" | "warning" | "danger" }
> = {
  pending: { label: "Not started", tone: "neutral" },
  in_progress: { label: "In progress", tone: "warning" },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "danger" },
};

export function TaskStatusBadge({ status }: { status: string }) {
  const entry = LABELS[status] ?? { label: status, tone: "neutral" as const };
  return <Badge tone={entry.tone}>{entry.label}</Badge>;
}

/** A due date is only "overdue" while the task is still open. */
export function isOverdue(dueDate: string | null, status: string): boolean {
  if (!dueDate || status === "completed" || status === "cancelled") return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

export function DueDate({
  dueDate,
  status,
}: {
  dueDate: string | null;
  status: string;
}) {
  if (!dueDate) return <span className="text-muted">No due date</span>;
  const overdue = isOverdue(dueDate, status);
  return (
    <span className={overdue ? "font-medium text-danger" : ""}>
      {new Date(dueDate).toLocaleDateString("en-GB")}
      {overdue ? " · overdue" : ""}
    </span>
  );
}
