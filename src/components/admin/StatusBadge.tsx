import { Badge } from "@/components/ui/Controls";

/**
 * Account status (spec 6.2).
 *
 * Hold and Deactive block access identically, so the colours differ only to
 * signal intent — a pause versus an ended relationship — which is the only
 * thing separating them.
 */
export function StatusBadge({ status }: { status: string }) {
  if (status === "active") return <Badge tone="success">Active</Badge>;
  if (status === "hold") return <Badge tone="warning">On hold</Badge>;
  if (status === "deactive") return <Badge tone="danger">Deactivated</Badge>;
  return <Badge>{status}</Badge>;
}
