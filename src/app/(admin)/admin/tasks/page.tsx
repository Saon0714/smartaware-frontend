"use client";

import { useState } from "react";

import { describeError, useAsync } from "@/components/admin/useAsync";
import { DueDate, TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import { Button } from "@/components/ui/Button";
import {
  Badge, EmptyState, PageHeader, Select, Textarea,
} from "@/components/ui/Controls";
import { FormBanner, Input, Label } from "@/components/ui/Field";
import { listClients, listStaff } from "@/lib/api/admin";
import {
  archiveTask, completeTask, createTask, getTaskCounts, listTasks, reopenTask,
  restoreTask, updateTask, type Task, type TaskFilters,
} from "@/lib/api/tasks";
import { useSession } from "@/lib/auth/SessionProvider";

/**
 * Staff task board.
 *
 * A Manager's list is already scoped by the API, so the filters narrow what
 * they were entitled to see. Deletion is Admin-only and the API refuses a
 * Manager regardless of what is rendered here.
 */
export default function TasksPage() {
  const { user } = useSession();
  const isAdmin = user?.role === "admin";

  const [filters, setFilters] = useState<TaskFilters>({});
  const [search, setSearch] = useState("");
  const key = JSON.stringify(filters);

  const tasks = useAsync(() => listTasks(filters), key);
  const counts = useAsync(() => getTaskCounts(), key);
  const clients = useAsync(() => listClients(), "clients");
  const staff = useAsync(() => listStaff(true), "staff");

  const [creating, setCreating] = useState(false);
  const [completing, setCompleting] = useState<Task | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = tasks.data ?? [];

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    tasks.setError(null);
    try {
      await action();
      await Promise.all([tasks.reload(), counts.reload()]);
      return true;
    } catch (err) {
      tasks.setError(describeError(err));
      return false;
    } finally {
      setBusy(false);
    }
  }

  const summary = counts.data;

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Work in progress across your clients."
        actions={
          <Button onClick={() => setCreating((v) => !v)} disabled={busy}>
            New task
          </Button>
        }
      />

      {tasks.error && (
        <div className="mt-4">
          <FormBanner tone="error">{tasks.error}</FormBanner>
        </div>
      )}

      {summary && (
        <dl className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            ["Open", summary.pending + summary.in_progress],
            ["In progress", summary.in_progress],
            ["Overdue", summary.overdue],
            ["Completed", summary.completed],
            ["Total", summary.total],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-lg border border-border p-4">
              <dt className="text-xs text-muted">{label}</dt>
              <dd
                className={`mt-1 text-2xl font-semibold ${
                  label === "Overdue" && Number(value) > 0 ? "text-danger" : ""
                }`}
              >
                {value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {creating && (
        <TaskForm
          clients={(clients.data ?? []).map((c) => ({
            id: c.id,
            label: `${c.company_name ?? c.user_email} (${c.client_ref})`,
            status: c.status,
          }))}
          staff={(staff.data ?? []).map((s) => ({
            id: s.id,
            label: s.full_name ?? s.email,
          }))}
          busy={busy}
          onCancel={() => setCreating(false)}
          onSubmit={async (values) => {
            const ok = await run(() => createTask(values));
            if (ok) setCreating(false);
          }}
        />
      )}

      <form
        className="mt-6 grid gap-3 sm:grid-cols-[2fr_1fr_1fr]"
        onSubmit={(e) => {
          e.preventDefault();
          setFilters((f) => ({ ...f, search }));
        }}
      >
        <Input
          aria-label="Search tasks"
          placeholder="Search by title or description"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          aria-label="Filter by status"
          value={filters.status ?? ""}
          onChange={(e) =>
            setFilters((f) => ({ ...f, status: e.target.value as TaskFilters["status"] }))
          }
        >
          <option value="">All statuses</option>
          <option value="pending">Not started</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
        <Select
          aria-label="Filter by client"
          value={filters.clientId ?? ""}
          onChange={(e) =>
            setFilters((f) => ({ ...f, clientId: e.target.value || undefined }))
          }
        >
          <option value="">All clients</option>
          {(clients.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.company_name ?? c.user_email}
            </option>
          ))}
        </Select>
      </form>

      {tasks.loading && <p className="mt-6 text-sm text-muted">Loading…</p>}
      {!tasks.loading && rows.length === 0 && (
        <div className="mt-6">
          <EmptyState>No tasks match these filters.</EmptyState>
        </div>
      )}

      <ul className="mt-6 space-y-2">
        {rows.map((task) => (
          <li key={task.id} className="rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{task.title}</p>
                  <TaskStatusBadge status={task.status} />
                  {task.is_archived && <Badge tone="danger">Archived</Badge>}
                  {task.service_category_name && (
                    <Badge>{task.service_category_name}</Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">
                  {task.client_company_name ?? task.client_ref} ·{" "}
                  <DueDate dueDate={task.due_date} status={task.status} />
                  {task.assigned_manager
                    ? ` · ${task.assigned_manager.full_name ?? task.assigned_manager.email}`
                    : " · unassigned"}
                </p>
                {task.description && (
                  <p className="mt-2 text-sm text-muted">{task.description}</p>
                )}
                {task.completed_at && (
                  <p className="mt-2 rounded-md bg-surface p-3 text-sm">
                    <span className="font-medium">Completed</span>{" "}
                    {new Date(task.completed_at).toLocaleString("en-GB")}
                    {task.completed_by
                      ? ` by ${task.completed_by.full_name ?? task.completed_by.email}`
                      : ""}
                    <br />
                    <span className="text-muted">{task.completed_note}</span>
                  </p>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                {task.is_archived ? (
                  isAdmin && (
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={() => void run(() => restoreTask(task.id))}
                    >
                      Restore
                    </Button>
                  )
                ) : (
                  <>
                    {task.completed_at ? (
                      <Button
                        variant="secondary"
                        disabled={busy}
                        onClick={() => void run(() => reopenTask(task.id))}
                      >
                        Reopen
                      </Button>
                    ) : (
                      <>
                        {task.status === "pending" && (
                          <Button
                            variant="secondary"
                            disabled={busy}
                            onClick={() =>
                              void run(() =>
                                updateTask(task.id, { status: "in_progress" }),
                              )
                            }
                          >
                            Start
                          </Button>
                        )}
                        <Button disabled={busy} onClick={() => setCompleting(task)}>
                          Complete
                        </Button>
                      </>
                    )}
                    {isAdmin && (
                      <Button
                        variant="secondary"
                        disabled={busy}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Archive “${task.title}”? It is removed from the client's view but kept as a record of the work, and can be restored.`,
                            )
                          ) {
                            void run(() => archiveTask(task.id));
                          }
                        }}
                      >
                        Archive
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {completing && (
        <CompleteDialog
          task={completing}
          busy={busy}
          onCancel={() => setCompleting(null)}
          onSubmit={async (note) => {
            const ok = await run(() => completeTask(completing.id, note));
            if (ok) setCompleting(null);
          }}
        />
      )}
    </div>
  );
}

function CompleteDialog({
  task,
  busy,
  onSubmit,
  onCancel,
}: {
  task: Task;
  busy: boolean;
  onSubmit: (note: string) => void;
  onCancel: () => void;
}) {
  const [note, setNote] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Complete task"
        className="w-full max-w-lg rounded-lg border border-border bg-bg p-6"
      >
        <h2 className="text-lg font-semibold tracking-tight">Complete task</h2>
        <p className="mt-1 text-sm text-muted">{task.title}</p>

        <form
          className="mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(note);
          }}
        >
          <Label htmlFor="note">
            Completion note<span className="text-danger"> *</span>
          </Label>
          <Textarea
            id="note"
            required
            minLength={3}
            rows={5}
            autoFocus
            placeholder="What was done? The client sees this."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <p className="mt-2 text-xs text-muted">
            The completion time is recorded automatically and cannot be edited.
            The client is emailed this note.
          </p>

          <div className="mt-5 flex gap-2">
            <Button type="submit" loading={busy} disabled={note.trim().length < 3}>
              Mark complete
            </Button>
            <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TaskForm({
  clients,
  staff,
  busy,
  onSubmit,
  onCancel,
}: {
  clients: { id: string; label: string; status: string }[];
  staff: { id: string; label: string }[];
  busy: boolean;
  onSubmit: (values: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    client_id: "", title: "", description: "", due_date: "", assigned_manager_id: "",
  });
  const chosen = clients.find((c) => c.id === form.client_id);

  return (
    <form
      className="mt-6 rounded-lg border border-border bg-surface p-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          client_id: form.client_id,
          title: form.title,
          description: form.description || null,
          due_date: form.due_date || null,
          assigned_manager_id: form.assigned_manager_id || null,
        });
      }}
    >
      <h2 className="font-medium">New task</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="client">
            Client<span className="text-danger"> *</span>
          </Label>
          <Select
            id="client"
            required
            value={form.client_id}
            onChange={(e) => setForm({ ...form, client_id: e.target.value })}
          >
            <option value="">Choose a client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
                {c.status !== "active" ? ` — ${c.status}` : ""}
              </option>
            ))}
          </Select>
          {chosen && chosen.status !== "active" && (
            <p className="mt-1 text-xs text-danger">
              This account is {chosen.status}. No work can be recorded against it
              until an administrator sets it back to active.
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="assignee">Assign to</Label>
          <Select
            id="assignee"
            value={form.assigned_manager_id}
            onChange={(e) => setForm({ ...form, assigned_manager_id: e.target.value })}
          >
            <option value="">Unassigned</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="title">
            Title<span className="text-danger"> *</span>
          </Label>
          <Input
            id="title"
            required
            minLength={3}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <p className="mt-1 text-xs text-muted">The client can see this.</p>
        </div>
        <div>
          <Label htmlFor="due">Due date</Label>
          <Input
            id="due"
            type="date"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          />
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        <Button type="submit" loading={busy} disabled={!form.client_id || !form.title}>
          Create task
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
