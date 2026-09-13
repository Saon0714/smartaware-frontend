"use client";

import Link from "next/link";
import { useState } from "react";

import { ServicesCell } from "@/components/admin/ServicesCell";
import { StatusCell } from "@/components/admin/StatusCell";
import { useAsync } from "@/components/admin/useAsync";
import { Select } from "@/components/ui/Controls";
import { EmptyState, PageHeader } from "@/components/ui/Controls";
import { FormBanner, Input } from "@/components/ui/Field";
import { useSession } from "@/lib/auth/SessionProvider";
import {
  listClientFilterOptions,
  listClients,
  listStaff,
  type ClientFilters,
} from "@/lib/api/admin";

/**
 * Client list.
 *
 * Section 6.2 requires the assigned manager to be visible alongside each user,
 * so it is a column rather than something you open a record to discover. The
 * services a client takes and the country they are in sit beside it for the
 * same reason — they are what SmartAWARE sorts the book of business by.
 *
 * Each client appears exactly once, with all of their services on that row,
 * including when filtering by one of them. The filter is a subquery rather than
 * a join for precisely that reason.
 *
 * A Manager sees only their own clients here — enforced by the API, not by this
 * page, so the filters below narrow a list that is already scoped. The filter
 * options are scoped the same way, so the countries offered are the ones the
 * caller's own clients are in.
 */
export default function ClientsPage() {
  const { user } = useSession();
  const isAdmin = user?.role === "admin";

  const [filters, setFilters] = useState<ClientFilters>({});
  const [search, setSearch] = useState("");

  const key = JSON.stringify(filters);
  const clients = useAsync(() => listClients(filters), key);
  const staff = useAsync(() => listStaff(true), "staff");
  const options = useAsync(() => listClientFilterOptions(), "client-filters");

  const rows = clients.data ?? [];
  const countries = options.data?.countries ?? [];
  const services = options.data?.services ?? [];

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Every client account, with the services it takes, its country, assigned manager and status."
        actions={
          <Link
            href="/admin/invites"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Invite a client
          </Link>
        }
      />

      {clients.error && (
        <div className="mt-4">
          <FormBanner tone="error">{clients.error}</FormBanner>
        </div>
      )}

      <form
        className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_1fr]"
        onSubmit={(event) => {
          event.preventDefault();
          setFilters((f) => ({ ...f, search }));
        }}
      >
        <Input
          aria-label="Search clients"
          placeholder="Search by company, owner or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          aria-label="Filter by service"
          value={filters.serviceId ?? ""}
          onChange={(e) =>
            setFilters((f) => ({ ...f, serviceId: e.target.value || undefined }))
          }
        >
          <option value="">All services</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
              {service.is_archived ? " (archived)" : ""}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filter by country"
          value={filters.country ?? ""}
          onChange={(e) =>
            setFilters((f) => ({ ...f, country: e.target.value || undefined }))
          }
        >
          <option value="">All countries</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filter by status"
          value={filters.status ?? ""}
          onChange={(e) =>
            setFilters((f) => ({ ...f, status: e.target.value as ClientFilters["status"] }))
          }
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="hold">On hold</option>
          <option value="deactive">Deactivated</option>
        </Select>
        <Select
          aria-label="Filter by manager"
          value={filters.unassigned ? "__unassigned" : (filters.managerId ?? "")}
          onChange={(e) => {
            const value = e.target.value;
            setFilters((f) => ({
              ...f,
              unassigned: value === "__unassigned",
              managerId: value === "__unassigned" ? undefined : value || undefined,
            }));
          }}
        >
          <option value="">All managers</option>
          <option value="__unassigned">Unassigned</option>
          {(staff.data ?? []).map((member) => (
            <option key={member.id} value={member.id}>
              {member.full_name ?? member.email}
            </option>
          ))}
        </Select>
      </form>

      {clients.loading && <p className="mt-6 text-sm text-muted">Loading…</p>}
      {!clients.loading && rows.length === 0 && (
        <div className="mt-6">
          <EmptyState>
            No clients match. Accounts are created by invitation — use “Invite a
            client” to add one.
          </EmptyState>
        </div>
      )}

      {rows.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[56rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="py-2 pr-4 font-medium">Client</th>
                <th className="py-2 pr-4 font-medium">Services</th>
                <th className="py-2 pr-4 font-medium">Country</th>
                <th className="py-2 pr-4 font-medium">Manager</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 font-medium">Last sign-in</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((client) => (
                <tr
                  key={client.id}
                  className="border-b border-border align-top last:border-0 hover:bg-surface"
                >
                  <td className="py-3 pr-4">
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {client.company_name ?? client.user_email}
                    </Link>
                    <p className="text-xs text-muted">{client.user_email}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <ServicesCell
                      clientId={client.id}
                      services={client.services}
                      options={services}
                      onChanged={() =>
                        Promise.all([clients.reload(), options.reload()]).then(
                          () => undefined,
                        )
                      }
                    />
                  </td>
                  <td className="py-3 pr-4">
                    {client.country || <span className="text-muted">—</span>}
                  </td>
                  <td className="py-3 pr-4">
                    {client.assigned_manager ? (
                      client.assigned_manager.full_name ?? client.assigned_manager.email
                    ) : (
                      <span className="text-muted">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <StatusCell
                      clientId={client.id}
                      status={client.status}
                      canEdit={isAdmin}
                      onChanged={() =>
                        // The filter options can move with the data — a country
                        // does not change here, but a status filter in force can
                        // mean the row this just edited no longer belongs.
                        Promise.all([clients.reload(), options.reload()]).then(() => undefined)
                      }
                    />
                  </td>
                  <td className="py-3 text-muted">
                    {client.last_login_at
                      ? new Date(client.last_login_at).toLocaleDateString("en-GB")
                      : "Never"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
