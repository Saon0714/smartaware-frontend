"use client";

import { useState } from "react";

import { useAsync } from "@/components/admin/useAsync";
import { DueDate, TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import { Badge, EmptyState, PageHeader } from "@/components/ui/Controls";
import { FormBanner } from "@/components/ui/Field";
import { getMyTaskCounts, listMyTasks } from "@/lib/api/tasks";

/**
 * The client's view of their work — spec Section 5.3.B.
 *
 * Read-only, with no controls at all: clients cannot create, edit, complete or
 * delete tasks, and the API has no route that would let them. Status changes
 * appear here only once SmartAWARE records them.
 */
export default function MyTasksPage() {
  const [filter, setFilter] = useState<"open" | "completed" | "all">("open");

  const tasks = useAsync(
    () => listMyTasks(filter === "completed" ? "completed" : undefined),
    filter,
  );
  const counts = useAsync(getMyTaskCounts, "counts");

  const all = tasks.data ?? [];
  const rows =
    filter === "open"
      ? all.filter((t) => t.status !== "completed" && t.status !== "cancelled")
      : all;

  const summary = counts.data;

  return (
    <div>
      <PageHeader
        title="Work status"
        description="What SmartAWARE is doing for you, and what has been completed."
        actions={
          <div className="flex gap-1 rounded-md border border-border p-1">
            {(["open", "completed", "all"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded px-3 py-1.5 text-sm capitalize transition-colors ${
                  filter === key ? "bg-surface font-medium text-primary" : "text-muted"
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        }
      />

      {tasks.error && (
        <div className="mt-4">
          <FormBanner tone="error">{tasks.error}</FormBanner>
        </div>
      )}

      {summary && summary.total > 0 && (
        <dl className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            ["In progress", summary.in_progress],
            ["Awaiting start", summary.pending],
            ["Completed", summary.completed],
          ].map(([label, value]) => (
            <div key={String(label)} className="sa-card rounded-lg border border-border p-4">
              <dt className="text-xs text-muted">{label}</dt>
              <dd className="mt-1 text-2xl font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {tasks.loading && <p className="mt-6 text-sm text-muted">Loading…</p>}
      {!tasks.loading && rows.length === 0 && (
        <div className="mt-6">
          <EmptyState>
            {filter === "open"
              ? "Nothing in progress at the moment. We will update this as work begins."
              : "Nothing to show here yet."}
          </EmptyState>
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {rows.map((task) => (
          <li key={task.id} className="sa-card rounded-lg border border-border p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-medium">{task.title}</h2>
                  <TaskStatusBadge status={task.status} />
                  {task.service_category_name && (
                    <Badge>{task.service_category_name}</Badge>
                  )}
                </div>
                {task.description && (
                  <p className="mt-2 text-sm text-muted">{task.description}</p>
                )}
              </div>
              <p className="shrink-0 text-sm">
                <DueDate dueDate={task.due_date} status={task.status} />
              </p>
            </div>

            {task.completed_at && (
              <div className="mt-4 rounded-md border border-success/30 bg-success/5 p-4">
                <p className="text-sm font-medium text-success">
                  Completed {new Date(task.completed_at).toLocaleDateString("en-GB")}
                  {task.completed_by_name ? ` by ${task.completed_by_name}` : ""}
                </p>
                {task.completed_note && (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted">
                    {task.completed_note}
                  </p>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      <p className="mt-8 text-xs text-muted">
        Tasks are managed by the SmartAWARE team. If something looks wrong,
        please get in touch.
      </p>
    </div>
  );
}
