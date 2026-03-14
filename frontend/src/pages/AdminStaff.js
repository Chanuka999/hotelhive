import { useEffect, useMemo, useState } from "react";
import adminService from "../services/adminService";
import { formatDate } from "../utils/format";

const staffRoleOptions = ["staff", "staff_manager", "staff_support"];
const permissionOptions = [
  "manage_bookings",
  "manage_reviews",
  "manage_payments",
  "manage_rooms",
  "manage_customers",
  "view_reports",
];

const createInitialForm = () => ({
  name: "",
  email: "",
  password: "",
  phone: "",
  role: "staff",
  permissions: [],
});

function AdminStaff() {
  const [staffRows, setStaffRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(createInitialForm());
  const [draftAccess, setDraftAccess] = useState({});

  const loadStaff = async () => {
    try {
      setLoading(true);
      const rows = await adminService.getStaff();
      const normalized = Array.isArray(rows) ? rows : [];
      setStaffRows(normalized);
      setDraftAccess(
        normalized.reduce((acc, staff) => {
          acc[staff._id] = {
            role: staff.role,
            permissions: Array.isArray(staff.permissions)
              ? staff.permissions
              : [],
            isBlocked: Boolean(staff.isBlocked),
          };
          return acc;
        }, {}),
      );
    } catch (error) {
      setMessage(error?.response?.data?.error || "Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const filteredStaff = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return staffRows;
    }

    return staffRows.filter((staff) => {
      const name = String(staff.name || "").toLowerCase();
      const email = String(staff.email || "").toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [search, staffRows]);

  const togglePermission = (permissions, value) => {
    if (permissions.includes(value)) {
      return permissions.filter((item) => item !== value);
    }
    return [...permissions, value];
  };

  const createStaff = async (event) => {
    event.preventDefault();

    try {
      setMessage("");
      const created = await adminService.addStaff(form);
      setStaffRows((current) => [created, ...current]);
      setDraftAccess((current) => ({
        ...current,
        [created._id]: {
          role: created.role,
          permissions: created.permissions || [],
          isBlocked: Boolean(created.isBlocked),
        },
      }));
      setForm(createInitialForm());
      setMessage("Staff member added");
    } catch (error) {
      setMessage(error?.response?.data?.error || "Failed to add staff");
    }
  };

  const saveAccess = async (staff) => {
    const draft = draftAccess[staff._id];
    if (!draft) {
      return;
    }

    try {
      setMessage("");
      const updated = await adminService.updateStaffAccess(staff._id, draft);
      setStaffRows((current) =>
        current.map((item) =>
          item._id === staff._id ? { ...item, ...updated } : item,
        ),
      );
      setMessage("Staff access updated");
    } catch (error) {
      setMessage(error?.response?.data?.error || "Failed to update access");
    }
  };

  const removeStaff = async (staff) => {
    const shouldDelete = window.confirm(
      `Delete staff account for ${staff.name}?`,
    );
    if (!shouldDelete) {
      return;
    }

    try {
      setMessage("");
      await adminService.deleteStaff(staff._id);
      setStaffRows((current) =>
        current.filter((item) => item._id !== staff._id),
      );
      setMessage("Staff member deleted");
    } catch (error) {
      setMessage(error?.response?.data?.error || "Failed to delete staff");
    }
  };

  return (
    <section className="container-pad py-10">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-4xl">Admin Staff Management</h1>
          <p className="text-brand-ink/75 dark:text-slate-300">
            Add staff, assign roles, and manage staff permissions.
          </p>
        </div>

        <div className="w-full max-w-sm">
          <label className="mb-1 block text-sm font-medium">Search staff</label>
          <input
            className="w-full rounded-xl border border-brand-ink/20 bg-white px-3 py-2"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email"
            value={search}
          />
        </div>
      </div>

      {message ? (
        <div className="mb-4 rounded-2xl border border-brand-ink/10 bg-white/80 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900/60">
          {message}
        </div>
      ) : null}

      <div className="mb-6 panel p-5 md:p-6">
        <h2 className="mb-4 text-lg font-semibold">Add Staff Member</h2>
        <form className="space-y-4" onSubmit={createStaff}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <input
              className="rounded-xl border border-brand-ink/20 bg-white px-3 py-2"
              placeholder="Full name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              required
            />
            <input
              className="rounded-xl border border-brand-ink/20 bg-white px-3 py-2"
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              required
            />
            <input
              className="rounded-xl border border-brand-ink/20 bg-white px-3 py-2"
              placeholder="Password"
              type="password"
              minLength={6}
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              required
            />
            <input
              className="rounded-xl border border-brand-ink/20 bg-white px-3 py-2"
              placeholder="Phone"
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Role</label>
              <select
                className="w-full rounded-xl border border-brand-ink/20 bg-white px-3 py-2"
                value={form.role}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    role: event.target.value,
                  }))
                }
              >
                {staffRoleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Permissions
              </label>
              <div className="grid gap-2 rounded-xl border border-brand-ink/15 bg-white/60 p-3 text-sm dark:border-slate-700 dark:bg-slate-900/50">
                {permissionOptions.map((permission) => (
                  <label key={permission} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.permissions.includes(permission)}
                      onChange={() =>
                        setForm((current) => ({
                          ...current,
                          permissions: togglePermission(
                            current.permissions,
                            permission,
                          ),
                        }))
                      }
                    />
                    {permission}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <button className="btn-primary" type="submit">
            Add Staff
          </button>
        </form>
      </div>

      <div className="panel p-5 md:p-6">
        <h2 className="mb-4 text-lg font-semibold">Staff Members</h2>

        {loading ? (
          <p className="text-sm text-brand-ink/70 dark:text-slate-300">
            Loading staff...
          </p>
        ) : filteredStaff.length === 0 ? (
          <p className="text-sm text-brand-ink/70 dark:text-slate-300">
            No staff members found.
          </p>
        ) : (
          <div className="space-y-4">
            {filteredStaff.map((staff) => {
              const draft = draftAccess[staff._id] || {
                role: staff.role,
                permissions: staff.permissions || [],
                isBlocked: Boolean(staff.isBlocked),
              };

              return (
                <article
                  key={staff._id}
                  className="rounded-2xl border border-brand-ink/10 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/65"
                >
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{staff.name}</p>
                      <p className="text-sm text-brand-ink/70 dark:text-slate-300">
                        {staff.email}
                      </p>
                      <p className="text-xs text-brand-ink/60 dark:text-slate-400">
                        Joined: {formatDate(staff.createdAt)}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        draft.isBlocked
                          ? "bg-red-100 text-red-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {draft.isBlocked ? "Blocked" : "Active"}
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Role
                      </label>
                      <select
                        className="w-full rounded-xl border border-brand-ink/20 bg-white px-3 py-2"
                        value={draft.role}
                        onChange={(event) =>
                          setDraftAccess((current) => ({
                            ...current,
                            [staff._id]: {
                              ...draft,
                              role: event.target.value,
                            },
                          }))
                        }
                      >
                        {staffRoleOptions.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <input
                          type="checkbox"
                          checked={draft.isBlocked}
                          onChange={(event) =>
                            setDraftAccess((current) => ({
                              ...current,
                              [staff._id]: {
                                ...draft,
                                isBlocked: event.target.checked,
                              },
                            }))
                          }
                        />
                        Block this staff account
                      </label>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 rounded-xl border border-brand-ink/15 bg-white/60 p-3 text-sm dark:border-slate-700 dark:bg-slate-900/50">
                    {permissionOptions.map((permission) => (
                      <label
                        key={permission}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          checked={draft.permissions.includes(permission)}
                          onChange={() =>
                            setDraftAccess((current) => ({
                              ...current,
                              [staff._id]: {
                                ...draft,
                                permissions: togglePermission(
                                  draft.permissions,
                                  permission,
                                ),
                              },
                            }))
                          }
                        />
                        {permission}
                      </label>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      className="btn-secondary"
                      onClick={() => saveAccess(staff)}
                      type="button"
                    >
                      Save Access
                    </button>
                    <button
                      className="rounded-xl bg-brand-coral px-4 py-2 text-sm font-medium text-white"
                      onClick={() => removeStaff(staff)}
                      type="button"
                    >
                      Delete Staff
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default AdminStaff;
